import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import BalanceForm from "./forms/balance.form";

export default function CheckBalancePage() {

    const title = <Greeting />;
    const description = "Follow the steps below to check your account balance";

    return (
        <TitleWrapper title={title} description={description}>
            <BalanceForm />
        </TitleWrapper>
    )
}