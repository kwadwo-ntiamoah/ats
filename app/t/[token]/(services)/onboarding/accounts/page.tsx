import TitleWrapper from "../../../../../../components/title-wrapper"
import AccountsForm from "./forms/accounts.form"

export default function AccountsPage() {
    const title = "Set Account 😃";
    const description = "Select your preferred account to continue with your onboarding";

    return (
        <TitleWrapper title={title} description={description}>
            <AccountsForm  />
        </TitleWrapper>
    )
}