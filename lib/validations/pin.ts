import { z } from "zod"

export const resetPINSchema = z
    .object({
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

    })
    .refine((data) => data.pin === data.confirmPin, {
        message: "PINs do not match",
        path: ["confirmPin"],
    });


export const changePINSchema = z
    .object({
        oldPin: z.string().min(1, "PIN is required").length(4),
        newPin: z
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

    })
    .refine((data) => data.newPin === data.confirmPin, {
        message: "PINs do not match",
        path: ["confirmPin"],
    });

export type ChangePINFormValues = z.infer<typeof changePINSchema>
export type ResetPINFormValues = z.infer<typeof resetPINSchema>