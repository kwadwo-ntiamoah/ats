"use client"

import { useCallback, useRef, useState } from "react";

type LookupResult =
    | { success: true; accountName: string }
    | { success: false; error: string }

export type RecipientLookup = {
    // Identifies what was looked up (e.g. the account number, or bank code + account number),
    // so a result is only trusted while the form still holds those same values.
    key: string
    status: "idle" | "pending" | "found" | "not_found"
    name?: string
}

const IDLE: RecipientLookup = { key: "", status: "idle" }

// Holds the recipient name enquiry in the form itself rather than in the details step, so the
// Continue button can be gated on it and the result survives going back from the confirmation.
export function useRecipientLookup() {
    const [recipient, setRecipient] = useState<RecipientLookup>(IDLE)
    const latestRequest = useRef(0)

    const lookup = useCallback(async (key: string, fetchName: () => Promise<LookupResult>) => {
        const request = ++latestRequest.current
        setRecipient({ key, status: "pending" })

        let result: LookupResult
        try {
            result = await fetchName()
        } catch {
            result = { success: false, error: "Could not verify account" }
        }

        // A slower response for a number the user has since changed must not overwrite the newer one.
        if (request !== latestRequest.current) return

        setRecipient(result.success && result.accountName?.trim()
            ? { key, status: "found", name: result.accountName }
            : { key, status: "not_found" })
    }, [])

    const reset = useCallback(() => {
        latestRequest.current++
        setRecipient(IDLE)
    }, [])

    return { recipient, lookup, reset }
}

export function isRecipientResolved(recipient: RecipientLookup, key: string) {
    return !!key && recipient.key === key && recipient.status === "found"
}

// True when this key already has a lookup in flight or a name, so remounting the details step
// (after Go Back) doesn't repeat the enquiry.
export function hasRecipientLookup(recipient: RecipientLookup, key: string) {
    return recipient.key === key && (recipient.status === "pending" || recipient.status === "found")
}

export function recipientDisplayText(recipient: RecipientLookup) {
    if (recipient.status === "pending") return "Looking up account..."
    if (recipient.status === "found") return recipient.name ?? ""
    return "Account not found"
}
