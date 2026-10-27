import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlainNavbar } from "@/components/navbar"
import { ReturnToWhatsapp } from "@/components/return-to-whatsapp"

export default function OnboardingSuccessPage() {
    return (
        <>
            {/* <PlainNavbar /> */}
            <div className="flex min-h-dvh items-center justify-center bg-muted/50 px-4 py-8">
                <Card className="w-full max-w-sm border-none">
                    <CardContent className="flex flex-col items-center gap-6 pt-10 pb-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-9 w-9 text-green-600" strokeWidth={1.75} />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-xl font-semibold tracking-tight">
                                You're all set
                            </h1>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Your account has been created successfully. You can now return
                                to WhatsApp to continue.
                            </p>
                        </div>

                        <ReturnToWhatsapp />
                    </CardContent>
                </Card>
            </div>
        </>

    )
}