import { z } from "zod"

export const idVerificationSchema = z.object({
    ghanaCard: z
        .string()
        .trim()
        .toUpperCase()
        .regex(
            /^GHA-\d{9}-\d$/,
            "Enter a valid Ghana Card PIN"
        ),
})

export type IdVerificationFormValues = z.infer<typeof idVerificationSchema>