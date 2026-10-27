import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import DataForm from "./forms";

export default function DataPage() {

    const title = <Greeting />;
    const description = "Buy a data bundle on any network";

    return (
        <TitleWrapper title={title} description={description}>
            <DataForm />
        </TitleWrapper>
    )
}
