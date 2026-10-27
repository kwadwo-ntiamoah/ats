"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { validateOtpAsync, getOtpAsync } from "@/lib/actions/otp";

const RESEND_COOLDOWN = 30; // seconds

type OtpOverlayProps = {
  token: string;
  onVerified: (isValid: boolean) => void
  /** Masked destination for the code, e.g. "•••• 4821" or "j***@mail.com" */
  //destination?: string;
};

export function OtpOverlay({ token, onVerified }: OtpOverlayProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [isVerifying, startVerify] = useTransition();
  const [isResending, startResend] = useTransition();
  const router = useRouter();
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // auto-submit once all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6) handleVerify();
  }, [otp]);

  function handleVerify() {
    setError(null);
    startVerify(async () => {
      const result = await validateOtpAsync(otp, token);
      if (!result.success) {
        setError(result.error ?? "That code didn't match. Try again.");
        setOtp("");
        return;
      }

      onVerified(result.data.isValid); // tell the parent to route away — the overlay itself doesn't navigate
    });
  }``

  function handleResend() {
    setError(null);
    startResend(async () => {
      var result = await getOtpAsync(token);

      if (!result.success) {
        setError(result.error ?? "That code didn't match. Try again.");
        setOtp("");
        return;
      }

      setCooldown(RESEND_COOLDOWN);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-100 bg-white p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-b from-amber-400 to-amber-500 shadow-[0_8px_20px_-8px_rgba(217,158,21,0.6)]">
          <ShieldCheck className="h-6 w-6 text-neutral-950" strokeWidth={1.75} />
        </div>

        <h2 className="mt-5 text-xl font-bold tracking-tight text-neutral-900">
          Verify it&apos;s you
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
          Enter the 6-digit code we sent to your registered contact
        </p>

        <div className="mt-6 flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={isVerifying}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="h-12 w-10 text-lg sm:w-11 data-[active=true]:border-amber-500 data-[active=true]:ring-amber-500/30"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <p
          ref={errorRef}
          role="alert"
          aria-live="polite"
          className={`mt-3 text-center text-sm text-red-500 transition-opacity ${
            error ? "opacity-100" : "opacity-0"
          }`}
        >
          {error ?? "placeholder"}
        </p>

        <Button
          onClick={handleVerify}
          disabled={otp.length < 6 || isVerifying}
          className="mt-4 w-full"
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </Button>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-sm text-neutral-500">
          <span>Didn&apos;t get a code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="inline-flex items-center gap-1 font-medium text-amber-600 transition-colors hover:text-amber-700 disabled:cursor-not-allowed disabled:text-neutral-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
          </button>
        </div>
      </div>
    </div>
  );
}