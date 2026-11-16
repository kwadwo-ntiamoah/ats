"use client"

import { useSyncExternalStore } from "react"

// Client-side flag for "this WebView session has ended". Set by notifyError when the API
// reports Session.* or Link.*; read by <SessionEndedScreen /> in the root layout.
let ended = false
const listeners = new Set<() => void>()

export function endSession() {
    if (ended) return
    ended = true
    listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function useSessionEnded() {
    return useSyncExternalStore(subscribe, () => ended, () => false)
}
