import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
// Imported from the TF.js runtime module directly: the package's root entry
// also imports @mediapipe/face_detection (for its other runtime), which would
// ship to the browser for nothing.
import { load } from "@tensorflow-models/face-detection/dist/tfjs/detector";
import { withBasePath } from "@/lib/base-path";
import { MIN_DETECTION_SCORE, type FaceEngine } from "@/lib/face/types";

// Same short-range BlazeFace model MediaPipe uses, converted for TF.js and
// self-hosted from /public (the default URL is on tfhub.dev).
const MODEL_URL = "/tfjs/face_detection_short/model.json";

export async function createTfjsEngine(): Promise<FaceEngine> {
    // WebGL runs the model on the GPU. Some in-app browsers and older phones
    // don't expose it, so fall back to the slower CPU backend instead of failing.
    const webgl = await tf.setBackend("webgl").catch(() => false);
    if (!webgl) await tf.setBackend("cpu");
    await tf.ready();

    const detector = await load({
        runtime: "tfjs",
        modelType: "short",
        // Two, not one: the "more than one face" check needs to see a second face.
        maxFaces: 2,
        detectorModelUrl: withBasePath(MODEL_URL),
    });

    return {
        name: "tfjs",
        backend: tf.getBackend(),
        async detect(image) {
            const detections = await detector.detectFaces(image);

            return detections
                .map((detection) => {
                    // detectFaces rather than estimateFaces: it's the same detection
                    // but keeps the confidence score, which estimateFaces drops.
                    const relative = detection.locationData.relativeBoundingBox;
                    return {
                        score: detection.score?.[0] ?? 0,
                        box: relative
                            ? {
                                originX: relative.xMin * image.width,
                                originY: relative.yMin * image.height,
                                width: relative.width * image.width,
                                height: relative.height * image.height,
                            }
                            : null,
                    };
                })
                .filter((detection) => detection.score >= MIN_DETECTION_SCORE);
        },
    };
}
