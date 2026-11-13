"use client"

import { useEffect, useSyncExternalStore } from "react"
import { GcbLogo } from "@/components/gcb-logo"
import { cn } from "@/lib/utils"

// Every loading state in the app (Spinner, FormSkeleton, PageLoader) registers here while
// it is mounted, and one <LoaderOverlay /> in the root layout shows the GCB logo loader on
// top of the page whenever at least one is active. Counting keeps a single overlay when
// several things load at once.
let active = 0
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

function notify() {
    listeners.forEach((listener) => listener())
}

/** Shows the loader overlay for as long as the calling component is mounted. */
export function useLoaderOverlay(enabled = true) {
    useEffect(() => {
        if (!enabled) return
        active++
        notify()
        return () => {
            active--
            notify()
        }
    }, [enabled])
}

/** Renders nothing in place; shows the loader overlay while mounted. */
export function PageLoader() {
    useLoaderOverlay()
    return null
}

export function LoaderOverlay() {
    const visible = useSyncExternalStore(subscribe, () => active > 0, () => false)

    if (!visible) return null

    return (
        <div
            role="status"
            aria-label="Loading"
            aria-live="polite"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/40 backdrop-blur-[4px]"
        >
            <GcbLoader />
        </div>
    )
}

/** The GCB logo with a spinning ring around it. */
export function GcbLoader({ className }: { className?: string }) {
    return (
        <div className={cn("relative flex size-[60px] items-center justify-center", className)}>
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-[#FCC917]/20 border-t-[#FCC917] [animation-duration:0.9s]" />
            <GcbLogo className="relative h-[27px] w-[28px]" />
        </div>
    )
}
