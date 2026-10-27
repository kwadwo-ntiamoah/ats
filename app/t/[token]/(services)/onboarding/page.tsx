"use client"

import { IdVerificationFormValues, idVerificationSchema } from "@/lib/validations/id_verification";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { IdCardIcon, LightbulbIcon, LightbulbOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import TitleWrapper from "@/components/title-wrapper";
import ProgressBar from "./components/progress-bar";
import { verifyGhanaCardAgainstFCUBSAsync } from "@/lib/actions/onboarding";
import { toast } from "@/components/ui/toast";


export default function OnboardingPage() {
    const [isPending, startTransition] = useTransition()

    const params = useParams();
    const { token } = params;

    const router = useRouter()

    useEffect(() => {
        // The face detector is a separate download. Starting it while the user is
        // still typing their card number means it's usually ready by the time the
        // selfie camera opens (the loaded detector survives client-side navigation).
        // Failures are logged inside initFaceDetector and retried on the selfie page.
        import("@/lib/actions/faceCheck")
            .then(({ initFaceDetector }) => initFaceDetector())
            .catch(() => { });
    }, []);

    const form = useForm<IdVerificationFormValues>({
        resolver: zodResolver(idVerificationSchema),
        defaultValues: { ghanaCard: "" }
    });

    const onsubmitAsync = (values: IdVerificationFormValues) => {
        startTransition(async () => {

            // verify ghana card against flexcube
            var response = await verifyGhanaCardAgainstFCUBSAsync(values);

            if (!response.success) {
                 toast.add({
                    title: "Warning",
                    description: response.error,
                });

                return;
            }

            // if valid move to next stage
            router.push(`/t/${token}/onboarding/selfie-verification`)
        })
    }

    const title = "Hi there 👋";
    const description = "I’ll help you set up your account by verifying your identity. The process is quick, simple, and secure";

    const inputGroupClass = `
        py-5 px-2
        has-[[data-slot=input-group-control]:focus-visible]:border-primary
        has-[[data-slot=input-group-control]:focus-visible]:ring-primary/50
        has-[[data-slot=input-group-control]:focus-visible]:ring-1
    `

    return (
        <TitleWrapper title={title} description={description} >
            <div className="flex flex-col">
                <ProgressBar progress={25} label="1 of 3" />
                <form onSubmit={form.handleSubmit(onsubmitAsync)} className="w-full flex flex-col space-y-5 ">
                    <Controller
                        name="ghanaCard"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel className="text-sm">
                                    <div className="flex flex-col space-y-1">
                                        <p className="font-bold text-xl">Let's Verify your identity</p>
                                        <p>Provide Ghana Card No</p>
                                    </div>
                                </FieldLabel>
                                <InputGroup className={inputGroupClass}>
                                    <InputGroupAddon>
                                        <IdCardIcon />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        placeholder="GHA-001122334-5"
                                        className="focus:ring-0! text-sm! bg-transparent"
                                    />
                                </InputGroup>

                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}

                                <FieldDescription className="text-xs flex space-x-2 items-start">
                                    <LightbulbIcon size={15} />
                                    <span>Use the number as shown on your Ghana Card</span>
                                </FieldDescription>
                            </Field>
                        )}
                    />

                    <Button type="submit">
                        {isPending ? <Spinner /> : "Proceed"}
                    </Button>
                </form>
            </div>
        </TitleWrapper>
    )
}

