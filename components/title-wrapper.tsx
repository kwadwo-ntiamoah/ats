import { Card } from "@/components/ui/card";
import { LockIcon } from "lucide-react";
import Image from "next/image";
import { ReactNode } from "react";
import { withBasePath } from "@/lib/base-path";

export default function TitleWrapper({ children, title, description }: { children: ReactNode, title: ReactNode, description: string }) {
    return (
        // Forms are single-column and built for phones/tablets, so the content column is
        // capped at a comfortable reading width rather than stretching across large screens.
        <div className="flex min-h-dvh flex-col bg-muted/50">
            <div className="relative overflow-hidden bg-[#2E3438] border-b-4 border-b-amber-500">
                <Image
                    src={withBasePath("/gcb_watermark.svg")}
                    height={280}
                    width={280}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute -right-10 top-1/2 h-auto w-44 -translate-y-1/2 opacity-60 sm:right-0 sm:w-56 md:w-70 lg:right-[8%]"
                />
                <div className="relative mx-auto flex w-full max-w-xl items-center gap-3 px-4 pt-8 pb-20 sm:px-6 md:pt-14 md:pb-24">
                    <Image src={withBasePath("/sidi_woman.png")} width={70} height={70} alt="sidi" className="h-auto w-14 shrink-0 md:w-[70px]" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="text-xl font-bold text-amber-500 md:text-3xl">{title}</p>
                        <p className="text-sm text-white/90">{description}</p>
                    </div>
                </div>
            </div>
            <div className="mx-auto w-full max-w-xl flex-1 px-3 pb-8 sm:px-6 md:pb-12">
                <Card className="relative -mt-14 w-full px-4 py-6 sm:px-6 md:-mt-16 md:px-10 md:py-10 md:shadow-lg">

                    {children}

                    <div className="flex items-center justify-center space-x-2">
                        <LockIcon color="#2B8AED" size={12} />
                        <p className="text-center text-xs text-gray-500">Your information is protected</p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
