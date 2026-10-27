"use client"

import { PinCreationTips } from "@/components/pin-create-tips"
import { SuccessModal } from "@/components/success-modal"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { resetPINAsync } from "@/lib/actions/pin"
import { ResetPINFormValues, resetPINSchema } from "@/lib/validations/pin"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconPassword } from "@tabler/icons-react"
import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"

export default function ResetPinForm() {

    const { control, handleSubmit, reset } = useForm<ResetPINFormValues>({
        resolver: zodResolver(resetPINSchema),
        mode: "onTouched",
        defaultValues: { pin: "", confirmPin: "" }
    })
    const [pending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    const inputGroupClass = `
        py-5 px-2
        has-[[data-slot=input-group-control]:focus-visible]:border-primary
        has-[[data-slot=input-group-control]:focus-visible]:ring-primary/50
        has-[[data-slot=input-group-control]:focus-visible]:ring-1
    `

    const onsubmitAsync = (payload: ResetPINFormValues) => {
        startTransition(async () => {
            var response = await resetPINAsync(payload)

            if (!response.success) {
                toast.add({
                    title: "Warning",
                    description: response.error,
                });

                return;
            }

            setOpen(true)
            reset()
        })
    }

    return (
        <>
        <form
            onSubmit={handleSubmit(onsubmitAsync)}
            className="space-y-5"
        >
            {/* PIN */}
            <Controller
                name="pin"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel
                            htmlFor={field.name}
                            className="text-sm"
                        >
                            PIN{" "}
                            <span className="text-destructive">*</span>
                        </FieldLabel>

                        <InputGroup className={inputGroupClass}>
                            <InputGroupAddon>
                                <IconPassword className="size-4 text-black/40" />
                            </InputGroupAddon>

                            <InputGroupInput
                                {...field}
                                id={field.name}
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                aria-invalid={fieldState.invalid}
                                placeholder="Enter 4-digit PIN"
                                className="focus:ring-0! text-sm! bg-transparent"
                                onChange={(e) => {
                                    const value = e.target.value.replace(
                                        /\D/g,
                                        ""
                                    )

                                    field.onChange(value)
                                }}
                            />
                        </InputGroup>

                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            {/* Confirm PIN */}
            <Controller
                name="confirmPin"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel
                            htmlFor={field.name}
                            className="text-sm"
                        >
                            Confirm PIN{" "}
                            <span className="text-destructive">*</span>
                        </FieldLabel>

                        <InputGroup className={inputGroupClass}>
                            <InputGroupAddon>
                                <IconPassword className="size-4 text-black/40" />
                            </InputGroupAddon>

                            <InputGroupInput
                                {...field}
                                id={field.name}
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                aria-invalid={fieldState.invalid}
                                placeholder="Confirm 4-digit PIN"
                                className="focus:ring-0! text-sm! bg-transparent"
                                onChange={(e) => {
                                    const value = e.target.value.replace(
                                        /\D/g,
                                        ""
                                    )

                                    field.onChange(value)
                                }}
                            />
                        </InputGroup>

                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <PinCreationTips />

            {/* Submit */}
            <Button
                type="submit"
                disabled={pending}
                className="w-full mt-5"
            >
                {pending ? <Spinner /> : "Continue"}
            </Button>
        </form>

        <SuccessModal open={open} onOpenChange={setOpen} title="Success" message="Pin changed successfully" />
        </>
        
    )
}