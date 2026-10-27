"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkFace, checkImageQuality, checkSelfie, initFaceDetector, type CheckResult } from "@/lib/actions/faceCheck";
import { clientLog, describeError } from "@/lib/client-log";
import { withTimeout } from "@/lib/utils";

export type CaptureStatus =
  | "idle"            // camera not started yet
  | "starting-camera" // acquiring the camera and starting playback
  | "streaming"       // live camera feed, scanning frames in the background
  | "checking"        // running final checks on the captured frame
  | "ready"           // passed checks, blob ready to submit
  | "rejected"        // final capture failed checks
  | "camera-error";   // getUserMedia or playback failed (permissions, no device, etc.)

/**
 * The face detector loads independently of the camera and never blocks it.
 * It's a separate download that can be slow or fail outright on some
 * networks, and it only powers framing guidance and auto-capture, while the real
 * identity check happens server-side. Without it, capture falls back to the
 * brightness/blur checks plus a manual button.
 */
export type DetectorState = "loading" | "ready" | "unavailable";

const SCAN_INTERVAL_MS = 350;
const CONSECUTIVE_PASSES_REQUIRED = 4; // ~1.4s of stable framing before auto-capture
const SCAN_SIZE = 320; // small canvas for the live scan loop — keeps CPU cost low

// In-app browsers can leave getUserMedia pending forever (it neither resolves
// nor rejects), and a stalled download behaves the same way, so every await
// that depends on the browser or the network is bounded.
const GET_USER_MEDIA_TIMEOUT_MS = 15_000;
const VIDEO_PLAY_TIMEOUT_MS = 10_000;
const DETECTOR_TIMEOUT_MS = 60_000; // doesn't block anything, so it can be generous

/** Waits for the face detector and reports how it went. Never rejects. */
async function loadDetector(): Promise<DetectorState> {
  const startedAt = performance.now();
  try {
    await withTimeout(initFaceDetector(), DETECTOR_TIMEOUT_MS);
    console.info(`[selfie] face detector ready in ${Math.round(performance.now() - startedAt)}ms`);
    return "ready";
  } catch (err) {
    console.error("[selfie] face detector unavailable — continuing with manual capture:", err);
    clientLog("detector_unavailable", { ms: Math.round(performance.now() - startedAt), error: describeError(err) });
    return "unavailable";
  }
}

/**
 * Draws the video's centre square into the canvas, optionally scaled to `size`.
 *
 * The preview renders the video with `object-cover` in a square container, so
 * the centre square is exactly the region the user sees. Scaling the whole
 * frame into a square instead (webcams commonly hand back 4:3 or 16:9 despite
 * an `ideal` square constraint) would squash faces for the detector and skew
 * the framing maths against a view that never matched what was on screen.
 */
function drawCenterSquare(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  size?: number
): CanvasRenderingContext2D | null {
  const side = Math.min(video.videoWidth, video.videoHeight);
  if (!side) return null;

  const sx = (video.videoWidth - side) / 2;
  const sy = (video.videoHeight - side) / 2;
  const target = size ?? side;

  // Assigning width/height resets the canvas, so only touch it on a change.
  if (canvas.width !== target || canvas.height !== target) {
    canvas.width = target;
    canvas.height = target;
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, sx, sy, side, side, 0, 0, target, target);
  return ctx;
}

export interface UseSelfieCaptureResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: CaptureStatus;
  detectorState: DetectorState;
  reasons: string[];        // reasons for the last final capture (rejected/ready)
  liveReasons: string[];    // real-time feedback while streaming, e.g. "move closer"
  progress: number;         // 0..1 — how close auto-capture is to firing
  capturedBlob: Blob | null;
  startCamera: () => Promise<void>;
  capture: () => Promise<void>; // manual capture — the path used while the detector isn't ready
  retake: () => Promise<void>;
}

