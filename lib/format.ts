// One format for money and times on every screen, matching the PDF receipt (PAY-009):
// "GHS 1,000.00" and "16 Nov 2026, 15:04 GMT". Ghana is on GMT all year.
const ghs = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", currencyDisplay: "code" })

export function formatGhs(amount: number): string {
    // Intl puts a no-break space after the code; a plain space matches the receipt
    return ghs.format(amount).replace(/ /g, " ")
}

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Accra" })
const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Accra" })

export function formatReceiptDate(value: Date | string | number): string {
    const d = new Date(value)
    return `${date.format(d)}, ${time.format(d)} GMT`
}
