import { withBasePath } from "@/lib/base-path"

export type NetworkOption = { value: string; label: string; image: string; bankCode: string }

export const NETWORK_VALUES = ["MTN", "AT", "TELECEL"] as const

// bankCode is the GIP (GhIPSS Instant Pay) routing code for each network's mobile money
// wallet - used to move funds to/from the wallet the same way a bank account is addressed.
export const NETWORK_OPTIONS: NetworkOption[] = [
    { value: "MTN", label: "MTN", image: withBasePath("/networks/mtn.svg"), bankCode: "300591" },
    { value: "AT", label: "AirtelTigo", image: withBasePath("/networks/at.svg"), bankCode: "300592" },
    { value: "TELECEL", label: "Telecel", image: withBasePath("/networks/telecel.svg"), bankCode: "300594" },
]
