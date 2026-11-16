import type { Account } from "@/lib/actions/account"
import { maskAccountNumber } from "@/lib/utils"

/** "101****0172 · GHS": the masked number plus currency, when the API sends one. */
export function accountSubtitle(account: Account) {
    return [maskAccountNumber(account.accountNumber), account.currency].filter(Boolean).join(" · ")
}

/**
 * One account in a picker: the holder's name on top, masked number and currency below,
 * so accounts can be told apart without showing the full number.
 */
export function AccountOption({ account }: { account: Account }) {
    const hasName = account.accountName && account.accountName !== account.accountNumber

    return (
        <span className="flex min-w-0 flex-col text-left">
            <span className="truncate text-sm font-medium">
                {hasName ? account.accountName : maskAccountNumber(account.accountNumber)}
            </span>
            <span className="truncate text-xs text-muted-foreground">{accountSubtitle(account)}</span>
        </span>
    )
}
