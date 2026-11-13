import { buttonVariants } from "@/components/ui/button"
import { withBasePath } from "@/lib/base-path"
import { cn } from "@/lib/utils"
import { DownloadIcon } from "lucide-react"

export function DownloadReceiptButton({ receiptToken }: { receiptToken: string | null }) {
    // A null token means the transaction succeeded but the backend couldn't record its receipt.
    if (!receiptToken) {
        return (
            <p className="text-center text-sm text-muted-foreground">
                Your transaction was successful, but the receipt is unavailable right now.
            </p>
        )
    }

    return (
        <a href={withBasePath(`/api/receipts/${receiptToken}`)} className={cn(buttonVariants(), "w-full")}>
            <DownloadIcon /> Download Receipt
        </a>
    )
}
