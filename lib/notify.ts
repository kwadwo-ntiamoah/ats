import { toast } from "@/components/ui/toast"
import { SESSION_ENDED_MESSAGE } from "@/lib/errors"
import { endSession } from "@/lib/session-ended"

let lastErrorId: string | null = null

/**
 * Shows an error at the top of the page. It stays until the customer closes it or the
 * next error replaces it, so it can't be missed the way a short-lived toast can.
 */
export function notifyError(message: string, title = "Something went wrong") {
    if (lastErrorId) toast.close(lastErrorId)

    // The session or link can't be used any more: replace the page instead of showing a toast.
    if (message === SESSION_ENDED_MESSAGE) {
        lastErrorId = null
        endSession()
        return
    }

    lastErrorId = toast.add({
        type: "error",
        title,
        description: message,
        timeout: 0,
        priority: "high",
    })
}

/** Clears an error shown with notifyError, e.g. when the customer retries. */
export function clearError() {
    if (lastErrorId) toast.close(lastErrorId)
    lastErrorId = null
}

export function notifySuccess(message: string, title = "Done") {
    toast.add({ type: "success", title, description: message, timeout: 5000 })
}

export function notifyInfo(message: string, title = "Please note") {
    toast.add({ type: "info", title, description: message, timeout: 6000 })
}

export function notifyWarning(message: string, title = "Please check") {
    toast.add({ type: "warning", title, description: message, timeout: 0 })
}
