"use server"

import { cookies } from "next/headers";

export async function setCookieValue(key: string, value: string, maxAge: number) {
    const cookieStore = await cookies()

    cookieStore.set(key, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge
    })
}

export async function getCookieValue(key: string) {
    const cookieStore = await cookies();
    return cookieStore.get(key)?.value ?? null;
}

// The API's system token used to be stored in these cookies. It now stays on the server
// (lib/network/client.ts); this removes copies left in browsers from before that change.
export async function clearLegacyTokenCookies() {
    const cookieStore = await cookies();
    if (cookieStore.get("accessToken")) cookieStore.delete("accessToken");
    if (cookieStore.get("refreshToken")) cookieStore.delete("refreshToken");
}
