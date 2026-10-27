"use server"

import { getApiErrorMessage } from "../errors";
import { sendAsync } from "../network/client";
import { getCookieValue } from "../network/session";
import { ChangePINFormValues, changePINSchema, ResetPINFormValues, resetPINSchema } from "../validations/pin"

type ChangePINResult =
    | { success: true }
    | { success: false; error: string; };

export async function changePINAsync(values: ChangePINFormValues): Promise<ChangePINResult> {

    const parsed = changePINSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all required inputs" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""
    const payload = { "oldPin": values.oldPin, "newPin": values.newPin }

    try {
        const res = await sendAsync("/auth/pin/change", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },
            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Invalid credentials") } }

        return {
            success: true
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

type ResetPINResult =
    | { success: true }
    | { success: false; error: string; };

export async function resetPINAsync(values: ResetPINFormValues): Promise<ResetPINResult> {

    const parsed = resetPINSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all required inputs" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""
    const payload = { "newPin": values.pin }

    try {
        const res = await sendAsync("/auth/pin/reset", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },
            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Invalid credentials") } }

        return {
            success: true
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}