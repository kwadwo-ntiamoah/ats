import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import MiniStatementForm from "./forms/mini_statement.form";

export default function CustomStatementPage() {

    const title = <Greeting />;
    const description = "View your mini-statements";

    return (
        <TitleWrapper title={title} description={description}>
            <MiniStatementForm />
        </TitleWrapper>
    )
}