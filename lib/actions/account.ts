"use server"

import { getApiErrorMessage } from "../errors"
import { sendAsync } from "../network/client"
import { getCookieValue } from "../network/session"
import { AddAccountFormValues, addAccountSchema, RemoveAccountFormValues, removeAccountSchema } from "../validations/account"
import { CheckBalanceFormValues, checkBalanceSchema } from "../validations/check_balance"
import { OnboardingAccountFormValues, onboardingAccountsSchema } from "../validations/onboarding_accounts"

export type Account = {
    accountNumber: string
    accountName: string
}

type GetAccountsResult =
    | { success: true; accounts: Account[] }
    | { success: false; error: string }

type OnboardResults =
    | { success: true }
    | { success: false; error: string }

type GetAccountsOptions = {
  isLinked?: boolean;
};

export async function getAccountsAsync({ isLinked = false }: GetAccountsOptions = {}): Promise<GetAccountsResult> {

    var deviceId = await getCookieValue("device_id") ?? ""

    try {
        const res = await sendAsync(`/accounts?addedOnly=${isLinked}`, {
            method: "GET",
            headers: {
                "X-DEVICE-ID": deviceId
            }
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Verification failed") } }

        var apiData = jsonResponse as Account[]

        return {
            success: true,
            accounts: apiData
        }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

export async function onboardAsync(values: OnboardingAccountFormValues): Promise<OnboardResults> {

    const parsed = onboardingAccountsSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const payload = {
        "primaryAccount": values.account,
        "pin": values.confirmPin
    }

    try {
        const res = await sendAsync("/accounts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-DEVICE-ID": deviceId
            },

            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Verification failed") } }

        //var apiData = jsonResponse as OnboardApiResult[]

        return { success: true }
    } catch (err) {
        console.error(err)

        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

type GetBalanceResult =
    | { success: true, balance: number }
    | { success: false; error: string; };

type GetBalanceApiResult = { balance: number, accountNumber: string }

export async function getBalanceAsync(values: CheckBalanceFormValues): Promise<GetBalanceResult> {
    const parsed = checkBalanceSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const payload = {
        "pin": values.pin
    }
    
    try {
        const res = await sendAsync(`/accounts/${values.account}/balance`, {
            method: "POST",
            headers: {
                "X-DEVICE-ID": deviceId
            },
            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Verification failed") } }

        var apiData = jsonResponse as GetBalanceApiResult

        return {
            success: true,
            balance: apiData.balance
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

export async function getAccountBalanceAsync(account: string): Promise<GetBalanceResult> {
    var deviceId = await getCookieValue("device_id") ?? ""

    try {
        const res = await sendAsync(`/accounts/${account}/balance`, {
            method: "GET",
            headers: {
                "X-DEVICE-ID": deviceId
            }
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Verification failed") } }

        var apiData = jsonResponse as GetBalanceApiResult

        return {
            success: true,
            balance: apiData.balance
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }

    }
}

type AddAccountResult =
    | { success: true; account: string }
    | { success: false; error: string };

type AddAccountApiResult = { account: string };

export async function addAccountAsync(values: AddAccountFormValues): Promise<AddAccountResult> {
    const parsed = addAccountSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const payload = {
        "account": values.account,
        "pin": values.pin
    }

    try {
        const res = await sendAsync(`/accounts/add`, {
            method: "POST",
            headers: {
                "X-DEVICE-ID": deviceId
            },
            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Adding account failed") } }

        var apiData = jsonResponse as AddAccountApiResult

        return {
            success: true,
            account: apiData.account
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }
    }
}

type RemoveAccountResult =
    | { success: true; status: boolean }
    | { success: false; error: string };

type RemoveAccountApiResult = { status: boolean };

export async function removeAccountAsync(values: RemoveAccountFormValues): Promise<RemoveAccountResult> {
    const parsed = removeAccountSchema.safeParse(values)

    if (!parsed.success) {
        return { success: false, error: "Provide all mandatory fields" }
    }

    var deviceId = await getCookieValue("device_id") ?? ""

    const payload = {
        "accounts": [values.account],
        "pin": values.pin
    }

    try {
        const res = await sendAsync(`/accounts/remove`, {
            method: "POST",
            headers: {
                "X-DEVICE-ID": deviceId
            },
            body: JSON.stringify(payload)
        })

        const jsonResponse = await res.json()
        if (!res.ok) { return { success: false, error: getApiErrorMessage(jsonResponse, "Removing account failed") } }

        var apiData = jsonResponse as RemoveAccountApiResult

        return {
            success: true,
            status: apiData.status
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        return { success: false, error: message }
    }
}