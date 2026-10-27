import { Button } from "./ui/button"

export function ReturnToWhatsapp() {
    const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER ?? "233256378482"
    const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

    return (
        <Button className="w-full" size="lg"
        >
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                Return to Chat
            </a>
        </Button>
    )
}