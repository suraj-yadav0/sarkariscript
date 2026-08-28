"use client";

import { useState } from "react";
import { CheckCircle, LinkBreak, ShieldCheck, Sparkle } from "@phosphor-icons/react";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { DIGILOCKER_PERSONAS } from "@/lib/digilocker";
import { DigiLockerModal } from "@/components/DigiLockerModal";
import {
  PROFILE_FIELDS,
  PROFILE_SECTIONS,
  getProfileFieldLabel,
} from "@/lib/profile-fields";

export default function ProfilePage() {
  const {
    lang,
    hydrated,
    profile,
    setProfileField,
    profileCompletionPct,
    digilockerLinked,
    digilockerPersona,
    unlinkDigiLocker,
  } = useApp();

  const [isDigiLockerOpen, setIsDigiLockerOpen] = useState(false);

  const personaObj = DIGILOCKER_PERSONAS.find((p) => p.id === digilockerPersona);

  return (
    <div className="mx-auto max-w-[1000px] px-3.5 sm:px-4 pb-24 pt-6 sm:pt-10 md:px-6">
      <header className="rise flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-ink">
            {t(lang, "profile.title")}
          </h1>
          <p className="mt-1.5 sm:mt-2 max-w-[60ch] text-xs sm:text-sm leading-relaxed text-muted">
            {t(lang, "profile.sub")}
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-2xl sm:text-3xl font-semibold text-saffron-deep tabular-nums">
            {profileCompletionPct}%
          </span>
          <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wide text-faint">
            {t(lang, "profile.completion", { n: profileCompletionPct })}
          </p>
        </div>
      </header>

      {/* DigiLocker Sync Card */}
      <div
        className={`rise mt-4 sm:mt-5 overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-sm transition-all ${
          digilockerLinked
            ? "border-leaf/30 bg-leaf-soft/35"
            : "border-line bg-surface"
        }`}
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                digilockerLinked
                  ? "bg-leaf-soft text-leaf border border-leaf/30"
                  : "bg-saffron-soft text-saffron-deep border border-saffron/20"
              }`}
            >
              <ShieldCheck size={22} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ink">
                  DigiLocker Integration
                </h2>
                {digilockerLinked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft border border-leaf/30 px-2 py-0.5 font-mono text-[10px] font-semibold text-leaf">
                    <CheckCircle size={12} weight="fill" /> CONNECTED & VERIFIED
                  </span>
                ) : (
                  <span className="rounded-full bg-saffron-soft border border-saffron/25 px-2 py-0.5 font-mono text-[10px] font-semibold text-saffron-deep">
                    INDIA STACK
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted leading-relaxed max-w-[65ch]">
                {digilockerLinked
                  ? `Linked with ${personaObj?.name || "Govt DigiLocker"} · ${personaObj?.documents.length || 5} verified documents synced to your local storage.`
                  : "Import your authentic Aadhaar, PAN, and Class X certificates directly from DigiLocker to auto-fill every government form in 1-click."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {digilockerLinked ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsDigiLockerOpen(true)}
                  className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper transition-all"
                >
                  Switch Profile
                </button>
                <button
                  type="button"
                  onClick={unlinkDigiLocker}
                  className="rounded-xl border border-alert/30 bg-alert-soft px-3 py-1.5 text-xs font-medium text-alert hover:bg-alert-soft/80 transition-all flex items-center gap-1.5"
                >
                  <LinkBreak size={14} />
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsDigiLockerOpen(true)}
                className="rounded-xl bg-saffron-deep hover:bg-saffron px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all flex items-center gap-2"
              >
                <Sparkle size={15} weight="fill" className="text-saffron-soft" />
                Fetch from DigiLocker
              </button>
            )}
          </div>
        </div>
      </div>

      <p
        className="rise mt-3 inline-flex items-start gap-2 rounded-xl border border-leaf/30 bg-leaf-soft px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm text-leaf leading-relaxed"
        style={{ animationDelay: "80ms" }}
      >
        <ShieldCheck size={16} weight="fill" className="mt-0.5 shrink-0" />
        {t(lang, "profile.privacy")}
      </p>

      {/* DigiLocker Modal */}
      <DigiLockerModal
        isOpen={isDigiLockerOpen}
        onClose={() => setIsDigiLockerOpen(false)}
      />

      <div
        className={`mt-6 sm:mt-8 space-y-6 sm:space-y-8 transition-opacity ${
          hydrated ? "opacity-100" : "opacity-0"
        }`}
      >
        {PROFILE_SECTIONS.map((section) => {
          const fields = PROFILE_FIELDS.filter((f) => f.section === section);
          const filled = fields.filter((f) =>
            (profile[f.key] ?? "").trim()
          ).length;
          return (
            <section key={section}>
              <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-muted">
                  {t(lang, `profile.section.${section}`)}
                </h2>
                <span className="font-mono text-[10px] sm:text-[11px] text-faint">
                  {filled}/{fields.length}
                </span>
              </div>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map((f) => {
                  const labelText = getProfileFieldLabel(f, lang);
                  return (
                    <div key={f.key} className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`pf-${f.key}`}
                        className="text-[13px] font-medium text-ink"
                      >
                        {labelText}
                      </label>
                      <input
                        id={`pf-${f.key}`}
                        type={f.type ?? "text"}
                        value={profile[f.key] ?? ""}
                        onChange={(e) =>
                          setProfileField(
                            f.key,
                            f.uppercase
                              ? e.target.value.toUpperCase()
                              : e.target.value
                          )
                        }
                        placeholder={f.placeholder}
                        autoComplete="off"
                        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-faint/70 focus:border-saffron focus:ring-2 focus:ring-saffron/20 focus-visible:outline-2 focus-visible:outline-saffron"
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
