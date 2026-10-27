import { clientLog, describeError } from "@/lib/client-log";
import type { FaceEngine } from "@/lib/face/types";

// TensorFlow.js by default: the same face model as MediaPipe for roughly a
// tenth of the download (~0.4 MB vs ~3.6 MB gzipped). Build with
// NEXT_PUBLIC_FACE_ENGINE=mediapipe to switch back. Each engine is its own
// lazily loaded chunk, so only the selected one is ever downloaded.
const ENGINE = process.env.NEXT_PUBLIC_FACE_ENGINE === "mediapipe" ? "mediapipe" : "tfjs";

function loadEngine(): Promise<FaceEngine> {
  return ENGINE === "tfjs"
    ? import("@/lib/face/tfjs-engine").then((m) => m.createTfjsEngine())
    : import("@/lib/face/mediapipe-engine").then((m) => m.createMediaPipeEngine());
}

let detectorPromise: Promise<FaceEngine> | null = null;

/**
 * Lazily creates (and caches) the face detector. Call this early — before the
 * capture screen if possible — so the download isn't on the critical path when
 * the user actually needs it.
 */
export async function initFaceDetector(): Promise<FaceEngine> {
  if (!detectorPromise) {
    const startedAt = performance.now();
    clientLog("detector_load_started", { engine: ENGINE });

    detectorPromise = loadEngine().then((engine) => {
      clientLog("detector_load_done", { engine: ENGINE, backend: engine.backend, ms: Math.round(performance.now() - startedAt) });
      return engine;
    }, (err) => {
      clientLog("detector_load_failed", { engine: ENGINE, ms: Math.round(performance.now() - startedAt), error: describeError(err) });
      // Don't cache a permanently-rejected promise — a transient network
      // failure here would otherwise brick face detection for the rest of
      // the session, with no way for "Try again" to actually retry.
      detectorPromise = null;
      throw err;
    });
  }

  return detectorPromise;
}

export interface CheckResult {
  passed: boolean;
  reasons: string[];
}

/**
 * Face presence, count and framing check. Low-confidence detections never get
 * here — both engines drop anything under MIN_DETECTION_SCORE — so a weak face
 * reads as "no face detected".
 */
export async function checkFace(image: HTMLCanvasElement): Promise<CheckResult> {
  const engine = await initFaceDetector();
  const detections = await engine.detect(image);

  const reasons: string[] = [];

  if (detections.length === 0) {
    reasons.push("No face detected — center your face in the frame");
  } else if (detections.length > 1) {
    reasons.push("More than one face detected");
  } else {
    const { box } = detections[0];
    const imgW = image.width;
    const imgH = image.height;

    if (box) {
      const faceRatio = (box.width * box.height) / (imgW * imgH);
      if (faceRatio < 0.08) reasons.push("Face too far — move closer");
      if (faceRatio > 0.6) reasons.push("Face too close — move back");

      const centerX = box.originX + box.width / 2;
      const centerY = box.originY + box.height / 2;
      const offX = Math.abs(centerX - imgW / 2) / imgW;
      const offY = Math.abs(centerY - imgH / 2) / imgH;
      if (offX > 0.15 || offY > 0.15) reasons.push("Face not centered");
    }
  }

  return { passed: reasons.length === 0, reasons };
}

// Laplacian variance scales with resolution, so the blur threshold below only
// means one thing if every frame is measured at the same size. Without this,
// a frame could clear the check during the live scan and then fail the very
// same check at full capture resolution.
const ANALYSIS_SIZE = 320;

let analysisCanvas: HTMLCanvasElement | null = null;

function normalizeForAnalysis(canvas: HTMLCanvasElement): HTMLCanvasElement {
  if (canvas.width <= ANALYSIS_SIZE && canvas.height <= ANALYSIS_SIZE) return canvas;

  const scale = ANALYSIS_SIZE / Math.max(canvas.width, canvas.height);
  const width = Math.round(canvas.width * scale);
  const height = Math.round(canvas.height * scale);

  analysisCanvas ??= document.createElement("canvas");
  if (analysisCanvas.width !== width || analysisCanvas.height !== height) {
    analysisCanvas.width = width;
    analysisCanvas.height = height;
  }

  const ctx = analysisCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(canvas, 0, 0, width, height);
  return analysisCanvas;
}

/** Brightness + blur (Laplacian variance) check, measured at ANALYSIS_SIZE. */
export function checkImageQuality(canvas: HTMLCanvasElement): CheckResult {
  const source = normalizeForAnalysis(canvas);
  const ctx = source.getContext("2d", { willReadFrequently: true });
  const reasons: string[] = [];
  if (!ctx) return { passed: false, reasons: ["Could not read image data"] };

  const { data, width, height } = ctx.getImageData(0, 0, source.width, source.height);

  // Grayscale + brightness in one pass.
  const gray = new Float32Array(width * height);
  let sum = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[p] = luminance;
    sum += luminance;
  }

  const avgBrightness = sum / (width * height);
  if (avgBrightness < 60) reasons.push("Image too dark — find better lighting");
  if (avgBrightness > 220) reasons.push("Image overexposed — avoid direct light behind you");

  // Blur estimate via Laplacian variance, accumulated as running sums so the
  // live path doesn't allocate a ~100k-element array three times a second.
  let lapSum = 0;
  let lapSumSq = 0;
  let lapCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const l =
        gray[idx - 1] + gray[idx + 1] + gray[idx - width] + gray[idx + width] - 4 * gray[idx];
      lapSum += l;
      lapSumSq += l * l;
      lapCount++;
    }
  }

  const lapMean = lapSum / lapCount;
  const variance = lapSumSq / lapCount - lapMean * lapMean;

  if (variance < 50) reasons.push("Image blurry, hold the camera steady");

  return { passed: reasons.length === 0, reasons };
}

/** Runs quality first (cheap) then the face model (heavier) — fails fast. */
export async function checkSelfie(canvas: HTMLCanvasElement): Promise<CheckResult> {
  const quality = checkImageQuality(canvas);
  if (!quality.passed) return quality;

  return checkFace(canvas);
}
