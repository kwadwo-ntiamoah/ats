"use server"

import { cookies } from "next/headers";

const ACCESS_COOKIE = "accessToken"
const REFRESH_COOKIE = "refreshToken"

export async function setSessionCookies(accessToken: string, refreshToken: string) {
    const cookieStore = await cookies();

    cookieStore.set(ACCESS_COOKIE, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15
    })

    cookieStore.set(REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7
    })
}

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

export async function getAccessToken() {
    const cookieStore = await cookies();
    return cookieStore.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken() {
    const cookieStore = await cookies();
    return cookieStore.get(REFRESH_COOKIE)?.value ?? null;
}

export async function getCookieValue(key: string) {
    const cookieStore = await cookies();
    return cookieStore.get(key)?.value ?? null;
}

export async function clearSessionCookies() {
    const cookieStore = await cookies();
    cookieStore.delete(ACCESS_COOKIE);
    cookieStore.delete(REFRESH_COOKIE);
}