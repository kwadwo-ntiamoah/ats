import TitleWrapper from "@/components/title-wrapper";
import ResetPinForm from "./forms/pin_reset.form";

export default function SetPinPage() {
    const title = "PIN Reset 😃";
    const description = "Provide your new PIN";

    return (
        <TitleWrapper title={title} description={description}>
            <ResetPinForm />
        </TitleWrapper>
    )
}