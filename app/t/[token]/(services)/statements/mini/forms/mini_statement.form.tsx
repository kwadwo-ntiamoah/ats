"use client"
import { formatGhs } from "@/lib/format"


import { notifyError } from "@/lib/notify"
import { FormSkeleton } from "@/components/form-skeleton";
import { ReturnToWhatsapp } from "@/components/return-to-whatsapp";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Account, getAccountsAsync } from "@/lib/actions/account";
import { getMiniStatementAsync, MiniStatement, MiniStatementList } from "@/lib/actions/statement";
import { cn } from "@/lib/utils";
import { getMiniStatementSchema, GetMiniStatementFormValues } from "@/lib/validations/statement";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import { ArrowDownLeft, ArrowUpRight, CodeIcon, LightbulbIcon, LockIcon, ReceiptText } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PinPrompt } from "@/components/pin-prompt"

export default function MiniStatementForm() {
    const [step, setStep] = useState(0)
    const [statementList, setStatementList] = useState<MiniStatementList>([])

    const [isPending, startTransition] = useTransition()

    const form = useForm<GetMiniStatementFormValues>({
        resolver: zodResolver(getMiniStatementSchema),
        defaultValues: { account: "", pin: "" },
        mode: "onTouched"
    })

    async function goNext() {
        const valid = await form.trigger(["account"], {
            shouldFocus: true,
        });

        if (!valid) return;
        setStep((s) => s + 1)
    }

    function goBack() {
        setStep((s) => Math.max(0, s - 1));
    }

    const onsubmitAsync = (payload: GetMiniStatementFormValues) => {
        startTransition(async () => {
            const valid = await form.trigger(["account", "pin"], {
                shouldFocus: true,
            });

            if (!valid) return;

            var response = await getMiniStatementAsync(payload)

            if (!response.success) {
                notifyError(response.error);

                return;
            }

            setStatementList(response.data)
            setStep((s) => s + 1)
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
                    <StatementEntries step={step} statementList={statementList} />

                    {
                        step === 0 && <Button type="submit" disabled={isPending} className="w-full">
                            {isPending ? <Spinner /> : "Get Statement"}
                        </Button>
                    }
                </form>
            </FormProvider>
        </>
    )
}

function StatementDetails({ step }: { step: number }) {
    if (step !== 0) return null;

    const { control } = useFormContext<GetMiniStatementFormValues>()

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

    const inputGroupClass = `
        py-5 px-2
        has-[[data-slot=input-group-control]:focus-visible]:border-primary
        has-[[data-slot=input-group-control]:focus-visible]:ring-primary/50
        has-[[data-slot=input-group-control]:focus-visible]:ring-1
    `

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

            <Controller
                name="pin"
                control={control}
                render={({ field, fieldState }) => (
                    <Field>
                        <PinPrompt description="Enter your 4-digit PIN to view your mini statement. Never share it with anyone." />

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
        </>
    )
}

// Shows the entries fetched when the form was submitted. They are not fetched again here:
// the link is used up by that request, and a second request would also send the customer
// a second WhatsApp confirmation.
function StatementEntries({ step, statementList }: { step: number; statementList: MiniStatementList }) {
    if (step !== 1) return null;

    return (
        <Card className="w-full border-muted-foreground/10 shadow-sm">
            <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ReceiptText className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-medium">Mini statement</CardTitle>
                </div>
                <p className="pl-10 text-xs text-muted-foreground">
                    Last {statementList.length} transaction{statementList.length !== 1 ? "s" : ""}
                </p>
            </CardHeader>

            <CardContent className="pt-3">
                {statementList.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No recent transactions to show.
                    </p>
                ) : (
                    <div className="divide-y divide-border/60">
                        {statementList.map((entry, index) => (
                            <MiniStatementRow key={`${entry.externalRef ?? entry.bankRef ?? index}`} entry={entry} />
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter>
                <ReturnToWhatsapp />
            </CardFooter>
        </Card>
    )
}

const currencyFormatter = { format: formatGhs };

function isCredit(marker: string | null) {
    return marker?.toUpperCase().startsWith("C") ?? false;
}

function formatTxnDate(value: string) {
    try {
        return format(parseISO(value), "dd MMM yyyy");
    } catch {
        return value;
    }
}

function MiniStatementRow({ entry }: { entry: MiniStatement }) {
    const credit = isCredit(entry.drCrMarker);
    const reference = entry.bankRef ?? entry.externalRef;

    return (
        <div className="flex items-start gap-3 py-3.5">
            <div
                className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    credit ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                )}
            >
                {credit ? (
                    <ArrowDownLeft className="h-4 w-4" strokeWidth={2.25} />
                ) : (
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words text-sm font-medium leading-snug">
                        {entry.narration?.trim() || "Transaction"}
                    </p>
                    <p
                        className={cn(
                            "shrink-0 text-sm font-semibold tabular-nums",
                            credit ? "text-emerald-600" : "text-rose-600"
                        )}
                    >
                        {credit ? "+" : "-"}
                        {currencyFormatter.format(Math.abs(entry.amount))}
                    </p>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                    <span>{formatTxnDate(entry.txnDate)}</span>
                    {reference && (
                        <>
                            <span aria-hidden="true">&middot;</span>
                            <span className="min-w-0 break-all">Ref: {reference}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}