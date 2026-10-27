"use client"

import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import TitleWrapper from "../../../../../../components/title-wrapper";
import BackButton from "@/components/goBack";
import { VerificationCamera } from "@/components/verification-camera";
import { useSelfieSubmission } from "@/lib/hooks/useSelfieSubmission";

export default function SelfieCapture() {
    const params = useParams();
    const token = params.token as string;
    const router = useRouter()

    const onVerified = useCallback(() => {
        router.push(`/t/${token}/onboarding/accounts`)
    }, [router, token]);

    const { submit, pending, label } = useSelfieSubmission(onVerified);

    const title = "Verification 🔒";
    const description = "Verify your identity with your Ghana Card to continue safely";

    return (
        <TitleWrapper title={title} description={description}>
            <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
                <div>
                    <BackButton />
                </div>

                <VerificationCamera onVerified={submit} pending={pending} pendingLabel={label} />
            </div>
        </TitleWrapper>
    );
}
