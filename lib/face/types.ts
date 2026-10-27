export type FaceDetection = {
    score: number;
    /** Pixel coordinates within the analysed canvas. */
    box: { originX: number; originY: number; width: number; height: number } | null;
};

/** A face detector implementation (MediaPipe or TensorFlow.js) — see lib/actions/faceCheck.ts. */
export type FaceEngine = {
    name: "mediapipe" | "tfjs";
    /** Where inference runs, for diagnostics (e.g. "wasm", "webgl", "cpu"). */
    backend: string;
    detect(image: HTMLCanvasElement): Promise<FaceDetection[]>;
};

// Both engines drop detections below this, so they behave the same.
export const MIN_DETECTION_SCORE = 0.6;
