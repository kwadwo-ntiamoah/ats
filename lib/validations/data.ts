import { z } from "zod"
import { NETWORK_VALUES } from "../constants/networks"

export const dataSchema = z.object({
    fromAccount: z.string().min(1, "From account is required"),
    network: z
        .string()
        .min(1, "Select a network")
        .refine((value) => (NETWORK_VALUES as readonly string[]).includes(value), "Select a network"),
    phoneNumber: z
        .string()
        .min(1, "Phone number is required")
        .length(10, "Phone number must be 10 digits")
        .regex(/^0\d+$/, "Enter a valid phone number"),
    packageId: z.string().min(1, "Select a data package"),
    pin: z.string().min(1, "PIN is required").length(4)
})

export type DataFormValues = z.infer<typeof dataSchema>
