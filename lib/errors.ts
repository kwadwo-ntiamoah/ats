
type ProblemDetailsError = {
    title?: string;
    status?: number;
    traceId?: string;
    code?: string;
    errors?: Record<string, string[]>;
};

export const GENERIC_ERROR_MESSAGE = "Something went wrong on our side. Please try again.";
export const SERVICE_UNAVAILABLE_MESSAGE = "We couldn't complete your request right now. Please try again shortly.";
export const TIMEOUT_MESSAGE = "This is taking longer than expected. Please try again.";

/**
 * Returned when the API says the WebView session or link can no longer be used
 * (codes "Session.*" and "Link.*"). notifyError recognises it and shows the full-page
 * "session ended" screen instead of a toast.
 */
export const SESSION_ENDED_MESSAGE = "Your session has ended. Please go back to WhatsApp and request a new link.";

function isSessionEnded(code: unknown): boolean {
    return typeof code === "string" && (code.startsWith("Session.") || code.startsWith("Link."));
}

/**
 * Turns an API error response into the message shown to the customer.
 *
 * Only 4xx responses carry a message written for customers (wrong PIN, link already used,
 * insufficient funds). Anything from 500 up is a fault on our side or the bank's, so the
 * customer gets a fixed message, never the response text.
 */
export function getApiErrorMessage(data: unknown, fallback = GENERIC_ERROR_MESSAGE): string {
    if (!data || typeof data !== "object") return fallback;

    const problem = data as ProblemDetailsError;

    if (isSessionEnded(problem.code)) return SESSION_ENDED_MESSAGE;

    if (typeof problem.status === "number" && problem.status >= 500) {
        return problem.status === 500 ? GENERIC_ERROR_MESSAGE : SERVICE_UNAVAILABLE_MESSAGE;
    }

    // Pull the first validation message out of `errors`, if present
    if (problem.errors) {
        const firstField = Object.values(problem.errors)[0];
        if (Array.isArray(firstField) && firstField.length > 0) {
            return firstField[0];
        }
    }

    // Fall back to the general title, which the API writes for customers on 4xx responses
    if (typeof problem.title === "string" && problem.title.length > 0) {
        return problem.title;
    }

    return fallback;
}

/**
 * The message for a request that never produced a usable API response (network failure,
 * timeout, a reply that wasn't JSON). The error itself is logged where the request is made
 * and its text is never shown to the customer.
 */
export function getUnexpectedErrorMessage(err: unknown): string {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        return TIMEOUT_MESSAGE;
    }

    return GENERIC_ERROR_MESSAGE;
}
