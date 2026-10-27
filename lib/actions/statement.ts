"use server"

import { getApiErrorMessage } from "../errors";
import { sendAsync } from "../network/client";
import { getCookieValue } from "../network/session";
import { GetAccountStatementFormValues, getAccountStatementSchema, GetMiniStatementFormValues } from "../validations/statement";

type GetStatementResults =
    | { success: true, hashedEmail: string }
    | { success: false; error: string }

type GetStatementApiResult = { hashedEmail: string }

export async function getStatementAsync(values: GetAccountStatementFormValues): Promise<GetStatementResults> {

    const parsed = getAccountStatementSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const payload = { "pin": values.pin }
    const params = new URLSearchParams()

    if (values.startDate) params.append("startDate", values.startDate)
    if (values.endDate) params.append("endDate", values.endDate)


    try {
        const res = await sendAsync(`/accounts/${values.account}/statement?${params.toString()}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },

            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Verification failed") } }

        var apiData = jsonResponse as GetStatementApiResult

        return { success: true, hashedEmail: apiData.hashedEmail }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

type GetMiniStatementResults =
    | { success: true, data: MiniStatementList }
    | { success: false; error: string }

export type MiniStatement = {
    txnDate: string
    valueDate: string
    externalRef: string | null
    bankRef: string | null
    amount: number
    drCrMarker: string | null
    narration: string | null
}

export type MiniStatementList = MiniStatement[]

export async function getMiniStatementAsync(values: GetMiniStatementFormValues) : Promise<GetMiniStatementResults> {
    const parsed = getAccountStatementSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const payload = { "pin": values.pin }


    try {
        const res = await sendAsync(`/accounts/${values.account}/statement/mini`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },

            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Verification failed") } }

        var apiData = jsonResponse as MiniStatementList

        return { success: true, data: apiData }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}