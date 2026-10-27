import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import BankToWalletForm from "./forms";

export default function BankToWalletPage() {

    const title = <Greeting />;
    const description = "Transfer funds from your bank account to a mobile money wallet";

    return (
        <TitleWrapper title={title} description={description}>
            <BankToWalletForm />
        </TitleWrapper>
    )
}
