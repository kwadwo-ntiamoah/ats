import { logger } from "@/lib/logger"

const DEFAULT_TIMEOUT_MS = 30_000;

export type SystemTokenResult =
    | { ok: true; accessToken: string; expiresAt: number }
    | { ok: false; rejected: boolean };

/** Requests a system token from the API. */
export async function requestSystemToken(): Promise<SystemTokenResult> {
    const url = `${process.env.API_BASE_URL}/auth/token`;
    const startedAt = Date.now();
    logger.info({ method: "POST", url }, "API request: system token");

    let res: Response;
    try {
        res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clientId: process.env.API_CLIENT_ID,
                clientSecret: process.env.API_CLIENT_SECRET,
            }),
            cache: "no-store",
            signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
        })
    } catch (err) {
        logger.error({ url, err, ms: Date.now() - startedAt }, "Failed to reach API for system token");
        return { ok: false, rejected: false };
    }

    if (!res.ok) {
        logger.error({ url, status: res.status, ms: Date.now() - startedAt }, "System token request rejected");
        return { ok: false, rejected: true };
    }

    logger.info({ method: "POST", url, status: res.status, ms: Date.now() - startedAt }, "API response: system token");

    const { accessToken, expiresAt } = await res.json()
    const parsedExpiry = Date.parse(expiresAt)
    return {
        ok: true,
        accessToken,
        // If the API ever omits the expiry, assume a short life so we simply re-fetch sooner.
        expiresAt: Number.isFinite(parsedExpiry) ? parsedExpiry : Date.now() + 10 * 60_000,
    };
}

// The system token identifies sidi-web itself to the API, not a customer, so it must never
// reach a browser. It lives only in this server process's memory and is shared by all requests.
const TOKEN_REFRESH_MARGIN_MS = 60_000;
let cachedToken: { value: string; expiresAt: number } | null = null;
let pendingToken: Promise<string | null> | null = null;

async function getSystemToken(forceRefresh = false): Promise<string | null> {
    if (!forceRefresh && cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
        return cachedToken.value;
    }

    // Concurrent requests share one token fetch instead of each asking the API.
    if (!pendingToken) {
        pendingToken = (async () => {
            const result = await requestSystemToken();
            if (!result.ok) {
                if (result.rejected) cachedToken = null;
                return null;
            }

            cachedToken = { value: result.accessToken, expiresAt: result.expiresAt };
            return result.accessToken;
        })().finally(() => { pendingToken = null; });
    }

    return pendingToken;
}

/**
 * Sends an authenticated API request with an explicit token, logging the full
 * URL it goes to and how it ended. Pure: never touches cookies.
 */
export async function fetchWithToken(path: string, token: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const url = `${process.env.API_BASE_URL}${path}`;
    const method = init.method ?? "GET";
    const startedAt = Date.now();
    logger.info({ method, url }, "API request");

    try {
        const res = await fetch(url, {
            ...init,
            headers: {
                ...init.headers,
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(timeoutMs),
        });
        logger.info({ method, url, status: res.status, ms: Date.now() - startedAt }, "API response");
        return res;
    } catch (err) {
        logger.error({ method, url, err, ms: Date.now() - startedAt }, "API request failed");
        throw err;
    }
}

export async function sendAsync(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const accessToken = await getSystemToken();
    if (!accessToken) throw new Error("UNAUTHENTICATED");

    // fetchWithToken logs each attempt, including failures.
    let res = await fetchWithToken(path, accessToken, init, timeoutMs);

    if (res.status === 401) {
        const newToken = await getSystemToken(true);
        if (!newToken) throw new Error("UNAUTHENTICATED");

        res = await fetchWithToken(path, newToken, init, timeoutMs);
    }

    return res;
}
