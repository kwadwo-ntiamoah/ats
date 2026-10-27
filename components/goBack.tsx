"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { IconArrowBack } from "@tabler/icons-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <Button onClick={() => router.back()} size="xs" className="px-0" variant="ghost">
      <IconArrowBack />
      Go Back
    </Button>
  );
}