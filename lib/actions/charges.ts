"use server"

import { getApiErrorMessage, getUnexpectedErrorMessage } from "../errors"
import { sendAsync } from "../network/client"
import { getCookieValue } from "../network/session"

export type ChargeService = "OtherBankTransfer" | "BankToWallet"

export type ChargeLine = {
    component: string
    label: string
    amount: number
}

export type ChargeQuote = {
    amount: number
    charges: ChargeLine[]
    totalCharges: number
    totalDebit: number
}

type ChargeQuoteResult =
    | { success: true; quote: ChargeQuote }
    | { success: false; error: string }

/**
 * The charges on a payment (e.g. E-Levy), for the summary and receipt. Display only:
 * the API recalculates the charges itself when the payment is made.
 */
export async function getChargeQuoteAsync(
    service: ChargeService,
    amount: number,
    options: { network?: string; bankCode?: string } = {}
): Promise<ChargeQuoteResult> {

    const deviceId = await getCookieValue("device_id") ?? ""

    const params = new URLSearchParams({ service, amount: String(amount) })
    if (options.network) params.append("network", options.network)
    if (options.bankCode) params.append("bankCode", options.bankCode)

    try {
        const res = await sendAsync(`/charges/quote?${params.toString()}`, {
            method: "GET",
            headers: { "X-DEVICE-ID": deviceId }
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Could not work out the charges") } }

        return { success: true, quote: jsonResponse as ChargeQuote }
    } catch (err) {
        console.error(err)
        return { success: false, error: getUnexpectedErrorMessage(err) }
    }
}
