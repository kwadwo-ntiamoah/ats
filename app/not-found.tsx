import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, MapPin, Flag, ArrowRight, ArrowUpRight } from "lucide-react";
import { PlainNavbar } from "@/components/navbar";

export default function NotFound() {
  return (
    <>
      {/* <PlainNavbar /> */}
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFFDF8] px-6">
        {/* Ghost numeral watermark */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[38vw] font-extrabold leading-none tracking-tighter text-amber-500/6 md:text-[26vw]"
        >
          404
        </span>

        {/* Soft radial glow behind the icon */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-[18%] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/25 blur-3xl"
        />

        <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
          {/* Icon badge */}
          <div className="motion-safe:animate-[float_5s_ease-in-out_infinite] relative flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-b from-amber-400 to-amber-500 shadow-[0_10px_30px_-8px_rgba(217,158,21,0.55)]">
            <Compass className="h-9 w-9 text-neutral-950" strokeWidth={1.75} />
          </div>

          <h1 className="mt-8 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            Looks like you&apos;re lost
          </h1>

          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-neutral-500">
            The page you&apos;re looking for could not be found. In the mean
            time you can
          </p>

          {/* Route motif connecting the message to the actions */}
          <div className="mt-6 flex items-center gap-2 text-amber-500/70" aria-hidden>
            <MapPin className="h-3.5 w-3.5" />
            <span className="h-px w-6 border-t border-dashed border-amber-400/60" />
            <span className="h-px w-6 border-t border-dashed border-amber-400/60" />
            <span className="h-px w-6 border-t border-dashed border-amber-400/60" />
            <Flag className="h-3.5 w-3.5" />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button nativeButton={false}
              render={<Link href="/accounts/open" />}
              className="h-12 px-6 text-[15px] font-semibold text-neutral-950"
            >
              Open a GCB Account
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button nativeButton={false}
              render={<Link href="/loans" />}
              variant="outline"
              className="h-12 border-neutral-200 bg-black text-white px-6 text-[15px] font-semibold shadow-sm hover:bg-black/80 hover:text-white"
            >
              Book a loan
            </Button>
          </div>

          <Link
            href="/mobile-app"
            className="group mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-primary"
          >
            Download the GCB Mobile App
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      </main>
    </>

  );
}