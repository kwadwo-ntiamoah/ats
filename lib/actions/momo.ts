"use server"

import { NETWORK_OPTIONS } from "../constants/networks"
import { getApiErrorMessage } from "../errors"
import { sendAsync } from "../network/client"
import { getCookieValue } from "../network/session"
import { BankToWalletFormValues, WalletToBankFormValues, bankToWalletSchema, walletToBankSchema } from "../validations/momo"

type BankToWalletResult =
    | { success: true; reference: string }
    | { success: false; error: string }

type BankToWalletApiResult = {
    reference: string
}

export async function bankToWalletAsync(values: BankToWalletFormValues): Promise<BankToWalletResult> {

    const parsed = bankToWalletSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const bankCode = NETWORK_OPTIONS.find((network) => network.value === values.network)?.bankCode ?? ""

    const payload = {
        "bankCode": bankCode,
        "toAccount": values.toAccount,
        "amount": Number(values.amount),
        "narration": values.narration,
        "pin": values.pin
    }

    try {
        const res = await sendAsync(`/accounts/${values.fromAccount}/transfer/momo/b2w`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },

            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Transfer failed") } }

        var apiData = jsonResponse as BankToWalletApiResult

        return { success: true, reference: apiData.reference }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

type GetWalletNumberResult =
    | { success: true; walletNumber: string }
    | { success: false; error: string }

type GetWalletNumberApiResult = {
    walletNumber: string
}

export async function getWalletNumberAsync(): Promise<GetWalletNumberResult> {

    var deviceId = await getCookieValue("device_id") ?? ""

    try {
        const res = await sendAsync(`/devices/wallet-number`, {
            method: "GET",
            headers: {
                "X-DEVICE-ID": deviceId
            }
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Could not retrieve your mobile money number") } }

        var apiData = jsonResponse as GetWalletNumberApiResult

        return { success: true, walletNumber: apiData.walletNumber }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

type InitiateWalletToBankResult =
    | { success: true; reference: string }
    | { success: false; error: string }

type InitiateWalletToBankApiResult = {
    reference: string
}

export async function initiateWalletToBankAsync(values: WalletToBankFormValues): Promise<InitiateWalletToBankResult> {

    const parsed = walletToBankSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    // The wallet to debit is deliberately NOT sent by the client - the backend resolves it
    // itself from the device's authenticated session (deviceId -> waId) so a tampered request
    // can never redirect the debit to a different wallet.
    const payload = {
        "network": values.network,
        "amount": Number(values.amount),
    }

    try {
        const res = await sendAsync(`/accounts/${values.toAccount}/transfer/momo/w2b`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },

            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Could not initiate transfer") } }

        var apiData = jsonResponse as InitiateWalletToBankApiResult

        return { success: true, reference: apiData.reference }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

export type WalletToBankStatus = "pending" | "successful" | "failed"

type CheckWalletToBankStatusResult =
    | { success: true; status: WalletToBankStatus }
    | { success: false; error: string }

type CheckWalletToBankStatusApiResult = {
    status: WalletToBankStatus
}

export async function checkWalletToBankStatusAsync(toAccount: string, reference: string): Promise<CheckWalletToBankStatusResult> {

    var deviceId = await getCookieValue("device_id") ?? ""

    try {
        const res = await sendAsync(`/accounts/${toAccount}/transfer/momo/w2b/${reference}/status`, {
            method: "GET",
            headers: {
                "X-DEVICE-ID": deviceId
            }
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Could not check transfer status") } }

        var apiData = jsonResponse as CheckWalletToBankStatusApiResult

        return { success: true, status: apiData.status }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}
