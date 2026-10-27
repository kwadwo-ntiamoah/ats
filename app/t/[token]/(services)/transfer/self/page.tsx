import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import SelfTransferForm from "./forms";

export default function SelfTransferPage() {

    const title = <Greeting />;
    const description = "Transfer funds between your own accounts";

    return (
        <TitleWrapper title={title} description={description}>
            <SelfTransferForm />
        </TitleWrapper>
    )
}
