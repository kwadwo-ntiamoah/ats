"use server"

import { getApiErrorMessage } from "../errors";
import { sendAsync } from "../network/client";
import { getCookieValue } from "../network/session";
import { IdVerificationFormValues, idVerificationSchema } from "../validations/id_verification"

type VerifyCardResult =
    | { success: true }
    | { success: false; error: string; };

type VerifyCardApiResult = { isValid: boolean }

export type VerifySelfieResult =
    | { success: true; name: string }
    | { success: false; error: string };

type VerifySelfieApiResult = { isValid: boolean; name: string }

// The API calls NIA for the face match, which can be slow.
const SELFIE_VERIFICATION_TIMEOUT_MS = 185_000;

export async function verifyGhanaCardAgainstFCUBSAsync(values: IdVerificationFormValues): Promise<VerifyCardResult> {

    const parsed = idVerificationSchema.safeParse(values)

     if (!parsed.success) {
        return { success: false, error: "Provide valid Ghana Card" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""
    const payload = { "ghanaCard": values.ghanaCard }

    try {
        const res = await sendAsync("/validate/ghanaCard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },
            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Invalid credentials") } }

        var apiData = jsonResponse as VerifyCardApiResult

        return {
            success: true
        }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

/** Checks a selfie (base64 JPEG, no data: prefix) against the Ghana Card in the current verification session. */
export async function verifySelfieAsync(image: string): Promise<VerifySelfieResult> {
    if (typeof image !== "string" || image.length === 0) {
        return { success: false, error: "Photo is missing. Please retake it." }
    }

    const deviceId = await getCookieValue("device_id") ?? ""

    try {
        const res = await sendAsync("/validate/selfie", {
            method: "POST",
            headers: { "X-DEVICE-ID": deviceId },
            body: JSON.stringify({ image })
        }, SELFIE_VERIFICATION_TIMEOUT_MS)

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Verification failed") } }

        return { success: true, name: (jsonResponse as VerifySelfieApiResult).name }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error
            ? (err.name === "TimeoutError" ? "Verification is taking too long. Please try again." : err.message)
            : "Something went wrong. Please try again.";
        return { success: false, error: message }
    }
}
