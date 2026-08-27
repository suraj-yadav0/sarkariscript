"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  FileText,
  Stamp,
  UserCircle,
  GlobeHemisphereWest,
} from "@phosphor-icons/react";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import { LanguageSelector } from "./LanguageSelector";
import { A11yToolbar } from "./A11yToolbar";

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full p-1.5 xs:px-2 sm:px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-saffron shrink-0 ${
        active
          ? "bg-ink text-paper font-medium"
          : "text-muted hover:text-ink hover:bg-black/5"
      }`}
    >
      {icon}
      <span className="hidden md:inline text-xs sm:text-sm">{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { lang, profileCompletionPct, announcement } = useApp();
  const pathname = usePathname();

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-hidden">
      {/* Skip Link for Screen Readers & Keyboard Navigation */}
      <a href="#main-content" className="skip-link">
        {t(lang, "nav.skip")}
      </a>

      {/* Screen Reader Live Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <header
        role="banner"
        className="print-hidden sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md"
      >
        <div className="mx-auto flex h-14 sm:h-16 max-w-[1200px] items-center justify-between gap-1 sm:gap-3 px-2.5 sm:px-4 md:px-6">
          {/* Brand Logo */}
          <Link
            href="/"
            aria-label="SarkariScript Home"
            className="group flex items-center gap-1.5 sm:gap-2 shrink-0 focus-visible:outline-2 focus-visible:outline-saffron"
          >
            <span className="flex h-7.5 w-7.5 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-saffron text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] shrink-0">
              <Stamp size={17} weight="duotone" className="sm:w-5 sm:h-5" />
            </span>
            <span className="leading-none">
              <span className="block text-[13px] sm:text-[15px] font-semibold tracking-tight text-ink">
                SarkariScript
              </span>
              <span className="hidden sm:block font-mono text-[9.5px] sm:text-[10px] uppercase tracking-[0.14em] text-faint">
                citizen copilot
              </span>
            </span>
          </Link>

          {/* Navigation Links & Action Controls */}
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            <nav
              role="navigation"
              aria-label="Main Navigation"
              className="flex items-center gap-0.5 sm:gap-1"
            >
              <NavItem
                href="/"
                label={t(lang, "nav.home")}
                active={pathname === "/"}
                icon={
                  <GlobeHemisphereWest
                    size={16}
                    weight={activeWeight(pathname, "/")}
                    className="sm:w-[17px] sm:h-[17px]"
                  />
                }
              />
              <NavItem
                href="/profile"
                label={t(lang, "nav.profile")}
                active={pathname === "/profile"}
                icon={
                  <UserCircle
                    size={16}
                    weight={activeWeight(pathname, "/profile")}
                    className="sm:w-[17px] sm:h-[17px]"
                  />
                }
              />
              <NavItem
                href="/rti"
                label={t(lang, "nav.rti")}
                active={pathname === "/rti"}
                icon={
                  <FileText
                    size={16}
                    weight={activeWeight(pathname, "/rti")}
                    className="sm:w-[17px] sm:h-[17px]"
                  />
                }
              />
            </nav>

            <div className="flex items-center gap-1 sm:gap-1.5 pl-1 sm:pl-2 border-l border-line shrink-0">
              <LanguageSelector />
              <A11yToolbar />
            </div>
          </div>
        </div>

        {profileCompletionPct > 0 && profileCompletionPct < 100 && pathname !== "/profile" && (
          <div
            className="h-0.5 w-full bg-line"
            role="progressbar"
            aria-valuenow={profileCompletionPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completion progress"
          >
            <div
              className="h-full bg-saffron transition-all duration-500"
              style={{ width: `${profileCompletionPct}%` }}
              title={`${profileCompletionPct}%`}
            />
          </div>
        )}
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <footer
        role="contentinfo"
        className="print-hidden mt-24 border-t border-line"
      >
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-faint md:flex-row md:items-center md:px-6">
          <p className="max-w-md leading-relaxed">
            Demo project built for a hackathon. Not affiliated with the
            Government of India. Portal links point to official websites;
            always verify on the portal itself.
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.14em]">
            सरकारीस्क्रिप्ट · built for bharat
          </p>
        </div>
      </footer>
    </div>
  );
}

function activeWeight(pathname: string, href: string) {
  return pathname === href ? ("fill" as const) : ("regular" as const);
}
