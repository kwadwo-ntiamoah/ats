import { z } from "zod"

export const checkBalanceSchema = z.object({
    account: z.string().min(1, "Account is required"),
    pin: z.string().min(1, "PIN is required").length(4)
})

export type CheckBalanceFormValues = z.infer<typeof checkBalanceSchema>