import type { ChargeQuote } from "@/lib/actions/charges"

import { formatGhs } from "@/lib/format"

/**
 * Summary/receipt rows for a payment's charges: one row per charge, then the total.
 * Nothing is added when there are no charges, so the page looks as it did before.
 */
export function chargeRows(quote: ChargeQuote | undefined, totalLabel = "Total to be debited") {
    if (!quote || quote.charges.length === 0) return []

    return [
        ...quote.charges.map((c) => ({ label: c.label, value: formatGhs(c.amount) })),
        { label: totalLabel, value: formatGhs(quote.totalDebit) },
    ]
}
