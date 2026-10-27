"use server"

import { getApiErrorMessage } from "../errors"
import { sendAsync } from "../network/client"
import { getCookieValue } from "../network/session"
import { AirtimeFormValues, airtimeSchema } from "../validations/airtime"

type BuyAirtimeResult =
    | { success: true; reference: string }
    | { success: false; error: string }

type BuyAirtimeApiResult = {
    reference: string
}

export async function buyAirtimeAsync(values: AirtimeFormValues): Promise<BuyAirtimeResult> {

    const parsed = airtimeSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const payload = {
        "network": values.network,
        "phoneNumber": values.phoneNumber,
        "amount": Number(values.amount),
        "pin": values.pin
    }

    try {
        const res = await sendAsync(`/accounts/${values.fromAccount}/airtime`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },

            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Airtime purchase failed") } }

        var apiData = jsonResponse as BuyAirtimeApiResult

        return { success: true, reference: apiData.reference }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}
