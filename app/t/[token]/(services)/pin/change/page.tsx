import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import ChangePinForm from "./forms/pin.change.form";

export default function ChangePINPage() {
    const title = <Greeting />;
    const description = "Follow the steps below to securely change your PIN";

    return (
        <TitleWrapper title={title} description={description}>
            <ChangePinForm />
        </TitleWrapper>
    )
} 