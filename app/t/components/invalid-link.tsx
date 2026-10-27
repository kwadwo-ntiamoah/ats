"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkIcon, TimerReset, RotateCcw, Home } from "lucide-react";
import { PlainNavbar } from "@/components/navbar";

/**
 * /link-status?type=expired   -> "Link expired" state
 * /link-status?type=invalid   -> "Invalid link" state (default)
 *
 * Usage: redirect users here whenever a verification / reset / invite
 * link fails validation on the server, passing the reason as `type`.
 */

type LinkStatusType = "invalid" | "expired";

interface StatusConfig {
    badge: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    primaryAction: string;
    detail: string;
}

const STATUS_CONFIG: Record<LinkStatusType, StatusConfig> = {
    invalid: {
        badge: "Invalid link",
        icon: <LinkIcon className="h-6 w-6" aria-hidden="true" />,
        title: "This link isn't valid",
        description:
            "The link you followed doesn't match anything we have on record. It may have been mistyped, already used, or replaced by a newer one.",
        primaryAction: "Request a new link",
        detail: "If you copied this link from an email, check that the full address came through without breaks.",
    },
    expired: {
        badge: "Link expired",
        icon: <TimerReset className="h-6 w-6" aria-hidden="true" />,
        title: "This link has expired",
        description:
            "For your security, links only stay active for a limited time. This one is no longer valid, but you can request a new one in seconds.",
        primaryAction: "Send a new link",
        detail: "New links are typically valid for 24 hours from when they're sent.",
    },
};

export default function LinkStatusPage({ status }: { status: string }) {
    const router = useRouter();

    const type: LinkStatusType = status === "expired" ? "expired" : "invalid";
    const config = STATUS_CONFIG[type];

    const handleGoHome = () => {
        router.push("/");
    };

    return (
        <>
            {/* <PlainNavbar /> */}
            <main className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4 py-12">
                <Card className="w-full max-w-md border-muted-foreground/10 shadow-sm">
                    <CardHeader className="items-center text-center">
                        <div
                            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                            aria-hidden="true"
                        >
                            {config.icon}
                        </div>
                        <Badge variant="outline" className="mb-2 font-normal text-muted-foreground">
                            {config.badge}
                        </Badge>
                        <CardTitle className="text-xl">{config.title}</CardTitle>
                        <CardDescription className="text-balance">{config.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">{config.detail}</p>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2">
                        {/* <Button className="w-full gap-2" onClick={handlePrimaryAction}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {config.primaryAction}
          </Button> */}
                        <Button variant="ghost" className="w-full gap-2" onClick={handleGoHome}>
                            <Home className="h-4 w-4" aria-hidden="true" />
                            Back to home
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </>
    );
}