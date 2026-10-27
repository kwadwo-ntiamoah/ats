import { z } from "zod"
import { NETWORK_VALUES } from "../constants/networks"

export const bankToWalletSchema = z.object({
    fromAccount: z.string().min(1, "From account is required"),
    network: z
        .string()
        .min(1, "Select a network")
        .refine((value) => (NETWORK_VALUES as readonly string[]).includes(value), "Select a network"),
    toAccount: z
        .string()
        .min(1, "Wallet number is required")
        .length(10, "Wallet number must be 10 digits")
        .regex(/^0\d+$/, "Enter a valid wallet number"),
    amount: z
        .string()
        .min(1, "Amount is required")
        .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
        .refine((value) => Number(value) > 0, "Amount must be greater than 0"),
    narration: z.string().min(1, "Narration is required"),
    pin: z.string().min(1, "PIN is required").length(4)
})

export type BankToWalletFormValues = z.infer<typeof bankToWalletSchema>

export const walletToBankSchema = z.object({
    toAccount: z.string().min(1, "Receiving account is required"),
    network: z
        .string()
        .min(1, "Select a network")
        .refine((value) => (NETWORK_VALUES as readonly string[]).includes(value), "Select a network"),
    walletNumber: z.string().min(1, "Wallet number is required"),
    amount: z
        .string()
        .min(1, "Amount is required")
        .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
        .refine((value) => Number(value) > 0, "Amount must be greater than 0"),
})

export type WalletToBankFormValues = z.infer<typeof walletToBankSchema>
