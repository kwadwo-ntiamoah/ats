import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { ReactNode } from "react";

export default function ProgressBar({ progress, label }: { progress: number, label: ReactNode }) {
    return (
        <Progress value={progress} className="w-full pb-5">
            <ProgressLabel className="text-xs text-gray-400">
                {label}
            </ProgressLabel>
            <ProgressValue className="text-xs text-amber-500 font-bold" />
        </Progress>
    )
}