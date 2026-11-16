"use server"

import { getApiErrorMessage, getUnexpectedErrorMessage } from "../errors"
import { sendAsync } from "../network/client"
import { getCookieValue } from "../network/session"
import { DataFormValues, dataSchema } from "../validations/data"

export type DataPackage = {
    id: string
    name: string
    volume: string
    validity: string | null
    /** "Data Bundles", "Video Bundles" or "Social Media Bundles" */
    category: string
    price: number
}

type GetDataPackagesResult =
    | { success: true; packages: DataPackage[] }
    | { success: false; error: string }

export async function getDataPackagesAsync(network: string, phoneNumber: string): Promise<GetDataPackagesResult> {

    var deviceId = await getCookieValue("device_id") ?? ""

    try {
        const res = await sendAsync(`/networks/${network}/packages?msisdn=${encodeURIComponent(phoneNumber)}`, {
            method: "GET",
            headers: {
                "X-DEVICE-ID": deviceId
            }
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Could not retrieve data packages") } }

        var apiData = jsonResponse as DataPackage[]

        return { success: true, packages: apiData }
    } catch (err) {
        console.error(err)

        const message = getUnexpectedErrorMessage(err);
        return { success: false, error: message }

    }
}

type BuyDataResult =
    | { success: true; reference: string; receiptToken: string | null }
    | { success: false; error: string }

type BuyDataApiResult = {
    reference: string
    receiptToken: string | null
}

export async function buyDataAsync(values: DataFormValues): Promise<BuyDataResult> {

    const parsed = dataSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const payload = {
        "network": values.network,
        "phoneNumber": values.phoneNumber,
        "packageId": values.packageId,
        "pin": values.pin
    }

    try {
        const res = await sendAsync(`/accounts/${values.fromAccount}/data`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },

            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Data purchase failed") } }

        var apiData = jsonResponse as BuyDataApiResult

        return { success: true, reference: apiData.reference, receiptToken: apiData.receiptToken ?? null }
    } catch (err) {
        console.error(err)

        const message = getUnexpectedErrorMessage(err);
        return { success: false, error: message }

    }
}
