import { Greeting } from "@/components/greeting";
import TitleWrapper from "@/components/title-wrapper";
import AirtimeForm from "./forms";

export default function AirtimePage() {

    const title = <Greeting />;
    const description = "Top up airtime on any network";

    return (
        <TitleWrapper title={title} description={description}>
            <AirtimeForm />
        </TitleWrapper>
    )
}
