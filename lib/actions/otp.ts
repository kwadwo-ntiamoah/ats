"use server"

import { getApiErrorMessage } from "../errors";
import { sendAsync } from "../network/client";
import { getCookieValue, setCookieValue } from "../network/session";
import { logger } from "../logger";

type GetOtpResponse = {
    isSent: boolean
}

type ValidateOtpResponse = {
    isValid: boolean
    deviceId: string
    attemptsLeft: number
}

type GetOtpResult = 
    | { success: true; }
    | { success: false; error: string }

type ValidateOtpResult = 
    | { success: true; data: ValidateOtpResponse }
    | { success: false; error: string }

export async function getOtpAsync(token: string): Promise<GetOtpResult> {   
    try {
        var decodedToken = decodeURIComponent(token);

        const res = await sendAsync("/otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ token: decodedToken })
        })

        const jsonResponse = await res.json()

        if (!res.ok) {
            const error = getApiErrorMessage(jsonResponse, "An error occurred sending otp");
            logger.warn({ status: res.status, error }, "Get OTP rejected");
            return { success: false, error }
        }

        var apiData = jsonResponse as GetOtpResponse
        if (!apiData.isSent) {
            logger.warn("OTP was not sent");
            return { success: false, error: "Could not send OTP at this time" }
        }

        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        logger.error({ err }, "Get OTP failed");
        return { success: false, error: message }

    }
}


export async function validateOtpAsync(otp: string, token: string): Promise<ValidateOtpResult> {
    try {
        var decodedToken = decodeURIComponent(token);

        const res = await sendAsync("/otp/validate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ otp, token: decodedToken })
        })

        const jsonResponse = await res.json()

        if (!res.ok) {
            const error = getApiErrorMessage(jsonResponse, "Invalid credentials");
            logger.warn({ status: res.status, error }, "Validate OTP rejected");
            return { success: false, error }
        }

        var apiData = jsonResponse as ValidateOtpResponse

        if (!apiData.isValid) {
            logger.warn({ attemptsLeft: apiData.attemptsLeft }, "Validate OTP: incorrect code");
            const error = apiData.attemptsLeft > 0
                ? `Incorrect code. ${apiData.attemptsLeft} attempt${apiData.attemptsLeft === 1 ? "" : "s"} left.`
                : "Incorrect code.";
            return { success: false, error }
        }

        await setCookieValue("device_id", apiData.deviceId, 60 * 60 * 2)

        return {
            success: true,
            data: apiData
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        logger.error({ err }, "Validate OTP failed");
        return { success: false, error: message }

    }
}