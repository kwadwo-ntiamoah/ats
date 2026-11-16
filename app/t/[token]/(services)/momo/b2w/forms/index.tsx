"use client"


import { formatGhs, formatReceiptDate } from "@/lib/format"
import { notifyError } from "@/lib/notify"
import { DownloadReceiptButton } from "@/components/download-receipt-button"
import { FormSkeleton } from "@/components/form-skeleton"
import { ReturnToWhatsapp } from "@/components/return-to-whatsapp"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Account, getAccountBalanceAsync, getAccountsAsync } from "@/lib/actions/account"
import { getGipAccountDetailsAsync } from "@/lib/actions/bank"
import { bankToWalletAsync } from "@/lib/actions/momo"
import { getTransferDetailsAsync } from "@/lib/actions/transfer"
import { NETWORK_OPTIONS } from "@/lib/constants/networks"
import { BankToWalletFormValues, bankToWalletSchema } from "@/lib/validations/momo"
import { hasRecipientLookup, isRecipientResolved, recipientDisplayText, useRecipientLookup } from "@/lib/hooks/useRecipientLookup"
import { maskAccountNumber } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftIcon } from "lucide-react"
import { BanknoteIcon, CheckIcon, CodeIcon, LightbulbIcon, LockIcon, UserIcon, WalletIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useState, useTransition } from "react"
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form"
import { getChargeQuoteAsync, type ChargeQuote } from "@/lib/actions/charges"
import { chargeRows } from "@/components/charge-rows"

type RecipientLookupState = ReturnType<typeof useRecipientLookup>

// The name enquiry depends on both the network and the wallet number.
function recipientKey(network?: string, toAccount?: string) {
    return network && toAccount ? `${network}:${toAccount}` : ""
}

type BankToWalletEnquiry = {
    fromAccount: string
    fromAccountName: string
    network: string
    networkLabel: string
    toAccount: string
    toAccountName: string
    amount: number
    narration: string
    charges?: ChargeQuote
}

type BankToWalletReceipt = BankToWalletEnquiry & {
    reference: string
    receiptToken: string | null
    completedAt: Date
}

