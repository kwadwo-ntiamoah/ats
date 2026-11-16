"use server"

import { getApiErrorMessage, getUnexpectedErrorMessage } from "../errors";
import { LINK_TOKEN_COOKIE, sendAsync } from "../network/client";
import { clearLegacyTokenCookies, getCookieValue, setCookieValue } from "../network/session";
import { logger } from "../logger";

type ValidateTokenResponse = {
    requiresOtp: boolean;
    link: LinkData | null;
};

type LinkData = {
    isExpired: boolean;
    action: string | null;
};

type ValidateTokenResult =
    | { success: true; data: ValidateTokenResponse }
    | { success: false; error: string }

export async function validateTokenAsync(token: string): Promise<ValidateTokenResult> {
    await clearLegacyTokenCookies();
    var deviceId = await getCookieValue("device_id") ?? ""
    var decodedToken = decodeURIComponent(token);

    try {
        const res = await sendAsync("/link/validate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },
            body: JSON.stringify({ token: decodedToken })
        })

        const jsonResponse = await res.json()

        if (!res.ok) {
            const error = getApiErrorMessage(jsonResponse, "Invalid credentials");
            logger.warn({ status: res.status, error }, "Link validation rejected");
            return { success: false, error }
        }

        var apiData = jsonResponse as ValidateTokenResponse

        // Remembered for browsers that don't send a Referer with later requests (see getLinkToken).
        await setCookieValue(LINK_TOKEN_COOKIE, decodedToken, 15 * 60);

        logger.info({ requiresOtp: apiData.requiresOtp, action: apiData.link?.action }, "Link validated");

        return {
            success: true,
            data: apiData
        }
    } catch (err) {
        const message = getUnexpectedErrorMessage(err);
        logger.error({ err }, "Link validation failed");
        return { success: false, error: message }

    }
}