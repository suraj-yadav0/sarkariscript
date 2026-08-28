"use client";

import Link from "next/link";
import {
  AirplaneTilt,
  ArrowUpRight,
  Baby,
  BowlFood,
  Car,
  CreditCard,
  Fingerprint,
  Heartbeat,
  IdentificationCard,
  Megaphone,
  Receipt,
  Storefront,
  UserCheck,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { EVENT_CARDS, getEventName, getEventSummary } from "@/lib/events-meta";
import type { EventCardMeta } from "@/lib/events-meta";

const ICONS: Record<EventCardMeta["icon"], Icon> = {
  storefront: Storefront,
  car: Car,
  identificationCard: IdentificationCard,
  receipt: Receipt,
  megaphone: Megaphone,
  airplaneTilt: AirplaneTilt,
  fingerprint: Fingerprint,
  creditCard: CreditCard,
  bowlFood: BowlFood,
  userCheck: UserCheck,
  heartbeat: Heartbeat,
  baby: Baby,
};

export function EventsGrid() {
  const { lang } = useApp();
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {EVENT_CARDS.map((ev) => {
        const Icon = ICONS[ev.icon] || Storefront;
        const name = getEventName(ev, lang);
        const summary = getEventSummary(ev, lang);
        return (
          <Link
            key={ev.id}
            href={`/roadmap/${ev.id}`}
            role="listitem"
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-[0_12px_32px_-16px_rgba(27,27,24,0.25)] focus-visible:outline-2 focus-visible:outline-saffron min-h-[170px]"
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
            <div className="mt-4">
              <h3 className="text-[15px] font-semibold tracking-tight text-ink">
                {name}
              </h3>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted line-clamp-2">
                {summary}
              </p>
              <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                {ev.step_count} {t(lang, "events.steps")} · {ev.portals_en}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
