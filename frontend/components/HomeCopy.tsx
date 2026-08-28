"use client";

import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import {
  ChatCircleDots,
  GitFork,
  CheckCircle,
  Microphone,
  Translate,
  TreeStructure,
  HourglassHigh,
  ShieldCheck,
  FilePdf,
} from "@phosphor-icons/react";

export function HomeCopy() {
  const { lang } = useApp();
  return (
    <div className="relative">
      {/* Official Citizen Docket Ribbon Badge */}
      <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-saffron/30 bg-saffron-soft/70 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-saffron-deep">
          <span>॥</span>
          <span>नागरिक सेवा प्रपत्र</span>
          <span>॥</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint hidden xs:inline">
          OFFICIAL CITIZEN COPILOT · INDIA STACK
        </span>
      </div>

      <p className="rise font-mono text-[11px] uppercase tracking-[0.18em] text-saffron-deep font-semibold">
        {t(lang, "hero.eyebrow")}
      </p>
      <h1
        className="rise mt-2.5 sm:mt-3 w-full text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] font-bold sm:font-semibold leading-[1.12] tracking-tight text-ink break-words"
        style={{ animationDelay: "60ms" }}
      >
        {t(lang, "hero.h1a")}{" "}
        <span className="text-saffron-deep underline decoration-saffron/30 decoration-wavy decoration-1 underline-offset-4">
          {t(lang, "hero.h1b")}
        </span>
      </h1>
      <p
        className="rise mt-3 sm:mt-4 max-w-[54ch] text-xs sm:text-sm md:text-base leading-relaxed text-muted"
        style={{ animationDelay: "120ms" }}
      >
        {t(lang, "hero.sub")}
      </p>
    </div>
  );
}

export function DemoPersonaQuickBar() {
  const { digilockerPersona, linkDigiLocker, unlinkDigiLocker, announce } = useApp();

  const personas = [
    { id: "ramesh", name: "Ramesh", label: "MSME Shop · Lucknow", icon: "🏢" },
    { id: "priya", name: "Priya", label: "Student · Bengaluru", icon: "🎓" },
    { id: "sunita", name: "Sunita", label: "Rural SHG · Patna", icon: "🌾" },
    { id: "vikram", name: "Vikram", label: "Freelancer · Pune", icon: "💼" },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 sm:p-3.5 shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-saffron-soft text-saffron-deep text-xs font-bold shrink-0">
          ⚡
        </span>
        <div>
          <p className="text-xs font-semibold text-ink">
            Instant Demo Personas
          </p>
          <p className="text-[10.5px] text-muted hidden sm:block">
            1-Click India Stack sandbox to test pre-filled forms & DigiLocker sync
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {personas.map((p) => {
          const active = digilockerPersona === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                linkDigiLocker(p.id);
                announce(`Loaded demo persona: ${p.name}`);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium transition-all ${
                active
                  ? "bg-leaf text-white font-semibold shadow-xs ring-2 ring-leaf/30"
                  : "bg-paper border border-line text-muted hover:border-saffron hover:text-ink"
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
              <span className="hidden md:inline text-[10.5px] opacity-75 font-normal">
                ({p.label.split("·")[0].trim()})
              </span>
              {active && <span className="text-[10px]">✓</span>}
            </button>
          );
        })}

        {digilockerPersona && (
          <button
            type="button"
            onClick={() => {
              unlinkDigiLocker();
              announce("Reset demo persona");
            }}
            className="rounded-full px-2 py-1 text-[11px] font-mono text-alert hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export function EventsGridTitle() {
  const { lang } = useApp();
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl text-ink">
        {t(lang, "events.title")}
      </h2>
      <p className="mt-1 max-w-[60ch] text-sm text-muted">{t(lang, "events.sub")}</p>
    </div>
  );
}

export function HowItWorksBlock() {
  const { lang } = useApp();
  const steps = [
    {
      n: "01",
      icon: ChatCircleDots,
      titleKey: "how.one.t",
      descKey: "how.one.d",
      tags: [
        { label: "Voice Search", icon: Microphone },
        { label: "8 Languages", icon: Translate },
      ],
    },
    {
      n: "02",
      icon: GitFork,
      titleKey: "how.two.t",
      descKey: "how.two.d",
      tags: [
        { label: "DAG Roadmap", icon: TreeStructure },
        { label: "Est. Timeline", icon: HourglassHigh },
      ],
    },
    {
      n: "03",
      icon: CheckCircle,
      titleKey: "how.three.t",
      descKey: "how.three.d",
      tags: [
        { label: "DigiLocker Sync", icon: ShieldCheck },
        { label: "Printable PDF", icon: FilePdf },
      ],
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-saffron-deep font-semibold">
            SIMPLE 3-STEP PROCESS
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            {t(lang, "how.title")}
          </h2>
        </div>
        <p className="max-w-[44ch] text-xs sm:text-sm text-muted leading-relaxed">
          From voice query to verified government paperwork without intermediaries or data tracking.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.n}
              className="relative flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-saffron/40 transition-all group overflow-hidden"
            >
              {/* Giant Watermark Step Number in Background */}
              <span className="pointer-events-none absolute right-4 top-2 font-mono text-5xl sm:text-6xl font-black text-line/60 select-none group-hover:text-saffron-soft/70 transition-colors">
                {s.n}
              </span>

              <div>
                {/* Header: Duotone Icon */}
                <div className="flex items-center relative z-10">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-saffron-soft text-saffron-deep border border-saffron/20 group-hover:scale-105 transition-transform shadow-xs">
                    <Icon size={22} weight="duotone" />
                  </div>
                </div>

                {/* Step badge */}
                <div className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-saffron-deep bg-saffron-soft/70 px-2 py-0.5 rounded-full border border-saffron/25">
                  STEP {s.n}
                </div>

                {/* Title and Description */}
                <h3 className="mt-2.5 text-base sm:text-lg font-semibold tracking-tight text-ink leading-snug">
                  {t(lang, s.titleKey)}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted leading-relaxed">
                  {t(lang, s.descKey)}
                </p>
              </div>

              {/* Bottom Feature Tags */}
              <div className="mt-5 pt-4 border-t border-line/60 flex flex-wrap gap-1.5">
                {s.tags.map((tag, ti) => {
                  const TagIcon = tag.icon;
                  return (
                    <span
                      key={ti}
                      className="inline-flex items-center gap-1 rounded-md bg-paper px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-muted border border-line"
                    >
                      <TagIcon size={12} className="text-saffron-deep" />
                      {tag.label}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
