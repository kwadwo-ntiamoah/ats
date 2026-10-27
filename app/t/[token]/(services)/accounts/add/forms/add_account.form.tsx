"use client"

import { FormSkeleton } from "@/components/form-skeleton"
import { ReturnToWhatsapp } from "@/components/return-to-whatsapp"
import { SuccessModal } from "@/components/success-modal"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { Account, addAccountAsync, getAccountsAsync, getBalanceAsync } from "@/lib/actions/account"
import { AddAccountFormValues, addAccountSchema } from "@/lib/validations/account"
import { CheckBalanceFormValues, checkBalanceSchema } from "@/lib/validations/check_balance"
import { zodResolver } from "@hookform/resolvers/zod"
import { CodeIcon, LightbulbIcon, LockIcon, WalletIcon } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"


export default function AddAccountForm() {

    const { control, handleSubmit, reset, getValues } = useForm<AddAccountFormValues>({
        resolver: zodResolver(addAccountSchema),
        mode: "onTouched",
        defaultValues: {
            account: "", pin: ""
        }
    })

    const [pending, startTransition] = useTransition()
    const [accountsPending, startAccountsTransition] = useTransition()

    const [open, setOpen] = useState(false)
    const [accounts, setAccounts] = useState<Account[]>([])
    const [message, setMessage] = useState("")

    const inputGroupClass = `
        py-5 px-2
        has-[[data-slot=input-group-control]:focus-visible]:border-primary
        has-[[data-slot=input-group-control]:focus-visible]:ring-primary/50
        has-[[data-slot=input-group-control]:focus-visible]:ring-1
    `

    useEffect(() => {
        startAccountsTransition(async () => {
            var response = await getAccountsAsync({ isLinked: false });

            if (!response.success) {
                toast.add({
                    title: "Warning",
                    description: response.error,
                });

                return;
            }

            setAccounts(response.accounts)
        })
    }, [])

    const onsubmitAsync = (payload: CheckBalanceFormValues) => {
        startTransition(async () => {
            var response = await addAccountAsync(payload)

            if (!response.success) {
                toast.add({
                    title: "Warning",
                    description: response.error,
                });

                return;
            }

            setMessage(`You have successfully added your account ${getValues("account")}`)
            setOpen(true)
            reset()
        })
    }

    if (accountsPending) return <FormSkeleton />

    return (
        <>
            <form onSubmit={handleSubmit(onsubmitAsync)} className="space-y-5">
                <Controller
                    name="account"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field>
                            <FieldLabel
                                htmlFor={field.name}
                                className="text-sm"
                            >
                                Select your Primary Account{" "}
                                <span className="text-destructive">*</span>
                            </FieldLabel>

                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
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

                <Button type="submit" className="w-full">
                    {pending ? <Spinner /> : "Get Balance"}
                </Button>
            </form>

            <SuccessModal open={open} onOpenChange={setOpen} title="Account added successfully" message={message} />

            {/* <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-sm">
                    <div className="flex flex-col items-center text-center pt-2">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                            <WalletIcon />
                        </div>

                        <DialogHeader>
                            <DialogTitle className="text-base font-medium">Account balance</DialogTitle>
                            <DialogDescription className="text-sm text-green-500">
                                Account added successfully
                            </DialogDescription>
                        </DialogHeader>

                        <div className="w-full border-t mt-5 pt-5">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
                                {message}
                            </p>
                        </div>

                        <DialogFooter className="mt-5">
                            <ReturnToWhatsapp />
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog> */}
        </>
    )
}