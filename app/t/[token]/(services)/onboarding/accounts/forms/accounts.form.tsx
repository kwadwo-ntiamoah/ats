"use client"

import { useTransition, useState, useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    OnboardingAccountFormValues,
    onboardingAccountsSchema,
} from "@/lib/validations/onboarding_accounts"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
    CheckCircleIcon,
    CodeIcon,
    LockIcon,
    LockKeyholeIcon,
    PinIcon,
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import BackButton from "@/components/goBack"
import { PinCreationTips } from "@/components/pin-create-tips"
import { Account, getAccountsAsync, onboardAsync } from "@/lib/actions/account"
import { toast } from "@/components/ui/toast"
import { FormSkeleton } from "@/components/form-skeleton"
import { useParams, useRouter } from "next/navigation"


export default function AccountsForm() {
    const params = useParams();
    const token = params.token as string;

    const router = useRouter()

    const [pending, startTransition] = useTransition()
    const [accountsPending, startAccountsTransition] = useTransition()

    const [termsOpen, setTermsOpen] = useState(false)
    const [accounts, setAccounts] = useState<Account[]>([])

    const { handleSubmit, control } =
        useForm<OnboardingAccountFormValues>({
            resolver: zodResolver(onboardingAccountsSchema),
            defaultValues: {
                account: "",
                pin: "",
                confirmPin: "",
                termsAccepted: false,
            },
        })

    useEffect(() => {
        startAccountsTransition(async () => {
            var response = await getAccountsAsync();

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

    const onsubmitAsync = async (data: OnboardingAccountFormValues) => {
        startTransition(async () => {
            var response = await onboardAsync(data)

            if (!response.success) {
                toast.add({
                    title: "Warning",
                    description: response.error,
                });

                return;
            }

            router.push(`/t/${token}/onboarding/success`)
        })
    }

    const inputGroupClass = `
        py-5 px-2
        has-[[data-slot=input-group-control]:focus-visible]:border-primary
        has-[[data-slot=input-group-control]:focus-visible]:ring-primary/50
        has-[[data-slot=input-group-control]:focus-visible]:ring-1
    `
    if (accountsPending) return <FormSkeleton />

    return (
        <div className="flex flex-col">
            <div>
                <BackButton />
            </div>
            <form
                onSubmit={handleSubmit(onsubmitAsync)}
                className="space-y-5"
            >
                {/* Beneficiary Bank Country */}
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

                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                <p className="font-semibold ">Create a PIN for transactions</p>

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
                                    <PinIcon className="size-4 text-black/40" />
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
                                    <LockKeyholeIcon className="size-4 text-black/40" />
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

                {/* Terms and Conditions */}
                <Controller
                    name="termsAccepted"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field>
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id={field.name}
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    aria-invalid={fieldState.invalid}
                                />

                                <label
                                    htmlFor={field.name}
                                    className="text-[12px] leading-5 text-muted-foreground"
                                >
                                    I agree to the{" "}
                                    <button
                                        type="button"
                                        onClick={() => setTermsOpen(true)}
                                        className="font-medium text-primary hover:underline"
                                    >
                                        Terms and Conditions
                                    </button>
                                </label>
                            </div>

                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                {/* Submit */}
                <Button
                    type="submit"
                    disabled={pending}
                    className="w-full mt-5"
                >
                    {pending ? <Spinner /> : "Continue"}
                </Button>
            </form>

            {/* Terms Modal */}
            <Dialog
                open={termsOpen}
                onOpenChange={setTermsOpen}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Terms and Conditions
                        </DialogTitle>

                        <DialogDescription>
                            Please review the terms and conditions before
                            continuing.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto space-y-4 text-sm leading-6 text-muted-foreground">
                        <p>
                            By continuing with this onboarding process, you
                            confirm that the information provided is accurate
                            and complete.
                        </p>

                        <p>
                            You agree to comply with all applicable terms,
                            conditions, policies, and requirements relating to
                            the use of this service.
                        </p>

                        <p>
                            You are responsible for keeping your PIN
                            confidential and must not share it with any other
                            person.
                        </p>

                        <p>
                            Please ensure that you have read and understood
                            these terms before accepting them.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

