"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ArrowLeftIcon } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <Button onClick={() => router.back()} size="xs" className="self-start px-0" variant="ghost">
      <ArrowLeftIcon />
      Go Back
    </Button>
  );
}