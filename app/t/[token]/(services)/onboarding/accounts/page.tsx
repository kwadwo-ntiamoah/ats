import TitleWrapper from "../../../../../../components/title-wrapper"
import AccountsForm from "./forms/accounts.form"
import ProgressBar from "../components/progress-bar"

export default function AccountsPage() {
    const title = "Set Account 😃";
    const description = "Select your primary account to finish registering for WhatsApp Banking";

    return (
        <TitleWrapper title={title} description={description}>
            <ProgressBar progress={100} label="Step 3 of 3" />
            <AccountsForm />
        </TitleWrapper>
    )
}