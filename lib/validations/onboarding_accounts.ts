import { z } from "zod"

export const onboardingAccountsSchema = z
    .object({
        account: z.string().min(1, "Account is required"),
        pin: z
            .string()
            .length(4, "PIN must be exactly 4 digits")
            .regex(/^\d+$/, "PIN must contain only numbers")
            .refine(
                (pin) => {
                    // Reject repeated digits: 1111, 2222, 3333, etc.
                    if (/^(\d)\1{3}$/.test(pin)) {
                        return false;
                    }

                    // Reject ascending/descending sequences: 1234, 2345, 3456, 4321, etc.
                    const digits = pin.split("").map(Number);

                    const ascending = digits.every(
                        (digit, index) =>
                            index === 0 || digit === digits[index - 1] + 1
                    );

                    const descending = digits.every(
                        (digit, index) =>
                            index === 0 || digit === digits[index - 1] - 1
                    );

                    return !ascending && !descending;
                },
                {
                    message: "PIN cannot contain repeated or sequential numbers",
                }
            ),
        confirmPin: z
            .string()
            .length(4, "Confirm PIN must be exactly 4 digits")
            .regex(/^\d+$/, "Confirm PIN must contain only numbers"),
        termsAccepted: z
            .boolean()
            .refine((value) => value === true, {
                message: "You must accept the terms and conditions",
            }),
    })
    .refine((data) => data.pin === data.confirmPin, {
        message: "PINs do not match",
        path: ["confirmPin"],
    });

export type OnboardingAccountFormValues = z.infer<typeof onboardingAccountsSchema>