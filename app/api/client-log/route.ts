import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";

// Receives diagnostic events from the browser (lib/client-log.ts) so we can see
// what happens inside in-app browsers like WhatsApp's, where DevTools isn't
// available. Unauthenticated by necessity, so everything is validated,
// truncated and rate-limited, and client data is nested under `data` so it can
// never overwrite the logger's own fields.

const MAX_BODY_CHARS = 8_000;
const EVENT = /^[a-z0-9_.-]{1,48}$/;
const ID = /^[A-Za-z0-9-]{1,64}$/;
const FIELD_KEY = /^[A-Za-z0-9_]{1,40}$/;
const MAX_FIELDS = 24;
const MAX_STRING_CHARS = 300;

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = 300;
const rateWindows = new Map<string, { startedAt: number; count: number }>();

function allowed(key: string, now = Date.now()) {
    const window = rateWindows.get(key);
    if (!window || now - window.startedAt > RATE_WINDOW_MS) {
        if (rateWindows.size > 10_000) rateWindows.clear();
        rateWindows.set(key, { startedAt: now, count: 1 });
        return true;
    }
    window.count++;
    return window.count <= RATE_LIMIT_PER_WINDOW;
}

function text(value: unknown, max = MAX_STRING_CHARS) {
    return typeof value === "string" ? value.slice(0, max) : undefined;
}

function sanitizeData(value: unknown) {
    const data: Record<string, string | number | boolean | null> = {};
    if (!value || typeof value !== "object" || Array.isArray(value)) return data;

    for (const [key, raw] of Object.entries(value).slice(0, MAX_FIELDS)) {
        if (!FIELD_KEY.test(key)) continue;
        if (typeof raw === "string") data[key] = raw.slice(0, MAX_STRING_CHARS);
        else if (typeof raw === "number" && Number.isFinite(raw)) data[key] = raw;
        else if (typeof raw === "boolean" || raw === null) data[key] = raw;
    }
    return data;
}

export async function POST(request: NextRequest) {
    const noContent = new NextResponse(null, { status: 204 });

    if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_CHARS) return noContent;

    const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "shared";
    if (!allowed(clientKey)) return noContent;

    let body: Record<string, unknown>;
    try {
        const raw = await request.text();
        if (raw.length > MAX_BODY_CHARS) return noContent;
        body = JSON.parse(raw);
    } catch {
        return noContent;
    }

    const event = text(body.event, 48);
    if (!event || !EVENT.test(event)) return noContent;

    const sessionId = text(body.sessionId, 64);
    const submissionId = text(body.submissionId, 64);

    logger.info({
        source: "client",
        event,
        sessionId: sessionId && ID.test(sessionId) ? sessionId : undefined,
        submissionId: submissionId && ID.test(submissionId) ? submissionId : undefined,
        page: text(body.page, 200),
        sincePageLoadMs: typeof body.t === "number" && Number.isFinite(body.t) ? Math.round(body.t) : undefined,
        network: text(body.net, 20),
        online: typeof body.online === "boolean" ? body.online : undefined,
        deviceId: request.cookies.get("device_id")?.value,
        userAgent: text(request.headers.get("user-agent")),
        data: sanitizeData(body.data),
    }, `client: ${event}`);

    return noContent;
}
