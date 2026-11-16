"use client"


import { notifyError } from "@/lib/notify"
import { FormSkeleton } from "@/components/form-skeleton";
import { ReturnToWhatsapp } from "@/components/return-to-whatsapp";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/datefield";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Account, getAccountsAsync } from "@/lib/actions/account";
import { getStatementAsync } from "@/lib/actions/statement";
import { GetAccountStatementFormValues, getAccountStatementSchema } from "@/lib/validations/statement";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import { CodeIcon, LightbulbIcon, LockIcon, PlaneIcon, SendIcon, WalletIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { PinPrompt } from "@/components/pin-prompt"

export default function CustomStatementForm() {
    const [step, setStep] = useState(0)
    const [open, setOpen] = useState(false)

    const [isPending, startTransition] = useTransition()

    const form = useForm<GetAccountStatementFormValues>({
        resolver: zodResolver(getAccountStatementSchema),
        defaultValues: { account: "", endDate: "", pin: "", startDate: "" },
        mode: "onTouched"
    })

    async function goNext() {
        const valid = await form.trigger(["account", "startDate", "endDate"], {
            shouldFocus: true,
        });

        if (!valid) return;
        setStep((s) => s + 1)
    }

    function goBack() {
        setStep((s) => Math.max(0, s - 1));
    }

    const onsubmitAsync = (payload: GetAccountStatementFormValues) => {
        startTransition(async () => {
            const valid = await form.trigger(["pin"], {
                shouldFocus: true,
            });

            if (!valid) return;

            var response = await getStatementAsync(payload)

            if (!response.success) {
                notifyError(response.error);

                return;
            }

            setOpen(true)
            form.reset()
        })
    }

    return (
        <>
            {
                step === 1 && <Button onClick={goBack} size="xs" className="self-start px-0" variant="ghost">
                    <ArrowLeftIcon />
                    Go Back
                </Button>
            }
            
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onsubmitAsync)} className="space-y-5">
                    <StatementDetails step={step} />
                    <Pin step={step} />

                    {
                        step === 0
                            ? <Button key="continue" type="button" onClick={goNext} className="w-full">Continue</Button>
                            : <Button key="submit" type="submit" disabled={isPending} className="w-full">
                                {isPending ? <Spinner /> : "Get Statement"}
                            </Button>
                    }
                </form>
            </FormProvider>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-sm">
                    <div className="flex flex-col items-center text-center pt-2">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                            <PlaneIcon />
                        </div>

                        <DialogHeader>
                            <DialogTitle className="text-base font-medium">Account Statement</DialogTitle>
                        </DialogHeader>

                        <div className="w-full border-t mt-5 pt-5">
                            <p className="text-xs tracking-wide text-muted-foreground mb-1.5">
                                Your statement is ready and has been sent to you on WhatsApp as a PDF.
                            </p>

                        </div>

                        <DialogFooter className="mt-5">
                            <ReturnToWhatsapp />
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

function StatementDetails({ step }: { step: number }) {
    if (step !== 0) return null;

    const { control } = useFormContext<GetAccountStatementFormValues>()

    const [accounts, setAccounts] = useState<Account[]>([])
    const [accountsPending, startAccountsTransition] = useTransition()

    useEffect(() => {
        startAccountsTransition(async () => {
            var response = await getAccountsAsync({ isLinked: true });

            if (!response.success) {
                notifyError(response.error);

                return;
            }

            setAccounts(response.accounts)
        })
    }, [])

    if (accountsPending) return <FormSkeleton />

    return (
        <>

            <Controller
                name="account"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel
                            htmlFor={field.name}
                            className="text-sm"
                        >
                            Select your Account{" "}
                            <span className="text-destructive">*</span>
                        </FieldLabel>

                        <Select
                            value={field.value}
                            onValueChange={(value) => { field.onChange(value); field.onBlur() }}
                        >
                            <SelectTrigger
                                id={field.name}
                                aria-invalid={fieldState.invalid}
                                className="
                                        w-full
                                        py-5
                                        px-2
                                        [&_svg:not([data-icon])]:hidden
                                        text-sm
                                    "
                            >
                                <div className="flex items-center gap-2">
                                    <CodeIcon className="size-4 text-black/40" />
                                    <SelectValue placeholder="-- Choose --" />
                                </div>
                            </SelectTrigger>

                            <SelectContent>
                                {accounts.map((account) => (
                                    <SelectItem
                                        key={account.accountNumber}
                                        value={account.accountNumber}
                                        className="text-sm"
                                    >
                                        {account.accountNumber}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <FieldDescription className="text-xs flex space-x-2 items-start">
                            <LightbulbIcon size={15} />
                            <span>Your added accounts appear here</span>
                        </FieldDescription>

                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <DateField
                control={control}
                name="startDate"
                label="Start date"
                required
                disabled={(date) => date > new Date()}
            />

            <DateField
                control={control}
                name="endDate"
                label="End date"
                required
                disabled={(date) => date > new Date()}
            />


        </>
    )
}

function Pin({ step }: { step: number }) {
    if (step !== 1) return null;

    const { control } = useFormContext<GetAccountStatementFormValues>()

    const inputGroupClass = `
        py-5 px-2
        has-[[data-slot=input-group-control]:focus-visible]:border-primary
        has-[[data-slot=input-group-control]:focus-visible]:ring-primary/50
        has-[[data-slot=input-group-control]:focus-visible]:ring-1
    `

    return (
        <Controller
            name="pin"
            control={control}
            render={({ field, fieldState }) => (
                <Field>
                    <PinPrompt description="Enter your 4-digit PIN to request your statement. Never share it with anyone." />

                    <FieldLabel
                        htmlFor={field.name}
                        className="text-sm"
                    >
                        PIN{" "}
                        <span className="text-destructive">*</span>
                    </FieldLabel>

                    <InputGroup className={inputGroupClass}>
                        <InputGroupAddon>
                            <LockIcon className="size-4 text-black/40" />
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
    )
}