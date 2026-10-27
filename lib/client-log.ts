import { withBasePath } from "@/lib/base-path";

type Primitive = string | number | boolean | null | undefined;
export type ClientLogData = Record<string, Primitive>;

export function randomId(): string {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function describeError(err: unknown): string {
    if (err instanceof Error) return `${err.name}: ${err.message}`;
    return String(err);
}

// One id per page load, so every event from a single visit can be grouped in app.log.
const sessionId = typeof window === "undefined" ? "" : randomId();

/**
 * Sends a diagnostic event to the server's app.log (app/api/client-log).
 * This is how we see what happens inside in-app browsers like WhatsApp's,
 * which have no DevTools. Fire-and-forget; never throws.
 */
export function clientLog(event: string, data: ClientLogData = {}, submissionId?: string) {
    if (typeof window === "undefined") return;

    try {
        const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
        const payload = JSON.stringify({
            event,
            sessionId,
            submissionId,
            page: location.pathname,
            t: performance.now(),
            net: connection?.effectiveType,
            online: navigator.onLine,
            data,
        });
        const url = withBasePath("/api/client-log");

        // sendBeacon still delivers if the page is backgrounded or closed mid-flow,
        // which is when in-app browsers are most likely to drop a normal request.
        if (navigator.sendBeacon?.(url, new Blob([payload], { type: "application/json" }))) return;

        fetch(url, { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "application/json" } })
            .catch(() => { });
    } catch {
        // Diagnostics must never break the flow they're observing.
    }
}
