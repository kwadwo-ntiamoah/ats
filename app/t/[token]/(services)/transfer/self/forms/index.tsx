"use client"

import { FormSkeleton } from "@/components/form-skeleton"
import { ReturnToWhatsapp } from "@/components/return-to-whatsapp"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { Account, getAccountBalanceAsync, getAccountsAsync } from "@/lib/actions/account"
import { getTransferDetailsAsync, selfTransferAsync, TransferEnquiry } from "@/lib/actions/transfer"
import { SelfTransferFormValues, selfTransferSchema } from "@/lib/validations/transfer"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconArrowBack } from "@tabler/icons-react"
import { BanknoteIcon, CheckIcon, CodeIcon, DownloadIcon, LightbulbIcon, LockIcon, WalletIcon } from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form"

type TransferReceipt = TransferEnquiry & {
    reference: string
    completedAt: Date
}

export default function SelfTransferForm() {
    const [step, setStep] = useState(0)
    const [transferDetails, setTransferDetails] = useState<TransferEnquiry>()
    const [receipt, setReceipt] = useState<TransferReceipt>()

    const [isPending, startTransition] = useTransition()
    const [detailsPending, startDetailsTransition] = useTransition()

    const form = useForm<SelfTransferFormValues>({
        resolver: zodResolver(selfTransferSchema),
        defaultValues: { fromAccount: "", toAccount: "", amount: "", narration: "", pin: "" },
        mode: "onTouched"
    })

    async function goNext() {
        if (step === 0) {
            const valid = await form.trigger(["fromAccount", "toAccount", "amount", "narration"], {
                shouldFocus: true,
            });

            if (!valid) return;
        }

        setStep((s) => s + 1)
    }

    function goBack() {
        setStep((s) => Math.max(0, s - 1));
    }

    const onsubmitAsync = (payload: SelfTransferFormValues) => {
        startTransition(async () => {
            const valid = await form.trigger(["pin"], {
                shouldFocus: true,
            });

            if (!valid) return;

            var response = await selfTransferAsync(payload)

            if (!response.success) {
                toast.add({
                    title: "Warning",
                    description: response.error,
                });

                return;
            }

            if (transferDetails) {
                setReceipt({
                    ...transferDetails,
                    reference: response.reference,
                    completedAt: new Date(),
                })
            }

            setStep(3)
            form.reset()
        })
    }

    return (
        <>
            {
                step > 0 && step < 3 && <Button onClick={goBack} size="xs" className="px-0" variant="ghost">
                    <IconArrowBack />
                    Go Back
                </Button>
            }

            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onsubmitAsync)} className="space-y-5">
                    <TransferDetails step={step} />
                    <TransactionConfirmation
                        step={step}
                        details={transferDetails}
                        pending={detailsPending}
                        startTransition={startDetailsTransition}
                        onLoaded={setTransferDetails}
                    />
                    <TransactionPIN step={step} />
                    <TransactionReceipt step={step} receipt={receipt} />

                    {
                        step < 2
                            ? <Button type="button" onClick={goNext} disabled={detailsPending} className="w-full">
                                {detailsPending ? <Spinner /> : "Continue"}
                            </Button>
                            : step === 2
                                ? <Button type="submit" disabled={isPending} className="w-full">
                                    {isPending ? <Spinner /> : "Transfer"}
                                </Button>
                                : null
                    }
                </form>
            </FormProvider>
        </>
    )
}

