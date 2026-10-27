import { CheckCircleIcon } from "lucide-react";

export function PinCreationTips() {
    return (
        <div className="flex flex-col space-y-2">
            <p className="text-[15px] font-semibold">Tips for creating a secured PIN</p>
            <div className="flex flex-col space-y-2.5">
                {[
                    "Do not use repeated digits (eg. 1111, 2222)",
                    "Do not use sequential numbers (eg. 1234)",
                    "Choose a hard to guess PIN"
                ].map(item => (
                    <div className="flex items-center space-x-1" key={item}>
                        <CheckCircleIcon color="#198754" size={12} />
                        <p className="text-xs">{item}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}