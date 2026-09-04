"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/format";
import type { MosqueSetting } from "@/types/database";

interface NavbarProps {
  settings: MosqueSetting | null;
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Prayer Times", href: "/prayer-times" },
  { label: "Events", href: "/events" },
  { label: "Khutbah", href: "/khutbah" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

const desktopHiddenLinks = new Set(["/about", "/prayer-times", "/contact"]);

export function Navbar({ settings }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const mosqueName = settings?.mosque_name ?? "Al-Noor Mosque";

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-50 border-b-2 border-[#C8A951]/60 transition-all duration-300",
          scrolled
            ? "bg-[#065F46]/95 shadow-lg backdrop-blur-md"
            : "bg-[#065F46] shadow-md"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <span className="text-lg font-bold text-gold-gradient">{mosqueName}</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks
              .filter((link) => !desktopHiddenLinks.has(link.href))
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-white/15 text-white"
                      : "text-emerald-100 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            <Link
              href="/donate"
              className={cn(
                "ml-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#064E3B] transition-colors hover:bg-[#b89941]",
                pathname === "/donate" && "ring-2 ring-white/40"
              )}
            >
              Donate
            </Link>
            <Link
              href="/login"
              className="ml-1 rounded-lg border border-emerald-400/40 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10"
            >
              Login
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-[#065F46] shadow-2xl transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#C8A951]/40 px-4">
          <span className="text-lg font-bold text-gold-gradient">Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto p-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-white/15 text-white"
                  : "text-emerald-100 hover:bg-white/10 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/donate"
            className="mt-2 rounded-lg bg-[#C8A951] px-3 py-2.5 text-center text-sm font-bold text-[#064E3B] transition-colors hover:bg-[#b89941]"
          >
            Donate
          </Link>
          <Link
            href="/login"
            className="mt-1 rounded-lg border border-emerald-400/40 px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Login
          </Link>
        </div>
      </div>
    </>
  );
}
