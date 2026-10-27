"use client"

import { FormSkeleton } from "@/components/form-skeleton"
import { ReturnToWhatsapp } from "@/components/return-to-whatsapp"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { Account, getAccountBalanceAsync, getAccountsAsync } from "@/lib/actions/account"
import {
    WalletToBankStatus,
    checkWalletToBankStatusAsync,
    getWalletNumberAsync,
    initiateWalletToBankAsync,
} from "@/lib/actions/momo"
import { getTransferDetailsAsync } from "@/lib/actions/transfer"
import { NETWORK_OPTIONS } from "@/lib/constants/networks"
import { WalletToBankFormValues, walletToBankSchema } from "@/lib/validations/momo"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconArrowBack } from "@tabler/icons-react"
import { BanknoteIcon, CheckIcon, CodeIcon, DownloadIcon, LightbulbIcon, ShieldAlertIcon, SmartphoneIcon, WalletIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState, useTransition } from "react"
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form"

const POLL_INTERVAL_MS = 5000
const MAX_POLLS = 240 // 240 * 5s = 20 minutes, matching the backend's own pending window

const GUIDE_STEPS = [
    "Authorize the request with your mobile money provider",
    "The transaction will be pending for 20 minutes",
    "Pending transactions not authorized after 20 minutes will be failed",
]

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(amount)
}

type WalletToBankEnquiry = {
    toAccount: string
    toAccountName: string
    network: string
    networkLabel: string
    walletNumber: string
    amount: number
}

type WalletToBankReceipt = WalletToBankEnquiry & {
    reference: string
    completedAt: Date
}

export default function WalletToBankForm() {
    const [step, setStep] = useState(0)
    const [transferDetails, setTransferDetails] = useState<WalletToBankEnquiry>()
    const [reference, setReference] = useState<string>()
    const [status, setStatus] = useState<WalletToBankStatus>()
    const [receipt, setReceipt] = useState<WalletToBankReceipt>()

    const [initiatePending, startInitiateTransition] = useTransition()
    const [detailsPending, startDetailsTransition] = useTransition()

    const form = useForm<WalletToBankFormValues>({
        resolver: zodResolver(walletToBankSchema),
        defaultValues: { toAccount: "", network: "", walletNumber: "", amount: "" },
        mode: "onTouched"
    })

    async function goNext() {
        if (step === 0) {
            const valid = await form.trigger(["toAccount", "network", "walletNumber", "amount"], {
                shouldFocus: true,
            });

            if (!valid) return;
        }

        setStep((s) => s + 1)
    }

    function goBack() {
        setStep((s) => Math.max(0, s - 1));
    }

    function initiateAsync() {
        startInitiateTransition(async () => {
            const values = form.getValues()

            var response = await initiateWalletToBankAsync(values)

            if (!response.success) {
                toast.add({
                    title: "Warning",
                    description: response.error,
                });

                return;
            }

            setReference(response.reference)
            setStep(2)
        })
    }

    function handleResolved(resolvedStatus: WalletToBankStatus, resolvedReference: string) {
        setStatus(resolvedStatus)

        if (resolvedStatus === "successful" && transferDetails) {
            setReceipt({
                ...transferDetails,
                reference: resolvedReference,
                completedAt: new Date(),
            })
        }

        setStep(3)
    }

    return (
        <>
            {
                step > 0 && step < 2 && <Button onClick={goBack} size="xs" className="px-0" variant="ghost">
                    <IconArrowBack />
                    Go Back
                </Button>
            }

            <FormProvider {...form}>
                <div className="space-y-5">
                    <TransferDetails step={step} />
                    <TransactionConfirmation
                        step={step}
                        details={transferDetails}
                        pending={detailsPending}
                        startTransition={startDetailsTransition}
                        onLoaded={setTransferDetails}
                    />
                    <AuthorizationGuide
                        step={step}
                        reference={reference}
                        toAccount={form.getValues("toAccount")}
                        onResolved={handleResolved}
                    />
                    <TransactionResult step={step} status={status} receipt={receipt} />

                    {
                        step === 0
                            ? <Button type="button" onClick={goNext} disabled={detailsPending} className="w-full">
                                {detailsPending ? <Spinner /> : "Continue"}
                            </Button>
                            : step === 1
                                ? <Button type="button" onClick={initiateAsync} disabled={initiatePending} className="w-full">
                                    {initiatePending ? <Spinner /> : "Initiate Transfer"}
                                </Button>
                                : null
                    }
                </div>
            </FormProvider>
        </>
    )
}

