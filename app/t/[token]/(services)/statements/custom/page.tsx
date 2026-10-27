import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import CustomStatementForm from "./forms/statement.form";

export default function CustomStatementPage() {

    const title = <Greeting />;
    const description = "Generate your statements by providing the required data";

    return (
        <TitleWrapper title={title} description={description}>
            <CustomStatementForm />
        </TitleWrapper>
    )
}