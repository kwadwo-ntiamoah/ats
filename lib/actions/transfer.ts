"use server"

import { getApiErrorMessage } from "../errors"
import { sendAsync } from "../network/client"
import { getCookieValue } from "../network/session"
import { GcbTransferFormValues, gcbTransferSchema, LocalTransferFormValues, localTransferSchema, SelfTransferFormValues, selfTransferSchema } from "../validations/transfer"

export type TransferEnquiry = {
    fromAccount: string
    fromAccountName: string
    toAccount: string
    toAccountName: string
    amount: number
    narration: string
}

type GetTransferDetailsResult =
    | { success: true; accountName: string }
    | { success: false; error: string }

type GetTransferDetailsApiResult = {
    accountName: string
}

export async function getTransferDetailsAsync(accountNumber: string): Promise<GetTransferDetailsResult> {

    var deviceId = await getCookieValue("device_id") ?? ""

    try {
        const res = await sendAsync(`/accounts/${accountNumber}/enquiry`, {
            method: "GET",
            headers: {
                "X-DEVICE-ID": deviceId
            }
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Verification failed") } }

        var apiData = jsonResponse as GetTransferDetailsApiResult

        return { success: true, accountName: apiData.accountName }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

type SelfTransferResult =
    | { success: true; reference: string }
    | { success: false; error: string }

type SelfTransferApiResult = {
    reference: string
}

export async function selfTransferAsync(values: SelfTransferFormValues): Promise<SelfTransferResult> {

    const parsed = selfTransferSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const payload = {
        "toAccount": values.toAccount,
        "amount": Number(values.amount),
        "narration": values.narration,
        "pin": values.pin
    }

    try {
        const res = await sendAsync(`/accounts/${values.fromAccount}/transfer/self`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },

            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Transfer failed") } }

        var apiData = jsonResponse as SelfTransferApiResult

        return { success: true, reference: apiData.reference }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

type GcbTransferResult =
    | { success: true; reference: string }
    | { success: false; error: string }

type GcbTransferApiResult = {
    reference: string
}

export async function gcbTransferAsync(values: GcbTransferFormValues): Promise<GcbTransferResult> {

    const parsed = gcbTransferSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const payload = {
        "toAccount": values.toAccount,
        "amount": Number(values.amount),
        "narration": values.narration,
        "pin": values.pin
    }

    try {
        const res = await sendAsync(`/accounts/${values.fromAccount}/transfer/gcb`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },

            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Transfer failed") } }

        var apiData = jsonResponse as GcbTransferApiResult

        return { success: true, reference: apiData.reference }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

type LocalTransferResult =
    | { success: true; reference: string }
    | { success: false; error: string }

type LocalTransferApiResult = {
    reference: string
}

export async function localTransferAsync(values: LocalTransferFormValues): Promise<LocalTransferResult> {

    const parsed = localTransferSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const payload = {
        "bankCode": values.bankCode,
        "toAccount": values.toAccount,
        "amount": Number(values.amount),
        "narration": values.narration,
        "pin": values.pin
    }

    try {
        const res = await sendAsync(`/accounts/${values.fromAccount}/transfer/local`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },

            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Transfer failed") } }

        var apiData = jsonResponse as LocalTransferApiResult

        return { success: true, reference: apiData.reference }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}
