import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import RemoveAccountForm from "./forms/remove_account.form";

export default function CheckBalancePage() {

    const title = <Greeting />;
    const description = "Follow the steps below to remove  an account";

    return (
        <TitleWrapper title={title} description={description}>
            <RemoveAccountForm />
        </TitleWrapper>
    )
}