function TransferDetails({ step }: { step: number }) {
    if (step !== 0) return null;

    const { control, watch } = useFormContext<SelfTransferFormValues>()

    const [accounts, setAccounts] = useState<Account[]>([])
    const [accountsPending, startAccountsTransition] = useTransition()

    const fromAccount = watch("fromAccount")

    const [balance, setBalance] = useState<number>()
    const [balancePending, startBalanceTransition] = useTransition()

    useEffect(() => {
        startAccountsTransition(async () => {
            var response = await getAccountsAsync({ isLinked: true });

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

    useEffect(() => {
        if (!fromAccount) {
            setBalance(undefined)
            return;
        }

        startBalanceTransition(async () => {
            var response = await getAccountBalanceAsync(fromAccount);

            if (!response.success) {
                setBalance(undefined)
                return;
            }

            setBalance(response.balance)
        })
    }, [fromAccount])

    if (accountsPending) return <FormSkeleton />

    const inputGroupClass = `
        py-5 px-2
        has-[[data-slot=input-group-control]:focus-visible]:border-primary
        has-[[data-slot=input-group-control]:focus-visible]:ring-primary/50
        has-[[data-slot=input-group-control]:focus-visible]:ring-1
    `

    return (
        <>
            <Controller
                name="fromAccount"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel
                            htmlFor={field.name}
                            className="text-sm"
                        >
                            From Account{" "}
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

                        {field.value && (
                            <p className="text-xs flex items-center gap-1.5">
                                {balancePending ? (
                                    <>
                                        <Spinner className="size-3" />
                                        <span className="text-muted-foreground">Fetching balance...</span>
                                    </>
                                ) : balance !== undefined ? (
                                    <>
                                        <WalletIcon className="size-3.5 text-black/40" />
                                        <span className="text-muted-foreground">
                                            Available balance:{" "}
                                            <span className="font-medium text-foreground">
                                                {new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(balance)}
                                            </span>
                                        </span>
                                    </>
                                ) : null}
                            </p>
                        )}

                        <FieldDescription className="text-xs flex space-x-2 items-start">
                            <LightbulbIcon size={15} />
                            <span>The account to transfer from</span>
                        </FieldDescription>

                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Controller
                name="toAccount"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel
                            htmlFor={field.name}
                            className="text-sm"
                        >
                            To Account{" "}
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
                                {accounts
                                    .filter((account) => account.accountNumber !== fromAccount)
                                    .map((account) => (
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
                            <span>The account to transfer to</span>
                        </FieldDescription>

                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Controller
                name="amount"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel
                            htmlFor={field.name}
                            className="text-sm"
                        >
                            Amount{" "}
                            <span className="text-destructive">*</span>
                        </FieldLabel>

                        <InputGroup className={inputGroupClass}>
                            <InputGroupAddon>
                                <BanknoteIcon className="size-4 text-black/40" />
                            </InputGroupAddon>

                            <InputGroupInput
                                {...field}
                                id={field.name}
                                inputMode="decimal"
                                aria-invalid={fieldState.invalid}
                                placeholder="0.00"
                                className="focus:ring-0! text-sm! bg-transparent"
                                onChange={(e) => {
                                    const value = e.target.value.replace(
                                        /[^0-9.]/g,
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

            <Controller
                name="narration"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel
                            htmlFor={field.name}
                            className="text-sm"
                        >
                            Narration{" "}
                            <span className="text-destructive">*</span>
                        </FieldLabel>

                        <Textarea
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder="What's this transfer for?"
                            className="text-sm"
                        />

                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />
        </>
    )
}

function TransactionConfirmation({
    step,
    details,
    pending,
    startTransition,
    onLoaded,
}: {
    step: number
    details?: TransferEnquiry
    pending: boolean
    startTransition: (callback: () => Promise<void> | void) => void
    onLoaded: (details: TransferEnquiry) => void
}) {
    const { getValues } = useFormContext<SelfTransferFormValues>()

    useEffect(() => {
        if (step !== 1) return;

        startTransition(async () => {
            const { fromAccount, toAccount, amount, narration } = getValues()

            const [fromRes, toRes] = await Promise.all([
                getTransferDetailsAsync(fromAccount),
                getTransferDetailsAsync(toAccount),
            ])

            if (!fromRes.success) {
                toast.add({
                    title: "Warning",
                    description: fromRes.error,
                });

                return;
            }

            if (!toRes.success) {
                toast.add({
                    title: "Warning",
                    description: toRes.error,
                });

                return;
            }

            onLoaded({
                fromAccount,
                fromAccountName: fromRes.accountName,
                toAccount,
                toAccountName: toRes.accountName,
                amount: Number(amount),
                narration,
            })
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])

    if (step !== 1) return null;

    if (pending || !details) return <FormSkeleton />

    const rows: { label: string; value: string }[] = [
        { label: "From", value: `${details.fromAccountName} (${details.fromAccount})` },
        { label: "To", value: `${details.toAccountName} (${details.toAccount})` },
        {
            label: "Amount",
            value: new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(details.amount)
        },
        { label: "Narration", value: details.narration },
    ]

    return (
        <div className="rounded-md border divide-y">
            {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="text-xs text-muted-foreground shrink-0">{row.label}</span>
                    <span className="text-sm font-medium text-right">{row.value}</span>
                </div>
            ))}
        </div>
    )
}

function TransactionPIN({ step }: { step: number }) {
    if (step !== 2) return null;

    const { control } = useFormContext<SelfTransferFormValues>()

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

function TransactionReceipt({ step, receipt }: { step: number; receipt?: TransferReceipt }) {
    const receiptRef = useRef<HTMLDivElement>(null)
    const [downloading, startDownloadTransition] = useTransition()

    if (step !== 3) return null;
    if (!receipt) return null;

    const rows: { label: string; value: string }[] = [
        { label: "Reference", value: receipt.reference },
        { label: "From", value: `${receipt.fromAccountName} (${receipt.fromAccount})` },
        { label: "To", value: `${receipt.toAccountName} (${receipt.toAccount})` },
        { label: "Narration", value: receipt.narration },
        {
            label: "Date",
            value: new Intl.DateTimeFormat("en-GH", {
                dateStyle: "medium",
                timeStyle: "short",
            }).format(receipt.completedAt)
        },
    ]

    const reference = receipt.reference

    function downloadReceiptAsync() {
        startDownloadTransition(async () => {
            if (!receiptRef.current) return;

            try {
                const { default: html2canvas } = await import("html2canvas")
                const canvas = await html2canvas(receiptRef.current, {
                    backgroundColor: "#ffffff",
                    scale: 2,
                })

                const link = document.createElement("a")
                link.href = canvas.toDataURL("image/png")
                link.download = `receipt-${reference}.png`
                link.click()
            } catch (err) {
                console.error(err)

                toast.add({
                    title: "Warning",
                    description: "Could not download receipt. Please try again.",
                });
            }
        })
    }

    return (
        <div className="space-y-5">
            <div ref={receiptRef} className="rounded-lg border bg-background p-5 space-y-5">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckIcon className="text-primary" />
                    </div>

                    <p className="text-base font-medium">Transfer successful</p>

                    <p className="text-2xl font-semibold tracking-tight">
                        {new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(receipt.amount)}
                    </p>
                </div>

                <div className="rounded-md border divide-y">
                    {rows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <span className="text-xs text-muted-foreground shrink-0">{row.label}</span>
                            <span className="text-sm font-medium text-right">{row.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Button type="button" onClick={downloadReceiptAsync} disabled={downloading} className="w-full">
                {downloading ? <Spinner /> : <><DownloadIcon /> Download Receipt</>}
            </Button>

            <ReturnToWhatsapp />
        </div>
    )
}