export function useSelfieCapture(): UseSelfieCaptureResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const consecutivePassesRef = useRef(0);
  const capturingRef = useRef(false); // guards against double-fire while capture() is in flight
  const tickInProgressRef = useRef(false);

  // Mirrored in a ref so the scan loop and capture() — stable callbacks that
  // outlive any single render — always read the current value.
  const detectorStateRef = useRef<DetectorState>("loading");

  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [detectorState, setDetectorStateValue] = useState<DetectorState>("loading");
  const [reasons, setReasons] = useState<string[]>([]);
  const [liveReasons, setLiveReasons] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const setDetectorState = useCallback((state: DetectorState) => {
    detectorStateRef.current = state;
    setDetectorStateValue(state);
  }, []);

  useEffect(() => {
    scanCanvasRef.current ??= document.createElement("canvas"); // sized by drawCenterSquare

    // Start on mount, in the background, so the download has a head start
    // before the user taps "Take Selfie" — but nothing waits on it.
    void loadDetector().then(setDetectorState);

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, [setDetectorState]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const capture = useCallback(async () => {
    if (capturingRef.current) return;
    capturingRef.current = true;

    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      capturingRef.current = false;
      return;
    }

    setStatus("checking");

    const ctx = drawCenterSquare(video, canvas);
    if (!ctx) {
      setReasons(["Couldn't process the photo. Please try again."]);
      setStatus("rejected");
      capturingRef.current = false;
      return;
    }

    // Frame is frozen on the canvas — release the camera now so it isn't
    // held open (competing for memory/CPU with the checks and upload that
    // follow) on low-memory devices. retake() reacquires it if needed.
    stopStream();

    const withFaceCheck = detectorStateRef.current === "ready";
    const result: CheckResult = withFaceCheck
      ? await checkSelfie(canvas)
      : checkImageQuality(canvas);

    if (!result.passed) {
      clientLog("capture_rejected", { withFaceCheck, reasons: result.reasons.join(" | ") });
      // The camera is already released; Retake reacquires it and resumes.
      setReasons(result.reasons);
      setStatus("rejected");
      capturingRef.current = false;
      return;
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    clientLog("capture_done", { withFaceCheck, size: canvas.width, bytes: blob?.size ?? null });
    setCapturedBlob(blob);
    setReasons([]);
    setStatus("ready");
    capturingRef.current = false;
  }, [stopStream]);

  const runScanTick = useCallback(async () => {
    const video = videoRef.current;
    const scanCanvas = scanCanvasRef.current;
    if (!video || !scanCanvas || video.readyState < 2 || capturingRef.current || tickInProgressRef.current) return;

    tickInProgressRef.current = true;

    try {
      if (!drawCenterSquare(video, scanCanvas, SCAN_SIZE)) return;

      const quality: CheckResult = checkImageQuality(scanCanvas);

      if (detectorStateRef.current !== "ready") {
        // Lighting/sharpness guidance only, and no auto-capture: without face
        // detection it would fire on any well-lit, in-focus frame, face or not.
        consecutivePassesRef.current = 0;
        setLiveReasons(quality.reasons);
        setProgress(0);
        return;
      }

      const combined = quality.passed ? await checkFace(scanCanvas) : quality;

      if (combined.passed) {
        consecutivePassesRef.current += 1;
      } else {
        consecutivePassesRef.current = 0;
      }

      setLiveReasons(combined.reasons);
      setProgress(Math.min(consecutivePassesRef.current / CONSECUTIVE_PASSES_REQUIRED, 1));

      if (consecutivePassesRef.current >= CONSECUTIVE_PASSES_REQUIRED) {
        consecutivePassesRef.current = 0;
        capture();
      }
    } catch (err) {
      // Swallowed deliberately: this runs on an interval, so rethrowing would
      // raise an unhandled rejection every tick without changing anything the
      // user sees. A failing tick just means no progress on this frame.
      console.error("[selfie] scan tick failed:", err);
    }
    finally {
      tickInProgressRef.current = false;
    }
  }, [capture]);

  const startCamera = useCallback(async () => {
    setStatus("starting-camera");

    let stream: MediaStream;
    try {
      const startedAt = performance.now();
      stream = await withTimeout(
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        }),
        GET_USER_MEDIA_TIMEOUT_MS
      );
      const ms = Math.round(performance.now() - startedAt);
      console.info(`[selfie] camera acquired in ${ms}ms`);
      clientLog("camera_acquired", { ms });
    } catch (err) {
      console.error("[selfie] getUserMedia failed:", err);
      clientLog("camera_failed", { error: describeError(err) });
      setStatus("camera-error");
      return;
    }

    streamRef.current = stream;

    try {
      if (videoRef.current) {
        const startedAt = performance.now();
        videoRef.current.srcObject = stream;
        await withTimeout(videoRef.current.play(), VIDEO_PLAY_TIMEOUT_MS);
        console.info(`[selfie] video playing in ${Math.round(performance.now() - startedAt)}ms`);
      }
    } catch (err) {
      console.error("[selfie] video.play() failed:", err);
      clientLog("video_play_failed", { error: describeError(err) });
      stopStream();
      setStatus("camera-error");
      return;
    }

    setStatus("streaming");
    consecutivePassesRef.current = 0;
    setProgress(0);
    setLiveReasons([]);
    scanTimerRef.current = setInterval(runScanTick, SCAN_INTERVAL_MS);
  }, [runScanTick, stopStream]);

  const retake = useCallback(async () => {
    setCapturedBlob(null);
    setReasons([]);
    setLiveReasons([]);
    setProgress(0);
    consecutivePassesRef.current = 0;

    // A retake is a natural moment to try the detector again — the network
    // may have recovered, and it still doesn't block the camera.
    if (detectorStateRef.current === "unavailable") {
      setDetectorState("loading");
      void loadDetector().then(setDetectorState);
    }

    // capture() releases the camera once it has a frame — reacquire it here.
    if (!streamRef.current) {
      await startCamera();
      return;
    }

    setStatus("streaming");
    if (!scanTimerRef.current) {
      scanTimerRef.current = setInterval(runScanTick, SCAN_INTERVAL_MS);
    }
  }, [runScanTick, startCamera, setDetectorState]);

  return {
    videoRef,
    canvasRef,
    status,
    detectorState,
    reasons,
    liveReasons,
    progress,
    capturedBlob,
    startCamera,
    capture,
    retake,
  };
}
