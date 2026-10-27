"use server"

import { getApiErrorMessage } from "../errors"
import { sendAsync } from "../network/client"
import { getCookieValue } from "../network/session"

export type Bank = {
    code: string
    name: string
}

type GetBanksResult =
    | { success: true; banks: Bank[] }
    | { success: false; error: string }

export async function getBanksAsync(): Promise<GetBanksResult> {

    var deviceId = await getCookieValue("device_id") ?? ""

    try {
        const res = await sendAsync(`/banks`, {
            method: "GET",
            headers: {
                "X-DEVICE-ID": deviceId
            }
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Could not retrieve banks") } }

        var apiData = jsonResponse as Bank[]

        return { success: true, banks: apiData }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

type GetGipAccountDetailsResult =
    | { success: true; accountName: string }
    | { success: false; error: string }

type GetGipAccountDetailsApiResult = {
    accountName: string
}

export async function getGipAccountDetailsAsync(bankCode: string, accountNumber: string): Promise<GetGipAccountDetailsResult> {

    var deviceId = await getCookieValue("device_id") ?? ""

    try {
        const res = await sendAsync(`/banks/${bankCode}/accounts/${accountNumber}/enquiry`, {
            method: "GET",
            headers: {
                "X-DEVICE-ID": deviceId
            }
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Could not verify account") } }

        var apiData = jsonResponse as GetGipAccountDetailsApiResult

        return { success: true, accountName: apiData.accountName }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}
