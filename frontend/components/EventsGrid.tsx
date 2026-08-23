"use client";

import Link from "next/link";
import {
  AirplaneTilt,
  ArrowUpRight,
  Car,
  IdentificationCard,
  Megaphone,
  Receipt,
  Storefront,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { EVENT_CARDS } from "@/lib/events-meta";
import type { EventCardMeta } from "@/lib/events-meta";

const ICONS: Record<EventCardMeta["icon"], Icon> = {
  storefront: Storefront,
  car: Car,
  identificationCard: IdentificationCard,
  receipt: Receipt,
  megaphone: Megaphone,
  airplaneTilt: AirplaneTilt,
};

const SPANS = [
  "md:col-span-4",
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-6",
];

export function EventsGrid() {
  const { lang } = useApp();
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
      {EVENT_CARDS.map((ev, i) => {
        const Icon = ICONS[ev.icon];
        return (
          <Link
            key={ev.id}
            href={`/roadmap/${ev.id}`}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-[0_12px_32px_-16px_rgba(27,27,24,0.25)] ${SPANS[i]}`}
          >
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper text-saffron-deep">
                <Icon size={22} weight="duotone" />
              </span>
              <ArrowUpRight
                size={16}
                className="text-faint transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-saffron-deep"
              />
            </div>
            <div className="mt-8">
              <h3 className="text-[15px] font-semibold tracking-tight">
                {lang === "hi" ? ev.name_hi : ev.name_en}
              </h3>
              <p
                className={`mt-1 text-sm leading-relaxed text-muted ${
                  SPANS[i] === "md:col-span-2" ? "hidden lg:block" : ""
                }`}
              >
                {lang === "hi" ? ev.summary_hi : ev.summary_en}
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                {ev.step_count} {t(lang, "events.steps")} · {ev.portals_en}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
