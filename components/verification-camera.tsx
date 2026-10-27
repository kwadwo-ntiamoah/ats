import { useEffect, useRef } from "react";
import { CameraIcon, LightbulbIcon } from "lucide-react"
import { Button } from "./ui/button"
import { useSelfieCapture } from "@/lib/hooks/useSelfieCaptureAuto";
import { Spinner } from "./ui/spinner";

export function VerificationCamera({ pending, pendingLabel, onVerified }: {
    pending: boolean,
    pendingLabel?: string,
    onVerified: (blob: Blob) => void
}) {
    const {
        videoRef,
        canvasRef,
        status,
        reasons,
        liveReasons,
        progress,
        capturedBlob,
        detectorState,
        startCamera,
        capture,
        retake
    } = useSelfieCapture();

    // Submit each photo once, as soon as it passes the checks — no extra tap.
    // A retake produces a new blob, which is submitted in turn.
    const submittedRef = useRef<Blob | null>(null);
    useEffect(() => {
        if (status !== "ready" || !capturedBlob || submittedRef.current === capturedBlob) return;
        submittedRef.current = capturedBlob;
        onVerified(capturedBlob);
    }, [status, capturedBlob, onVerified]);

    const showVideo = status === "streaming" || status === "checking";

    const RING_RADIUS = 10;
    const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

    return (
        <>
            <SelfieInstructions />

            {
                status === "idle" ? (
                    <div className="flex items-center justify-center pt-8">
                        <Button
                            onClick={startCamera}
                        >
                            <CameraIcon />
                            Take Selfie
                        </Button>
                    </div>
                ) : (
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-900">
                        <video
                            ref={videoRef}
                            muted
                            playsInline
                            className={`h-full w-full  scale-x-[-1] object-cover ${showVideo ? "block" : "hidden"}`}
                        />

                        <canvas
                            ref={canvasRef}
                            className={`h-full w-full object-cover ${status === "ready" || status === "rejected" ? "block" : "hidden"
                                }`}
                        />

                        {/* Face guide + progress ring, shown while scanning */}
                        {status === "streaming" && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="relative flex h-[70%] w-[55%] items-center justify-center">
                                    <div
                                        className={`h-full w-full rounded-[50%] border-2 transition-colors ${progress > 0 ? "border-emerald-400" : "border-dashed border-white/60"
                                            }`}
                                    />
                                    {progress > 0 && (
                                        <svg
                                            className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
                                            viewBox="0 0 100 100"
                                            preserveAspectRatio="xMidYMid meet"
                                        >
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r={RING_RADIUS}
                                                fill="none"
                                                stroke="rgb(52 211 153)"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeDasharray={RING_CIRCUMFERENCE}
                                                strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
                                                style={{
                                                    transition: "stroke-dashoffset 150ms linear",
                                                }}
                                            />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        )}

                        {status === "starting-camera" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80 text-sm text-white">
                                Getting camera ready…
                            </div>
                        )}

                        {status === "checking" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/60 text-sm text-white">
                                Capturing…
                            </div>
                        )}

                        {status === "camera-error" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-900 px-6 text-center text-sm text-white">
                                <p>Couldn&apos;t access your camera. Check your browser permissions and try again.</p>
                                <Button onClick={startCamera}>
                                    Try again
                                </Button>
                            </div>
                        )}
                    </div>
                )
            }


            {/* Live guidance while scanning — tells the user what to fix, updates in real time */}
            {
                status === "streaming" && (
                    <p className="h-5 text-sm text-neutral-500 text-center">
                        {liveReasons[0] ?? (progress > 0 ? "Hold still…" : "Center your face in the frame")}
                    </p>
                )
            }

            {/* Manual capture while the face detector is still loading or failed to load.
                On a normal connection it's usually ready before the camera starts,
                so this only shows up when the download is slow or broken. */}
            {
                status === "streaming" && detectorState !== "ready" && (
                    <div className="flex flex-col items-center gap-2">
                        {detectorState === "unavailable" && (
                            <p className="text-center text-[12px] text-neutral-500">
                                Automatic capture isn&apos;t available right now. Center your face in the oval and tap Capture.
                            </p>
                        )}
                        <Button onClick={capture}>
                            <CameraIcon />
                            Capture
                        </Button>
                    </div>
                )
            }

            {
                status === "rejected" && (
                    <div className="w-full rounded-xl bg-red-50 p-3 text-[12px] text-red-700">
                        {reasons.map((r) => (
                            <p key={r}>- {r}</p>
                        ))}
                    </div>
                )
            }

            {
                status === "rejected" && (
                    <RetakeButton retake={retake} />
                )
            }

            {
                status === "ready" && (
                    <div className="flex flex-col w-full gap-3">
                        {pending ? (
                            <Button disabled>
                                <Spinner />{pendingLabel}
                            </Button>
                        ) : (
                            <>
                                <RetakeButton retake={retake} />
                                {/* Verification already ran (and failed) for this photo; resend it, e.g. after a network error. */}
                                <Button onClick={() => capturedBlob && onVerified(capturedBlob)} disabled={!capturedBlob}>
                                    Try again
                                </Button>
                            </>
                        )}
                    </div>
                )
            }
        </>
    )
}

export function SelfieInstructions() {
    return (
        <div className="flex flex-col justify-start items-center w-full space-y-2.5 max-w-sm">
            <div className="flex flex-col items-start justify-start w-full ">
                <p className="font-semibold">Let&apos;s verify your identity</p>
                <p className="text-xs">Take a passport sized selfie to continue</p>
            </div>
            <div className="flex flex-col space-y-1 items-start max-w-sm w-full mx-auto">
                <div className="flex items-center justify-start space-x-1 text-gray-600">
                    <LightbulbIcon size={15} />
                    <p className="text-[12px]">Tips for a successful verification</p>
                </div>

                <div className="pl-5 flex flex-col space-y-2">
                    {
                        [
                            "Take the selfie in a well-lit area",
                            "Make sure your face is clearly visible",
                            "Avoid hats, glasses or masks",
                            "Don't use a photo or screenshot"
                        ].map(instruction => (
                            <div key={instruction} className="flex space-x-2 items-center text-[12px]">
                                <p className="text-amber-600">*</p>
                                <p>{instruction}</p>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}

export function RetakeButton({ retake, disabled }: { retake: () => void, disabled?: boolean }) {

    return (
        <Button onClick={retake} disabled={disabled} variant="ghost" className="m-0 p-0 text-blue-600 underline" >
            <CameraIcon />
            Retake
        </Button >
    )
}