export default function BankToWalletForm() {
    const [step, setStep] = useState(0)
    const [transferDetails, setTransferDetails] = useState<BankToWalletEnquiry>()
    const [receipt, setReceipt] = useState<BankToWalletReceipt>()

    const [isPending, startTransition] = useTransition()
    const [detailsPending, startDetailsTransition] = useTransition()

    const form = useForm<BankToWalletFormValues>({
        resolver: zodResolver(bankToWalletSchema),
        defaultValues: { fromAccount: "", network: "", toAccount: "", amount: "", narration: "", pin: "" },
        mode: "onTouched"
    })

    const recipientLookup = useRecipientLookup()
    const [network, toAccount] = useWatch({ control: form.control, name: ["network", "toAccount"] })
    const recipientResolved = isRecipientResolved(recipientLookup.recipient, recipientKey(network, toAccount))

    async function goNext() {
        if (step === 0) {
            const valid = await form.trigger(["fromAccount", "network", "toAccount", "amount", "narration"], {
                shouldFocus: true,
            });

            if (!valid || !recipientResolved) return;

            // Drop any confirmation loaded for an earlier recipient before showing the new one.
            setTransferDetails(undefined)
        }

        if (step === 1 && !transferDetails) return;

        setStep((s) => s + 1)
    }

    const continueDisabled = detailsPending
        || (step === 0 && !recipientResolved)
        || (step === 1 && !transferDetails)

    function goBack() {
        setStep((s) => Math.max(0, s - 1));
    }

    const onsubmitAsync = (payload: BankToWalletFormValues) => {
        startTransition(async () => {
            const valid = await form.trigger(["pin"], {
                shouldFocus: true,
            });

            if (!valid) return;

            var response = await bankToWalletAsync(payload)

            if (!response.success) {
                notifyError(response.error);

                return;
            }

            if (transferDetails) {
                setReceipt({
                    ...transferDetails,
                    reference: response.reference,
                    receiptToken: response.receiptToken,
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
                step > 0 && step < 3 && <Button onClick={goBack} size="xs" className="self-start px-0" variant="ghost">
                    <ArrowLeftIcon />
                    Go Back
                </Button>
            }

            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onsubmitAsync)} className="space-y-5">
                    <TransferDetails step={step} recipientLookup={recipientLookup} />
                    <TransactionConfirmation
                        step={step}
                        details={transferDetails}
                        pending={detailsPending}
                        startTransition={startDetailsTransition}
                        onLoaded={setTransferDetails}
                        onFailed={() => setStep(0)}
                    />
                    <TransactionPIN step={step} />
                    <TransactionReceipt step={step} receipt={receipt} />

                    {
                        step < 2
                            ? <Button key="continue" type="button" onClick={goNext} disabled={continueDisabled} className="w-full">
                                {detailsPending ? <Spinner /> : "Continue"}
                            </Button>
                            : step === 2
                                ? <Button key="submit" type="submit" disabled={isPending} className="w-full">
                                    {isPending ? <Spinner /> : "Transfer"}
                                </Button>
                                : null
                    }
                </form>
            </FormProvider>
        </>
    )
}

function TransferDetails({ step, recipientLookup }: { step: number; recipientLookup: RecipientLookupState }) {
    if (step !== 0) return null;

    const { control, watch } = useFormContext<BankToWalletFormValues>()
    const { recipient, lookup, reset } = recipientLookup

    const [accounts, setAccounts] = useState<Account[]>([])
    const [accountsPending, startAccountsTransition] = useTransition()

    const fromAccount = watch("fromAccount")
    const network = watch("network")
    const toAccount = watch("toAccount")

    const [balance, setBalance] = useState<number>()
    const [balancePending, startBalanceTransition] = useTransition()

    const currentRecipientKey = recipientKey(network, toAccount)

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

    // Picking another network re-runs the enquiry for the number already entered, so the user isn't
    // left with a disabled Continue button until they happen to touch the wallet field again.
    useEffect(() => {
        lookupRecipientAsync()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [network])

    function lookupRecipientAsync() {
        const bankCode = NETWORK_OPTIONS.find((n) => n.value === network)?.bankCode
        const key = recipientKey(network, toAccount)

        if (!bankCode || !key) {
            reset()
            return;
        }

        if (hasRecipientLookup(recipient, key)) return;

        lookup(key, () => getGipAccountDetailsAsync(bankCode, toAccount))
    }

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
                                                {formatGhs(balance)}
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
                            onValueChange={(value) => { field.onChange(value); field.onBlur() }}
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
                            <span>Select the recipient&apos;s mobile money network</span>
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
                            Wallet Number{" "}
                            <span className="text-destructive">*</span>
                        </FieldLabel>

                        <InputGroup className={inputGroupClass}>
                            <InputGroupAddon>
                                <CodeIcon className="size-4 text-black/40" />
                            </InputGroupAddon>

                            <InputGroupInput
                                {...field}
                                id={field.name}
                                inputMode="numeric"
                                aria-invalid={fieldState.invalid}
                                placeholder="Enter recipient's wallet number"
                                className="focus:ring-0! text-sm! bg-transparent"
                                onChange={(e) => {
                                    const value = e.target.value.replace(
                                        /\D/g,
                                        ""
                                    )

                                    field.onChange(value)
                                    reset()
                                }}
                                onBlur={(e) => {
                                    field.onBlur()
                                    lookupRecipientAsync()
                                }}
                            />
                        </InputGroup>

                        <FieldDescription className="text-xs flex space-x-2 items-start">
                            <LightbulbIcon size={15} />
                            <span>Enter the recipient&apos;s mobile money number</span>
                        </FieldDescription>

                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            {currentRecipientKey && recipient.key === currentRecipientKey && (
                <Field>
                    <FieldLabel
                        htmlFor="recipient"
                        className="text-sm"
                    >
                        Recipient
                    </FieldLabel>

                    <InputGroup className={inputGroupClass}>
                        <InputGroupAddon>
                            <UserIcon className="size-4 text-black/40" />
                        </InputGroupAddon>

                        <InputGroupInput
                            id="recipient"
                            disabled
                            readOnly
                            aria-invalid={recipient.status === "not_found"}
                            value={recipientDisplayText(recipient)}
                            className={`text-sm! bg-transparent disabled:opacity-100 ${recipient.status === "not_found" ? "text-destructive" : ""}`}
                        />
                    </InputGroup>
                </Field>
            )}

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
    onFailed,
}: {
    step: number
    details?: BankToWalletEnquiry
    pending: boolean
    startTransition: (callback: () => Promise<void> | void) => void
    onLoaded: (details: BankToWalletEnquiry) => void
    onFailed: () => void
}) {
    const { getValues } = useFormContext<BankToWalletFormValues>()

    useEffect(() => {
        if (step !== 1) return;

        startTransition(async () => {
            const { fromAccount, network, toAccount, amount, narration } = getValues()

            const networkOption = NETWORK_OPTIONS.find((n) => n.value === network)
            const bankCode = networkOption?.bankCode ?? ""

            const [fromRes, toRes, chargesRes] = await Promise.all([
                getTransferDetailsAsync(fromAccount),
                getGipAccountDetailsAsync(bankCode, toAccount),
                getChargeQuoteAsync("BankToWallet", Number(amount), { network }),
            ])

            if (!fromRes.success) {
                notifyError(fromRes.error);

                onFailed()
                return;
            }

            if (!toRes.success) {
                notifyError(toRes.error);

                onFailed()
                return;
            }

            // The customer must see the charges before confirming
            if (!chargesRes.success) {
                notifyError(chargesRes.error);

                onFailed()
                return;
            }

            onLoaded({
                fromAccount,
                fromAccountName: fromRes.accountName,
                network,
                networkLabel: networkOption?.label ?? network,
                toAccount,
                toAccountName: toRes.accountName,
                amount: Number(amount),
                narration,
                charges: chargesRes.quote,
            })
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])

    if (step !== 1) return null;

    if (pending || !details) return <FormSkeleton />

    const rows: { label: string; value: string }[] = [
        { label: "From", value: `${details.fromAccountName} (${details.fromAccount})` },
        { label: "Network", value: details.networkLabel },
        { label: "To", value: `${details.toAccountName} (${details.toAccount})` },
        {
            label: "Amount",
            value: formatGhs(details.amount)
        },
        { label: "Narration", value: details.narration },
        ...chargeRows(details.charges),
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

    const { control } = useFormContext<BankToWalletFormValues>()

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
                    <div className="space-y-1">
                        <p className="text-base font-semibold">Confirm with your PIN</p>
                        <p className="text-sm text-muted-foreground">Enter your 4-digit PIN to authorize this transaction. Never share it with anyone.</p>
                    </div>

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

function TransactionReceipt({ step, receipt }: { step: number; receipt?: BankToWalletReceipt }) {

    if (step !== 3) return null;
    if (!receipt) return null;

    const network = NETWORK_OPTIONS.find((n) => n.value === receipt.network)

    const rows: { label: string; value: string }[] = [
        { label: "Reference", value: receipt.reference },
        { label: "From", value: `${receipt.fromAccountName} (${maskAccountNumber(receipt.fromAccount)})` },
        { label: "Network", value: receipt.networkLabel },
        { label: "To", value: `${receipt.toAccountName} (${maskAccountNumber(receipt.toAccount)})` },
        { label: "Narration", value: receipt.narration },
        ...chargeRows(receipt.charges, "Total debited"),
        {
            label: "Date",
            value: formatReceiptDate(receipt.completedAt)
        },
    ]

    return (
        <div className="space-y-5">
            <div className="rounded-lg border bg-background p-5 space-y-5">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckIcon className="text-primary" />
                    </div>

                    <p className="text-base font-medium">Transfer successful</p>

                    {network && (
                        <Image src={network.image} alt={network.label} width={32} height={32} className="rounded-full" />
                    )}

                    <p className="text-2xl font-semibold tracking-tight">
                        {formatGhs(receipt.amount)}
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

            <DownloadReceiptButton receiptToken={receipt.receiptToken} />

            <ReturnToWhatsapp />
        </div>
    )
}
