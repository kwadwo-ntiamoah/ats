import { setSessionCookies, clearSessionCookies, getAccessToken } from "@/lib/network/session"
import { logger } from "@/lib/logger"

const DEFAULT_TIMEOUT_MS = 30_000;

export type SystemTokenResult =
    | { ok: true; accessToken: string; refreshToken: string }
    | { ok: false; rejected: boolean };

/** Requests a system token from the API. Pure: never reads or writes cookies. */
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

    const { accessToken, refreshToken } = await res.json()
    return { ok: true, accessToken, refreshToken };
}

async function getSystemToken(): Promise<string | null> {
    const result = await requestSystemToken();

    if (!result.ok) {
        if (result.rejected) await clearSessionCookies();
        return null;
    }

    await setSessionCookies(result.accessToken, result.refreshToken);
    return result.accessToken
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
    let accessToken = await getAccessToken();

    if (!accessToken) {
        accessToken = await getSystemToken();

        if (!accessToken) throw new Error("UNAUTHENTICATED");
    }

    // fetchWithToken logs each attempt, including failures.
    let res = await fetchWithToken(path, accessToken, init, timeoutMs);

    if (res.status === 401) {
        const newToken = await getSystemToken();
        if (!newToken) throw new Error("UNAUTHENTICATED");

        res = await fetchWithToken(path, newToken, init, timeoutMs);
    }

    return res;
}
