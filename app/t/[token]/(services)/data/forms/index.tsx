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
import { DataPackage, buyDataAsync, getDataPackagesAsync } from "@/lib/actions/data"
import { getTransferDetailsAsync } from "@/lib/actions/transfer"
import { NETWORK_OPTIONS } from "@/lib/constants/networks"
import { DataFormValues, dataSchema } from "@/lib/validations/data"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconArrowBack } from "@tabler/icons-react"
import { CheckIcon, CodeIcon, DownloadIcon, LockIcon, PackageIcon, PhoneIcon, WalletIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState, useTransition } from "react"
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form"

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(amount)
}

function formatPackageLabel(pkg: DataPackage) {
    return `${pkg.name} (${pkg.volume}, ${pkg.validity}) — ${formatCurrency(pkg.price)}`
}

type DataEnquiry = {
    fromAccount: string
    fromAccountName: string
    network: string
    networkLabel: string
    phoneNumber: string
    packageId: string
    packageLabel: string
    amount: number
}

type DataReceipt = DataEnquiry & {
    reference: string
    completedAt: Date
}

export default function DataForm() {
    const [step, setStep] = useState(0)
    const [dataDetails, setDataDetails] = useState<DataEnquiry>()
    const [receipt, setReceipt] = useState<DataReceipt>()

    const [isPending, startTransition] = useTransition()
    const [detailsPending, startDetailsTransition] = useTransition()

    const form = useForm<DataFormValues>({
        resolver: zodResolver(dataSchema),
        defaultValues: { fromAccount: "", network: "", phoneNumber: "", packageId: "", pin: "" },
        mode: "onTouched"
    })

    async function goNext() {
        if (step === 0) {
            const valid = await form.trigger(["fromAccount", "network", "phoneNumber", "packageId"], {
                shouldFocus: true,
            });

            if (!valid) return;
        }

        setStep((s) => s + 1)
    }

    function goBack() {
        setStep((s) => Math.max(0, s - 1));
    }

    const onsubmitAsync = (payload: DataFormValues) => {
        startTransition(async () => {
            const valid = await form.trigger(["pin"], {
                shouldFocus: true,
            });

            if (!valid) return;

            var response = await buyDataAsync(payload)

            if (!response.success) {
                toast.add({
                    title: "Warning",
                    description: response.error,
                });

                return;
            }

            if (dataDetails) {
                setReceipt({
                    ...dataDetails,
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
                    <DataDetails step={step} />
                    <TransactionConfirmation
                        step={step}
                        details={dataDetails}
                        pending={detailsPending}
                        startTransition={startDetailsTransition}
                        onLoaded={setDataDetails}
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
                                    {isPending ? <Spinner /> : "Buy Data"}
                                </Button>
                                : null
                    }
                </form>
            </FormProvider>
        </>
    )
}

function DataDetails({ step }: { step: number }) {
    if (step !== 0) return null;

    const { control, watch, setValue } = useFormContext<DataFormValues>()

    const [accounts, setAccounts] = useState<Account[]>([])
    const [accountsPending, startAccountsTransition] = useTransition()

    const fromAccount = watch("fromAccount")
    const network = watch("network")
    const phoneNumber = watch("phoneNumber")
    const packageId = watch("packageId")

    const [balance, setBalance] = useState<number>()
    const [balancePending, startBalanceTransition] = useTransition()

    const [packages, setPackages] = useState<DataPackage[]>([])
    const [packagesPending, startPackagesTransition] = useTransition()

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

    useEffect(() => {
        setValue("packageId", "")

        // The package catalog is looked up per phone number as well as network, so wait until
        // both are known before fetching.
        if (!network || phoneNumber.length !== 10) {
            setPackages([])
            return;
        }

        startPackagesTransition(async () => {
            var response = await getDataPackagesAsync(network, phoneNumber);

            if (!response.success) {
                setPackages([])

                toast.add({
                    title: "Warning",
                    description: response.error,
                });

                return;
            }

            setPackages(response.packages)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [network, phoneNumber])

    if (accountsPending) return <FormSkeleton />

    const inputGroupClass = `
        py-5 px-2
        has-[[data-slot=input-group-control]:focus-visible]:border-primary
        has-[[data-slot=input-group-control]:focus-visible]:ring-primary/50
        has-[[data-slot=input-group-control]:focus-visible]:ring-1
    `

    const selectedPackage = packages.find((pkg) => pkg.id === packageId)

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
                                                {formatCurrency(balance)}
                                            </span>
                                        </span>
                                    </>
                                ) : null}
                            </p>
                        )}

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

                        <FieldDescription className="text-xs">
                            Select the network you want to buy data for
                        </FieldDescription>

                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Controller
                name="phoneNumber"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel
                            htmlFor={field.name}
                            className="text-sm"
                        >
                            Phone Number{" "}
                            <span className="text-destructive">*</span>
                        </FieldLabel>

                        <InputGroup className={inputGroupClass}>
                            <InputGroupAddon>
                                <PhoneIcon className="size-4 text-black/40" />
                            </InputGroupAddon>

                            <InputGroupInput
                                {...field}
                                id={field.name}
                                inputMode="numeric"
                                aria-invalid={fieldState.invalid}
                                placeholder="0XXXXXXXXX"
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

                        <FieldDescription className="text-xs">
                            The number to buy a data bundle for
                        </FieldDescription>

                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Controller
                name="packageId"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel
                            htmlFor={field.name}
                            className="text-sm"
                        >
                            Data Package{" "}
                            <span className="text-destructive">*</span>
                        </FieldLabel>

                        <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!network || phoneNumber.length !== 10 || packagesPending}
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
                                    <PackageIcon className="size-4 text-black/40" />
                                    <SelectValue>
                                        {(value: string | null) => {
                                            const pkg = packages.find((p) => p.id === value)

                                            if (pkg) return formatPackageLabel(pkg)

                                            if (!network) return "Select a network first"
                                            if (phoneNumber.length !== 10) return "Enter the phone number first"
                                            return packagesPending ? "Loading packages..." : "-- Choose --"
                                        }}
                                    </SelectValue>
                                </div>
                            </SelectTrigger>

                            <SelectContent>
                                {packages.map((pkg) => (
                                    <SelectItem
                                        key={pkg.id}
                                        value={pkg.id}
                                        className="text-sm"
                                    >
                                        {formatPackageLabel(pkg)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedPackage && (
                            <p className="text-xs flex items-center gap-1.5">
                                <WalletIcon className="size-3.5 text-black/40" />
                                <span className="text-muted-foreground">
                                    Amount:{" "}
                                    <span className="font-medium text-foreground">
                                        {formatCurrency(selectedPackage.price)}
                                    </span>
                                </span>
                            </p>
                        )}

                        <FieldDescription className="text-xs">
                            The bundle to purchase for this number
                        </FieldDescription>

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
    details?: DataEnquiry
    pending: boolean
    startTransition: (callback: () => Promise<void> | void) => void
    onLoaded: (details: DataEnquiry) => void
}) {
    const { getValues } = useFormContext<DataFormValues>()

    useEffect(() => {
        if (step !== 1) return;

        startTransition(async () => {
            const { fromAccount, network, phoneNumber, packageId } = getValues()

            const [fromRes, packagesRes] = await Promise.all([
                getTransferDetailsAsync(fromAccount),
                getDataPackagesAsync(network, phoneNumber),
            ])

            if (!fromRes.success) {
                toast.add({
                    title: "Warning",
                    description: fromRes.error,
                });

                return;
            }

            if (!packagesRes.success) {
                toast.add({
                    title: "Warning",
                    description: packagesRes.error,
                });

                return;
            }

            const networkOption = NETWORK_OPTIONS.find((n) => n.value === network)
            const selectedPackage = packagesRes.packages.find((pkg) => pkg.id === packageId)

            onLoaded({
                fromAccount,
                fromAccountName: fromRes.accountName,
                network,
                networkLabel: networkOption?.label ?? network,
                phoneNumber,
                packageId,
                packageLabel: selectedPackage ? `${selectedPackage.name} (${selectedPackage.volume})` : packageId,
                amount: selectedPackage?.price ?? 0,
            })
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])

    if (step !== 1) return null;

    if (pending || !details) return <FormSkeleton />

    const rows: { label: string; value: string }[] = [
        { label: "From", value: `${details.fromAccountName} (${details.fromAccount})` },
        { label: "Network", value: details.networkLabel },
        { label: "Phone Number", value: details.phoneNumber },
        { label: "Package", value: details.packageLabel },
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

function TransactionPIN({ step }: { step: number }) {
    if (step !== 2) return null;

    const { control } = useFormContext<DataFormValues>()

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

function TransactionReceipt({ step, receipt }: { step: number; receipt?: DataReceipt }) {
    const receiptRef = useRef<HTMLDivElement>(null)
    const [downloading, startDownloadTransition] = useTransition()

    if (step !== 3) return null;
    if (!receipt) return null;

    const network = NETWORK_OPTIONS.find((n) => n.value === receipt.network)

    const rows: { label: string; value: string }[] = [
        { label: "Reference", value: receipt.reference },
        { label: "From", value: `${receipt.fromAccountName} (${receipt.fromAccount})` },
        { label: "Network", value: receipt.networkLabel },
        { label: "Phone Number", value: receipt.phoneNumber },
        { label: "Package", value: receipt.packageLabel },
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

                    <p className="text-base font-medium">Data purchase successful</p>

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
