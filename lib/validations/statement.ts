import z from "zod"

function todayIso() {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const getAccountStatementSchema = z.object({
    account: z.string().min(1, "Account is required"),
    pin: z.string().min(1, "PIN is required").length(4, "PIN must be exactly 4 digits"),
    startDate: z.string().min(1, "Choose a start date").date("Choose a valid start date"),
    endDate: z.string().min(1, "Choose an end date").date("Choose a valid end date"),
})
    // Dates are "yyyy-MM-dd", so comparing the strings compares the dates.
    .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
        path: ["endDate"],
        message: "The end date can't be before the start date",
    })
    .refine((v) => !v.endDate || v.endDate <= todayIso(), {
        path: ["endDate"],
        message: "The end date can't be in the future",
    })

export type GetAccountStatementFormValues = z.infer<typeof getAccountStatementSchema>

export const getMiniStatementSchema = z.object({
    account: z.string().min(1, "Account is required"),
    pin: z.string().min(1, "PIN is required").length(4, "PIN must be exactly 4 digits")
})

export type GetMiniStatementFormValues = z.infer<typeof getMiniStatementSchema>