import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { withBasePath } from "@/lib/base-path";
import { MIN_DETECTION_SCORE, type FaceEngine } from "@/lib/face/types";

// Runtime and model are both self-hosted from /public, because cdn.jsdelivr.net
// is unreachable from some networks this runs on. The WASM files are copied from
// node_modules/@mediapipe/tasks-vision/wasm — re-copy them whenever that package
// is upgraded so the runtime and its JS API stay in lockstep.
export async function createMediaPipeEngine(): Promise<FaceEngine> {
    const vision = await FilesetResolver.forVisionTasks(withBasePath("/mediapipe/wasm"));

    const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: withBasePath("/mediapipe/blaze_face_short_range.tflite"),
        },
        runningMode: "IMAGE",
        minDetectionConfidence: MIN_DETECTION_SCORE,
    });

    return {
        name: "mediapipe",
        backend: "wasm",
        async detect(image) {
            return detector.detect(image).detections.map((detection) => ({
                score: detection.categories?.[0]?.score ?? 0,
                box: detection.boundingBox
                    ? {
                        originX: detection.boundingBox.originX,
                        originY: detection.boundingBox.originY,
                        width: detection.boundingBox.width,
                        height: detection.boundingBox.height,
                    }
                    : null,
            }));
        },
    };
}
