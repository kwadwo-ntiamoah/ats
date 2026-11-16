"use client"

import { TimerOff } from "lucide-react"
import { useEffect } from "react"
import { ReturnToWhatsapp } from "@/components/return-to-whatsapp"
import { useSessionEnded } from "@/lib/session-ended"

/**
 * Covers the whole page once the session has ended, so the customer isn't left on a form
 * that can no longer be submitted. They go back to WhatsApp to request a new link.
 */
export function SessionEndedScreen() {
    const ended = useSessionEnded()

    useEffect(() => {
        if (ended) window.scrollTo({ top: 0 })
    }, [ended])

    if (!ended) return null

    return (
        <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-ended-title"
            aria-describedby="session-ended-description"
            className="fixed inset-0 z-[110] flex items-center justify-center bg-white px-6"
        >
            <div className="flex w-full max-w-sm flex-col items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <TimerOff className="size-7" aria-hidden="true" />
                </div>

                <h1 id="session-ended-title" className="mt-5 text-xl font-bold tracking-tight text-neutral-900">
                    Your session has ended
                </h1>
                <p id="session-ended-description" className="mt-2 text-sm leading-relaxed text-neutral-500">
                    For your security, this page can no longer be used. Go back to WhatsApp and
                    choose the service again to get a new link.
                </p>

                <div className="mt-8 w-full">
                    <ReturnToWhatsapp />
                </div>
            </div>
        </div>
    )
}
