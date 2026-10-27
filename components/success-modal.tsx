import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { ReturnToWhatsapp } from "./return-to-whatsapp";

interface SuccessModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    message: string;
}

export function SuccessModal({ open, onOpenChange, title, message }: SuccessModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <div className="flex flex-col items-center text-center pt-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>

                    <DialogHeader>
                        <DialogTitle className="text-base font-medium">{title}</DialogTitle>
                        <DialogDescription className="text-sm">
                            {message}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-5">
                        <ReturnToWhatsapp />
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}