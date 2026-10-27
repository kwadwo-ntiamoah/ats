import { z } from "zod"
import { NETWORK_VALUES } from "../constants/networks"

export const airtimeSchema = z.object({
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
    amount: z
        .string()
        .min(1, "Amount is required")
        .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
        .refine((value) => Number(value) > 0, "Amount must be greater than 0"),
    pin: z.string().min(1, "PIN is required").length(4)
})

export type AirtimeFormValues = z.infer<typeof airtimeSchema>
