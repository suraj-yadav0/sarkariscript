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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-ink text-paper"
          : "text-muted hover:text-ink hover:bg-black/4"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { lang, setLang, profileCompletionPct } = useApp();
  const pathname = usePathname();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="print-hidden sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 md:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-saffron text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]">
              <Stamp size={20} weight="duotone" />
            </span>
            <span className="leading-none">
              <span className="block text-[15px] font-semibold tracking-tight">
                SarkariScript
              </span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                citizen copilot
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavItem
              href="/"
              label={t(lang, "nav.home")}
              active={pathname === "/"}
              icon={<GlobeHemisphereWest size={17} weight={activeWeight(pathname, "/")} />}
            />
            <NavItem
              href="/profile"
              label={t(lang, "nav.profile")}
              active={pathname === "/profile"}
              icon={<UserCircle size={17} weight={activeWeight(pathname, "/profile")} />}
            />
            <NavItem
              href="/rti"
              label={t(lang, "nav.rti")}
              active={pathname === "/rti"}
              icon={<FileText size={17} weight={activeWeight(pathname, "/rti")} />}
            />
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="ml-1 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs font-medium text-muted transition-colors hover:border-ink hover:text-ink active:scale-[0.98]"
              aria-label="Toggle language"
            >
              {lang === "en" ? "हिंदी" : "EN"}
            </button>
          </nav>
        </div>
        {profileCompletionPct > 0 && profileCompletionPct < 100 && pathname !== "/profile" && (
          <div className="h-0.5 w-full bg-line">
            <div
              className="h-full bg-saffron transition-all duration-500"
              style={{ width: `${profileCompletionPct}%` }}
              title={`${profileCompletionPct}%`}
            />
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="print-hidden mt-24 border-t border-line">
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
