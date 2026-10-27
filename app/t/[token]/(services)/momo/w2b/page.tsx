import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import WalletToBankForm from "./forms";

export default function WalletToBankPage() {

    const title = <Greeting />;
    const description = "Move funds from your mobile money wallet into your bank account";

    return (
        <TitleWrapper title={title} description={description}>
            <WalletToBankForm />
        </TitleWrapper>
    )
}
