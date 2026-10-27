"use client";

import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  Award,
  BadgeCheck,
  Coins,
  Phone,
  MessageCircle,
  Mail,
  HelpCircle,
  MapPin,
} from "lucide-react";

const trustItems = [
  { icon: Shield, label: "Bank of Ghana Licensed" },
  { icon: Lock, label: "256-bit SSL Encrypted" },
  { icon: Award, label: "ISO 27001 Certified" },
  { icon: BadgeCheck, label: "PCI DSS Compliant" },
  { icon: Coins, label: "Member of GDPS" },
];

const stats = [
  { value: "3M+", label: "Customers" },
  { value: "73+", label: "Years" },
  { value: "180+", label: "Branches" },
  { value: "24/7", label: "Support" },
];

const assistanceButtons = [
  { icon: Phone, label: "Call Us" },
  { icon: MessageCircle, label: "Live Chat" },
  { icon: Mail, label: "Email" },
  { icon: HelpCircle, label: "FAQs" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Cookie Policy", href: "#" },
  { label: "Cookie Preferences", href: "#" },
  { label: "Terms & Conditions", href: "#" },
  { label: "Cyber & Information Security", href: "#" },
  { label: "Visit our website", href: "#" },
];

export function SiteFooter() {
  return (
    <footer className="w-full bg-neutral-950 text-neutral-300 border-t-4 border-amber-500">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Trust & Security */}
          <div>
            <h3 className="text-lg font-semibold text-white">
              Trust &amp; Security
            </h3>
            <div className="mt-3 border-b border-neutral-800" />

            <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
              {trustItems.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-300">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl font-bold text-amber-500">
                    {value}
                  </div>
                  <div className="mt-1 text-xs tracking-wide text-neutral-500">
                    {label.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Need Assistance */}
          <div>
            <h3 className="text-lg font-semibold text-white">
              Need Assistance?
            </h3>
            <p className="mt-3 text-sm text-neutral-400">
              Our dedicated support team is ready to help you with your
              account opening process.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {assistanceButtons.map(({ icon: Icon, label }) => (
                <Button
                  key={label}
                  variant="outline"
                  className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>

            <div className="mt-3">
              <Button
                variant="outline"
                className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 hover:text-white"
              >
                <MapPin className="h-4 w-4" />
                Find Branch
              </Button>
            </div>

            <div className="mt-8">
              <p className="font-semibold text-white">Working Hours:</p>
              <p className="mt-1 text-sm text-neutral-400">
                Monday - Friday: 8:30am-4:00pm
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-neutral-800 pt-6">
          <p className="text-center text-sm text-neutral-500">
            © {new Date().getFullYear()} GCB Bank PLC. All rights reserved. |
            A Member of{" "}
            <a href="#" className="text-amber-500 hover:underline">
              Ghana Deposit Protection Scheme
            </a>{" "}
            (GDPS)
          </p>

          <nav className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {legalLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm text-neutral-400 hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}