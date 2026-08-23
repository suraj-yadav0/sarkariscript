"use client";

import { ShieldCheck } from "@phosphor-icons/react";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { PROFILE_FIELDS, PROFILE_SECTIONS } from "@/lib/profile-fields";

export default function ProfilePage() {
  const { lang, hydrated, profile, setProfileField, profileCompletionPct } = useApp();

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-24 pt-10 md:px-6">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {t(lang, "profile.title")}
          </h1>
          <p className="mt-2 max-w-[60ch] leading-relaxed text-muted">
            {t(lang, "profile.sub")}
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-3xl font-semibold text-saffron-deep tabular-nums">
            {profileCompletionPct}%
          </span>
          <p className="font-mono text-[11px] uppercase tracking-wide text-faint">
            {t(lang, "profile.completion", { n: profileCompletionPct })}
          </p>
        </div>
      </header>

      <p className="rise mt-5 inline-flex items-start gap-2 rounded-lg border border-leaf/30 bg-leaf-soft px-3.5 py-2.5 text-sm text-leaf" style={{ animationDelay: "80ms" }}>
        <ShieldCheck size={17} weight="fill" className="mt-0.5 shrink-0" />
        {t(lang, "profile.privacy")}
      </p>

      <div className={`mt-8 space-y-8 transition-opacity ${hydrated ? "opacity-100" : "opacity-0"}`}>
        {PROFILE_SECTIONS.map((section) => {
          const fields = PROFILE_FIELDS.filter((f) => f.section === section);
          const filled = fields.filter((f) => (profile[f.key] ?? "").trim()).length;
          return (
            <section key={section}>
              <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  {t(lang, `profile.section.${section}`)}
                </h2>
                <span className="font-mono text-[11px] text-faint">
                  {filled}/{fields.length}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map((f) => (
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <label htmlFor={`pf-${f.key}`} className="text-[13px] font-medium">
                      {lang === "hi" ? f.label_hi : f.label_en}
                    </label>
                    <input
                      id={`pf-${f.key}`}
                      type={f.type ?? "text"}
                      value={profile[f.key] ?? ""}
                      onChange={(e) =>
                        setProfileField(
                          f.key,
                          f.uppercase ? e.target.value.toUpperCase() : e.target.value
                        )
                      }
                      placeholder={f.placeholder}
                      autoComplete="off"
                      className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-faint/70 focus:border-saffron focus:ring-2 focus:ring-saffron/20"
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
