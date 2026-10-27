import { z } from "zod"

export const selfTransferSchema = z
    .object({
        fromAccount: z.string().min(1, "From account is required"),
        toAccount: z.string().min(1, "To account is required"),
        amount: z
            .string()
            .min(1, "Amount is required")
            .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
            .refine((value) => Number(value) > 0, "Amount must be greater than 0"),
        narration: z.string().min(1, "Narration is required"),
        pin: z.string().min(1, "PIN is required").length(4)
    })
    .refine((data) => data.fromAccount !== data.toAccount, {
        message: "From and To account cannot be the same",
        path: ["toAccount"],
    })

export type SelfTransferFormValues = z.infer<typeof selfTransferSchema>

export const gcbTransferSchema = z.object({
    fromAccount: z.string().min(1, "From account is required"),
    toAccount: z
        .string()
        .min(1, "Recipient account is required")
        .length(13, "Account number must be 13 digits")
        .regex(/^\d+$/, "Account number must contain only numbers"),
    amount: z
        .string()
        .min(1, "Amount is required")
        .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
        .refine((value) => Number(value) > 0, "Amount must be greater than 0"),
    narration: z.string().min(1, "Narration is required"),
    pin: z.string().min(1, "PIN is required").length(4)
})

export type GcbTransferFormValues = z.infer<typeof gcbTransferSchema>

export const localTransferSchema = z.object({
    fromAccount: z.string().min(1, "From account is required"),
    bankCode: z
        .string()
        .min(1, "Destination bank is required")
        .length(6, "Bank code must be 6 digits")
        .regex(/^\d+$/, "Bank code must contain only numbers"),
    toAccount: z.string().min(1, "Recipient account is required"),
    amount: z
        .string()
        .min(1, "Amount is required")
        .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
        .refine((value) => Number(value) > 0, "Amount must be greater than 0"),
    narration: z.string().min(1, "Narration is required"),
    pin: z.string().min(1, "PIN is required").length(4)
})

export type LocalTransferFormValues = z.infer<typeof localTransferSchema>
