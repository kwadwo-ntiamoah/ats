type PinPromptProps = {
    title?: string
    description: string
}

// Short heading and explanation shown above every PIN input, so the customer
// knows why the PIN is being asked for before they type it.
export function PinPrompt({ title = "Confirm with your PIN", description }: PinPromptProps) {
    return (
        <div className="space-y-1">
            <p className="text-base font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    )
}
