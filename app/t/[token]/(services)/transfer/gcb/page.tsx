import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import GcbTransferForm from "./forms";

export default function GcbTransferPage() {

    const title = <Greeting />;
    const description = "Transfer funds to another GCB account";

    return (
        <TitleWrapper title={title} description={description}>
            <GcbTransferForm />
        </TitleWrapper>
    )
}