function TransferDetails({ step }: { step: number }) {
    if (step !== 0) return null;

    const { control, watch, setValue, formState } = useFormContext<WalletToBankFormValues>()

    const [accounts, setAccounts] = useState<Account[]>([])
    const [accountsPending, startAccountsTransition] = useTransition()

    const toAccount = watch("toAccount")
    const walletNumber = watch("walletNumber")

    const [balance, setBalance] = useState<number>()
    const [balancePending, startBalanceTransition] = useTransition()

    const [walletNumberPending, startWalletNumberTransition] = useTransition()
    const [walletNumberError, setWalletNumberError] = useState<string>()

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
        if (!toAccount) {
            setBalance(undefined)
            return;
        }

        startBalanceTransition(async () => {
            var response = await getAccountBalanceAsync(toAccount);

            if (!response.success) {
                setBalance(undefined)
                return;
            }

            setBalance(response.balance)
        })
    }, [toAccount])

    useEffect(() => {
        startWalletNumberTransition(async () => {
            var response = await getWalletNumberAsync();

            if (!response.success) {
                setWalletNumberError(response.error)
                return;
            }

            setWalletNumberError(undefined)
            setValue("walletNumber", response.walletNumber)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
                name="toAccount"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel
                            htmlFor={field.name}
                            className="text-sm"
                        >
                            Receiving Account{" "}
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
                                                {formatCurrency(balance)}
                                            </span>
                                        </span>
                                    </>
                                ) : null}
                            </p>
                        )}

                        <FieldDescription className="text-xs flex space-x-2 items-start">
                            <LightbulbIcon size={15} />
                            <span>The account to receive funds into</span>
                        </FieldDescription>

                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Controller
                name="network"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel
                            htmlFor={field.name}
                            className="text-sm"
                        >
                            Network{" "}
                            <span className="text-destructive">*</span>
                        </FieldLabel>

                        <Select
                            value={field.value}
                            onValueChange={field.onChange}
                        >
                            <SelectTrigger
                                id={field.name}
                                aria-invalid={fieldState.invalid}
                                className="w-full py-5 px-2 text-sm"
                            >
                                <SelectValue>
                                    {(value: string | null) => {
                                        const network = NETWORK_OPTIONS.find((n) => n.value === value)

                                        if (!network) return "-- Choose --"

                                        return (
                                            <span className="flex items-center gap-2">
                                                <Image src={network.image} alt={network.label} width={20} height={20} className="rounded-full" />
                                                {network.label}
                                            </span>
                                        )
                                    }}
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                {NETWORK_OPTIONS.map((network) => (
                                    <SelectItem
                                        key={network.value}
                                        value={network.value}
                                        className="text-sm"
                                    >
                                        <Image src={network.image} alt={network.label} width={20} height={20} className="rounded-full" />
                                        {network.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <FieldDescription className="text-xs flex space-x-2 items-start">
                            <LightbulbIcon size={15} />
                            <span>Your mobile money network</span>
                        </FieldDescription>

                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Field>
                <FieldLabel
                    htmlFor="walletNumber"
                    className="text-sm"
                >
                    Your Mobile Money Number
                </FieldLabel>

                <InputGroup className={inputGroupClass}>
                    <InputGroupAddon>
                        <SmartphoneIcon className="size-4 text-black/40" />
                    </InputGroupAddon>

                    <InputGroupInput
                        id="walletNumber"
                        disabled
                        readOnly
                        value={
                            walletNumberPending
                                ? "Fetching your number..."
                                : walletNumber || (walletNumberError ?? "Not available")
                        }
                        className="text-sm! bg-transparent disabled:opacity-100"
                    />
                </InputGroup>

                <FieldDescription className="text-xs flex space-x-2 items-start">
                    <LightbulbIcon size={15} />
                    <span>The wallet this amount will be debited from</span>
                </FieldDescription>

                {formState.errors.walletNumber && (
                    <FieldError errors={[formState.errors.walletNumber]} />
                )}
            </Field>

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
    details?: WalletToBankEnquiry
    pending: boolean
    startTransition: (callback: () => Promise<void> | void) => void
    onLoaded: (details: WalletToBankEnquiry) => void
}) {
    const { getValues } = useFormContext<WalletToBankFormValues>()

    useEffect(() => {
        if (step !== 1) return;

        startTransition(async () => {
            const { toAccount, network, walletNumber, amount } = getValues()

            const toRes = await getTransferDetailsAsync(toAccount)

            if (!toRes.success) {
                toast.add({
                    title: "Warning",
                    description: toRes.error,
                });

                return;
            }

            const networkOption = NETWORK_OPTIONS.find((n) => n.value === network)

            onLoaded({
                toAccount,
                toAccountName: toRes.accountName,
                network,
                networkLabel: networkOption?.label ?? network,
                walletNumber,
                amount: Number(amount),
            })
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])

    if (step !== 1) return null;

    if (pending || !details) return <FormSkeleton />

    const rows: { label: string; value: string }[] = [
        { label: "Receiving Account", value: `${details.toAccountName} (${details.toAccount})` },
        { label: "Network", value: details.networkLabel },
        { label: "Wallet Number", value: details.walletNumber },
        { label: "Amount", value: formatCurrency(details.amount) },
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

function AuthorizationGuide({
    step,
    reference,
    toAccount,
    onResolved,
}: {
    step: number
    reference?: string
    toAccount: string
    onResolved: (status: WalletToBankStatus, reference: string) => void
}) {
    useEffect(() => {
        if (step !== 2 || !reference) return;

        let cancelled = false
        let pollCount = 0

        const timer = setInterval(async () => {
            if (cancelled) return;

            pollCount += 1

            const response = await checkWalletToBankStatusAsync(toAccount, reference)

            if (cancelled) return;

            if (response.success && response.status === "successful") {
                cancelled = true
                clearInterval(timer)
                onResolved("successful", reference)
                return;
            }

            if ((response.success && response.status === "failed") || pollCount >= MAX_POLLS) {
                cancelled = true
                clearInterval(timer)
                onResolved("failed", reference)
            }
        }, POLL_INTERVAL_MS)

        return () => {
            cancelled = true
            clearInterval(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, reference])

    if (step !== 2) return null;

    return (
        <div className="space-y-5 text-center">
            <Spinner className="mx-auto size-8" />

            <div>
                <p className="text-base font-medium">Waiting for authorization</p>
                <p className="text-sm text-muted-foreground">This page will update automatically once confirmed</p>
            </div>

            <ol className="text-left text-sm rounded-md border divide-y">
                {GUIDE_STEPS.map((guideStep, index) => (
                    <li key={index} className="flex items-start gap-3 px-3 py-2.5">
                        <span className="shrink-0 flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {index + 1}
                        </span>
                        <span>{guideStep}</span>
                    </li>
                ))}
            </ol>
        </div>
    )
}

function TransactionResult({
    step,
    status,
    receipt,
}: {
    step: number
    status?: WalletToBankStatus
    receipt?: WalletToBankReceipt
}) {
    const receiptRef = useRef<HTMLDivElement>(null)
    const [downloading, startDownloadTransition] = useTransition()

    if (step !== 3) return null;

    if (status === "failed" || !receipt) {
        return (
            <div className="space-y-5">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <ShieldAlertIcon className="text-destructive" />
                    </div>

                    <p className="text-base font-medium">Transfer not completed</p>

                    <p className="text-sm text-muted-foreground">
                        The mobile money authorization was not confirmed in time. If you approved the request on your phone, please check your chat for an update; otherwise, try again.
                    </p>
                </div>

                <ReturnToWhatsapp />
            </div>
        )
    }

    const network = NETWORK_OPTIONS.find((n) => n.value === receipt.network)

    const rows: { label: string; value: string }[] = [
        { label: "Reference", value: receipt.reference },
        { label: "Receiving Account", value: `${receipt.toAccountName} (${receipt.toAccount})` },
        { label: "Network", value: receipt.networkLabel },
        { label: "Wallet Number", value: receipt.walletNumber },
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

                    {network && (
                        <Image src={network.image} alt={network.label} width={32} height={32} className="rounded-full" />
                    )}

                    <p className="text-2xl font-semibold tracking-tight">
                        {formatCurrency(receipt.amount)}
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
