import { z } from "zod"

export const addAccountSchema = z.object({
    account: z.string().min(1, "Account is required"),
    pin: z.string().min(1, "PIN is required").length(4)
})

export type AddAccountFormValues = z.infer<typeof addAccountSchema>

// NB: Seperate them to keep the code simple
export const removeAccountSchema = z.object({
    account: z.string().min(1, "Account is required"),
    pin: z.string().min(1, "PIN is required").length(4)
})

export type RemoveAccountFormValues = z.infer<typeof removeAccountSchema>

