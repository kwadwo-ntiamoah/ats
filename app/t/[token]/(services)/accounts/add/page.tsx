import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import AddAccountForm from "./forms/add_account.form";

export default function CheckBalancePage() {

    const title = <Greeting />;
    const description = "Follow the steps below to add an account";

    return (
        <TitleWrapper title={title} description={description}>
            <AddAccountForm />
        </TitleWrapper>
    )
}