"use client";

import { useEffect, useTransition, useState } from "react";
import { validateTokenAsync } from "@/lib/actions/token";
import { getOtpAsync } from "@/lib/actions/otp";
import InvalidLink from "../components/invalid-link";
import { OtpOverlay } from "../components/otp-overlay";
import { useParams } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { FormSkeleton } from "@/components/form-skeleton";
import { Spinner } from "@/components/ui/spinner";
import { PlainNavbar } from "@/components/navbar";

export default function TransactionPage() {
    const params = useParams();
    const token = params.token as string;

    const router = useRouter();

    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"loading" | "invalid" | "expired" | "otp" | "transaction">("loading");
    const [revalidateLink, setRevalidateLink] = useState(false)

    const actionRoutes: Record<string, string> = {
        ADD_ACCOUNT: `/t/${token}/accounts/add`,
        AIRTIME: `/t/${token}/airtime`,
        BANK_TO_WALLET: `/t/${token}/momo/b2w`,
        CHANGE_PIN: `/t/${token}/pin/change`,
        CHECK_BALANCE: `/t/${token}/balance`,
        CUSTOM_STATEMENT: `/t/${token}/statements/custom`,
        DATA: `/t/${token}/data`,
        FUNDS_TRANSFER_GCB: `/t/${token}/transfer/gcb`,
        FUNDS_TRANSFER_LOCAL: `/t/${token}/transfer/local`,
        FUNDS_TRANSFER_SELF: `/t/${token}/transfer/self`,
        MINI_STATEMENT: `/t/${token}/statements/mini`,
        ONBOARDING: `/t/${token}/onboarding`,
        REMOVE_ACCOUNT: `/t/${token}/accounts/remove`,
        RESET_PIN: `/t/${token}/pin/reset`,
        WALLET_TO_BANK: `/t/${token}/momo/w2b`,
    };

    useEffect(() => {
        startTransition(async () => {
            const linkDetails = await validateTokenAsync(token);

            console.log(linkDetails)

            if (!linkDetails.success) {
                toast.add({
                    title: "Warning",
                    description: linkDetails.error,
                });
                setStatus("invalid");
                return;
            }

            if (linkDetails.data.link?.isExpired) {
                setStatus("expired");
                return;
            }

            if (linkDetails.data.requiresOtp) {
                const otpResult = await getOtpAsync(token);

                if (!otpResult.success) {
                    setStatus("invalid");
                    return;
                }

                setStatus("otp");
                return;
            }

            const action = linkDetails.data.link?.action;

            if (!action || !actionRoutes[action]) {
                setStatus("invalid");
                return;
            }

            router.replace(actionRoutes[action]);
        });
    }, [token, revalidateLink]);

    if (isPending || status === "loading") {
        return (
            <>
                {/* <PlainNavbar /> */}
                <div className="flex flex-col justify-center items-center py-24">
                    <Spinner className="h-10 w-10 text-gray-500" />
                </div>
            </>
        )
    }

    if (status === "invalid") {
        return <InvalidLink status="invalid" />;
    }

    if (status === "expired") {
        return <InvalidLink status="expired" />;
    }

    if (status === "otp") {
        return (
            <OtpOverlay
                token={token}
                onVerified={(isValid: boolean) => {

                    if (isValid) {
                        setRevalidateLink(isValid)
                    }
                }}
            />
        );
    }

    return null;
}