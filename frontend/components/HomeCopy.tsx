"use client";

import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { ChatCircleDots, GitFork, CheckCircle } from "@phosphor-icons/react";

export function HomeCopy() {
  const { lang } = useApp();
  return (
    <div>
      <p className="rise font-mono text-[11px] uppercase tracking-[0.2em] text-saffron-deep">
        {t(lang, "hero.eyebrow")}
      </p>
      <h1
        className="rise mt-3 sm:mt-4 w-full text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-bold sm:font-semibold leading-[1.12] tracking-tight text-ink break-words"
        style={{ animationDelay: "60ms" }}
      >
        {t(lang, "hero.h1a")}{" "}
        <span className="text-saffron-deep">{t(lang, "hero.h1b")}</span>
      </h1>
      <p
        className="rise mt-3 sm:mt-5 max-w-[52ch] text-xs sm:text-sm md:text-base leading-relaxed text-muted"
        style={{ animationDelay: "120ms" }}
      >
        {t(lang, "hero.sub")}
      </p>
    </div>
  );
}

export function EventsGridTitle() {
  const { lang } = useApp();
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
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
    },
    {
      n: "02",
      icon: GitFork,
      titleKey: "how.two.t",
      descKey: "how.two.d",
    },
    {
      n: "03",
      icon: CheckCircle,
      titleKey: "how.three.t",
      descKey: "how.three.d",
    },
  ];
  return (
    <>
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        {t(lang, "how.title")}
      </h2>
      <ol className="mt-8 grid gap-8 border-t border-line pt-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-line">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.n} className={i > 0 ? "md:pl-8" : ""}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron-soft text-saffron-deep">
                  <Icon size={18} weight="duotone" />
                </span>
                <span className="font-mono text-xs font-semibold text-faint">
                  STEP {s.n}
                </span>
              </div>
              <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-ink">
                {t(lang, s.titleKey)}
              </h3>
              <p className="mt-1.5 max-w-[38ch] text-sm leading-relaxed text-muted">
                {t(lang, s.descKey)}
              </p>
            </li>
          );
        })}
      </ol>
    </>
  );
}
