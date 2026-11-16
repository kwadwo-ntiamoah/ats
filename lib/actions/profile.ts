"use server"

import { getApiErrorMessage, getUnexpectedErrorMessage } from "../errors"
import { sendAsync } from "../network/client"
import { getCookieValue } from "../network/session"

type GetCustomerProfileResult =
    | { success: true; firstName: string }
    | { success: false; error: string }

type GetCustomerProfileApiResult = {
    firstName: string
}

export async function getCustomerProfileAsync(): Promise<GetCustomerProfileResult> {

    var deviceId = await getCookieValue("device_id") ?? ""

    try {
        const res = await sendAsync(`/devices/profile`, {
            method: "GET",
            headers: {
                "X-DEVICE-ID": deviceId
            }
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Could not retrieve your profile") } }

        var apiData = jsonResponse as GetCustomerProfileApiResult

        return { success: true, firstName: apiData.firstName }
    } catch (err) {
        console.error(err)

        const message = getUnexpectedErrorMessage(err);
        return { success: false, error: message }

    }
}
