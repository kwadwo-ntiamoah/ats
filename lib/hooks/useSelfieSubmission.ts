"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { verifySelfieAsync } from "@/lib/actions/onboarding";
import { clientLog, describeError } from "@/lib/client-log";
import { blobToBase64, compressForUpload, withTimeout } from "@/lib/utils";

// The server allows the ID check 185s; this leaves room on top of that.
// A server action can't be cancelled, so this only stops the wait on a dead connection.
const VERIFY_TIMEOUT_MS = 200_000;
// After this long the button counts seconds, so a slow ID check visibly progresses.
const SHOW_SECONDS_AFTER = 10;

export function useSelfieSubmission(onVerified: () => void) {
    const [pending, setPending] = useState(false);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [now, setNow] = useState(0);
    const inFlightRef = useRef(false);

    useEffect(() => () => clientLog("selfie_page_left"), []);

    useEffect(() => {
        if (startedAt === null) return;
        const timer = setInterval(() => setNow(Date.now()), 1_000);
        return () => clearInterval(timer);
    }, [startedAt]);

    const submit = useCallback(async (blob: Blob) => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setPending(true);
        setStartedAt(Date.now());
        setNow(Date.now());

        const t0 = performance.now();
        const elapsed = () => Math.round(performance.now() - t0);
        let verified = false;

        try {
            const image = await blobToBase64(await compressForUpload(blob));
            clientLog("verify_started", { chars: image.length });

            const result = await withTimeout(verifySelfieAsync(image), VERIFY_TIMEOUT_MS);
            clientLog("verify_done", { success: result.success, ms: elapsed() });

            if (!result.success) {
                toast.add({ title: "Warning", description: result.error });
                return;
            }

            verified = true;
            onVerified();
        } catch (err) {
            clientLog("verify_failed", { error: describeError(err), ms: elapsed() });
            toast.add({ title: "Warning", description: "We couldn't reach the server. Check your connection and try again." });
        } finally {
            inFlightRef.current = false;
            // Stay in the pending state while navigating away after success.
            if (!verified) {
                setPending(false);
                setStartedAt(null);
            }
        }
    }, [onVerified]);

    const seconds = startedAt === null ? 0 : Math.max(0, Math.round((now - startedAt) / 1_000));
    const label = seconds >= SHOW_SECONDS_AFTER ? `Still verifying… ${seconds}s` : "Verifying…";

    return { submit, pending, label };
}
