import z from "zod"

export const getAccountStatementSchema = z.object({
    account: z.string().min(1, "Account is required"),
    pin: z.string().min(1, "PIN is required").length(4),
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
})

export type GetAccountStatementFormValues = z.infer<typeof getAccountStatementSchema>

export const getMiniStatementSchema = z.object({
    account: z.string().min(1, "Account is required"),
    pin: z.string().min(1, "PIN is required").length(4)
})

export type GetMiniStatementFormValues = z.infer<typeof getMiniStatementSchema>