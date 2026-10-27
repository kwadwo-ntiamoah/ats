import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import LocalTransferForm from "./forms";

export default function LocalTransferPage() {

    const title = <Greeting />;
    const description = "Transfer funds to another bank account";

    return (
        <TitleWrapper title={title} description={description}>
            <LocalTransferForm />
        </TitleWrapper>
    )
}
