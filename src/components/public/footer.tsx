import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import type { MosqueSetting } from "@/types/database";

interface FooterProps {
  settings: MosqueSetting | null;
}

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Prayer Times", href: "/prayer-times" },
  { label: "Events", href: "/events" },
  { label: "Donate", href: "/donate" },
  { label: "Contact", href: "/contact" },
];

export function Footer({ settings }: FooterProps) {
  const mosqueName = settings?.mosque_name ?? "Al-Noor Mosque";
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-[#043d2e] text-emerald-100 islamic-star-pattern-gold">
      <div className="absolute inset-0 bg-gradient-to-b from-[#043d2e]/95 to-[#043d2e]" />
      <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
          <div className="space-y-3">
            <span className="text-lg font-bold text-gold-gradient">{mosqueName}</span>
            <p className="text-sm leading-relaxed text-emerald-200/80">
              {settings?.footer_text ??
                "A welcoming place of worship, learning, and community service. Join us for prayers, programs, and events."}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#C8A951]">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-emerald-200/80 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#C8A951]">
              Contact Info
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A951]" />
                <span className="text-sm text-emerald-200/80">
                  {settings?.address ?? "123 Mosque Street, City"}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#C8A951]" />
                <a
                  href={`tel:${settings?.phone ?? ""}`}
                  className="text-sm text-emerald-200/80 transition-colors hover:text-white"
                >
                  {settings?.phone ?? "+1 (555) 000-0000"}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#C8A951]" />
                <a
                  href={`mailto:${settings?.email ?? ""}`}
                  className="text-sm text-emerald-200/80 transition-colors hover:text-white"
                >
                  {settings?.email ?? "info@alnoormosque.org"}
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#C8A951]">
              Prayer Times
            </h4>
            <p className="text-sm text-emerald-200/80">
              Check our prayer schedule page for the latest prayer and jamaat
              times updated daily.
            </p>
            <Link
              href="/prayer-times"
              className="inline-block rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#064E3B] transition-colors hover:bg-[#b89941]"
            >
              View Prayer Times
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-emerald-700/50 pt-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-emerald-300/60">
              &copy; {year} {mosqueName}. All rights reserved.
            </p>
            <p className="text-xs text-emerald-300/60">
              Managed with care for the community.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
