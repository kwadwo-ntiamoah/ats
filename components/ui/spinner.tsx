"use client"

import { cn } from "@/lib/utils"
import { useLoaderOverlay } from "@/components/page-loader"

// Any Spinner on screen shows the full-page GCB logo loader overlay instead of an
// inline icon. It keeps an invisible box of the old size so buttons don't collapse.
function Spinner({ className }: { className?: string }) {
  useLoaderOverlay()
  return <span data-slot="spinner" aria-hidden="true" className={cn("inline-block size-4", className)} />
}

export { Spinner }
