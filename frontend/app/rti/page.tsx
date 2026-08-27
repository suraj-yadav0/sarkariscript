"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowSquareOut,
  Check,
  CopySimple,
  Microphone,
  Printer,
  SpeakerHigh,
  SpeakerSimpleSlash,
} from "@phosphor-icons/react";
import { apiPost } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { useSpeechSynthesis } from "@/lib/useSpeechSynthesis";
import type { RtiDraftResponse } from "@/lib/types";

const DEPARTMENTS = [
  "Ministry of Railways",
  "Ministry of Health and Family Welfare",
  "Ministry of Education",
  "Ministry of Finance",
  "Department of Posts",
  "Ministry of Road Transport and Highways",
  "Ministry of Consumer Affairs",
  "State Public Authority",
];

export default function RtiPage() {
  const { lang, profile, announce } = useApp();
  const [form, setForm] = useState({
    department: DEPARTMENTS[0],
    grievance_number: "",
    filed_on: "",
    subject: "",
    days_pending: 30,
    info_sought: "",
  });
  const [draft, setDraft] = useState<RtiDraftResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isListening: isDictating,
    error: dictationError,
    startListening: startDictation,
    stopListening: stopDictation,
  } = useSpeechRecognition({
    onFinalTranscript: (text) => {
      setForm((prev) => ({
        ...prev,
        subject: prev.subject ? `${prev.subject} ${text}` : text,
      }));
    },
  });

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    speakingId,
    isSupported: speechSupported,
  } = useSpeechSynthesis();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function generate() {
    if (!form.grievance_number.trim() || !form.subject.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost<RtiDraftResponse>("/api/rti/draft", {
        applicant_name: profile.full_name ?? "",
        applicant_address: [
          profile.address_line,
          profile.city,
          profile.state,
          profile.pincode,
        ]
          .filter(Boolean)
          .join(", "),
        applicant_phone: profile.mobile ?? "",
        applicant_email: profile.email ?? "",
        ...form,
      });
      setDraft(result);
      announce("RTI Draft generated successfully");
      requestAnimationFrame(() => {
        document
          .getElementById("rti-preview")
          ?.scrollIntoView({ behavior: "smooth" });
      });
    } catch {
      setError(
        lang === "hi"
          ? "ड्राफ़्ट बनाने में समस्या। बैकएंड जाँचें।"
          : "Could not generate the draft. Check the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyLetter() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft.letter);
    setCopied(true);
    announce(t(lang, "roadmap.copied"));
    setTimeout(() => setCopied(false), 1600);
  }

  function toggleReadDraft() {
    if (!draft) return;
    if (isSpeaking && speakingId === "rti-draft") {
      stopSpeaking();
    } else {
      speak(draft.letter, "rti-draft");
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-24 pt-10 md:px-6">
      <header className="rise">
        <h1 className="max-w-[24ch] text-3xl font-semibold tracking-tight md:text-4xl text-ink">
          {t(lang, "rti.title")}
        </h1>
        <p className="mt-2 max-w-[62ch] leading-relaxed text-muted">
          {t(lang, "rti.sub")}
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[380px_1fr]">
        <section className="print-hidden space-y-4 rounded-2xl border border-line bg-surface p-5">
          <Field label={t(lang, "rti.department")}>
            <select
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 focus-visible:outline-2 focus-visible:outline-saffron"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>

          <Field label={t(lang, "rti.grievance_no")}>
            <input
              value={form.grievance_number}
              onChange={(e) => set("grievance_number", e.target.value)}
              placeholder="PMOPG/E/2026/0123456"
              autoComplete="off"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-mono text-sm outline-none placeholder:text-faint/70 focus:border-saffron focus:ring-2 focus:ring-saffron/20 focus-visible:outline-2 focus-visible:outline-saffron"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t(lang, "rti.filed_on")}>
              <input
                type="date"
                value={form.filed_on}
                onChange={(e) => set("filed_on", e.target.value)}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 focus-visible:outline-2 focus-visible:outline-saffron"
              />
            </Field>
            <Field label={t(lang, "rti.days_pending")}>
              <input
                type="number"
                min={1}
                max={999}
                value={form.days_pending}
                onChange={(e) => set("days_pending", Number(e.target.value))}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 focus-visible:outline-2 focus-visible:outline-saffron"
              />
            </Field>
          </div>

          <Field
            label={t(lang, "rti.subject")}
            extraAction={
              <button
                type="button"
                onClick={() => {
                  if (isDictating) {
                    stopDictation();
                  } else {
                    startDictation();
                  }
                }}
                title={t(lang, "rti.dictate")}
                aria-label={t(lang, "rti.dictate")}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  isDictating
                    ? "bg-saffron text-white animate-pulse"
                    : "text-muted hover:text-ink hover:bg-black/5"
                }`}
              >
                <Microphone size={13} weight={isDictating ? "fill" : "bold"} />
                <span>{isDictating ? "Listening..." : "Dictate"}</span>
              </button>
            }
          >
            <textarea
              rows={3}
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="e.g. Refund of cancelled train ticket not received after 45 days…"
              className="w-full resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-faint/70 focus:border-saffron focus:ring-2 focus:ring-saffron/20 focus-visible:outline-2 focus-visible:outline-saffron"
            />
            {dictationError && (
              <p className="mt-1 text-xs text-alert">
                {dictationError === "permission_denied"
                  ? t(lang, "voice.permission_denied")
                  : dictationError === "network"
                  ? t(lang, "voice.network")
                  : `Dictation error: ${dictationError}`}
              </p>
            )}
          </Field>

          <p className="text-xs leading-relaxed text-faint">
            {t(lang, "rti.profile_notice")}
          </p>

          <button
            onClick={generate}
            disabled={
              loading ||
              !form.grievance_number.trim() ||
              !form.subject.trim()
            }
            className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition-colors hover:bg-saffron-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-saffron"
          >
            {loading ? "…" : t(lang, "rti.generate")}
          </button>

          {error && (
            <p className="rounded-lg bg-alert-soft px-3 py-2 text-xs text-alert">
              {error}
            </p>
          )}
        </section>

        <section id="rti-preview">
          {!draft && (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-line p-8 text-center bg-surface/40">
              <p className="max-w-[36ch] text-sm text-faint">
                {t(lang, "rti.empty_hint")}
              </p>
            </div>
          )}

          {draft && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2 print-hidden">
                <button
                  onClick={copyLetter}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-saffron"
                >
                  {copied ? (
                    <Check size={13} weight="bold" />
                  ) : (
                    <CopySimple size={13} />
                  )}
                  {copied ? t(lang, "roadmap.copied") : t(lang, "rti.copy")}
                </button>

                {speechSupported && (
                  <button
                    onClick={toggleReadDraft}
                    aria-label="Read RTI Draft Aloud"
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-saffron ${
                      isSpeaking && speakingId === "rti-draft"
                        ? "bg-saffron text-white shadow-sm animate-pulse"
                        : "border border-line bg-surface text-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    {isSpeaking && speakingId === "rti-draft" ? (
                      <>
                        <SpeakerSimpleSlash size={13} />
                        <span>{t(lang, "audio.stop")}</span>
                      </>
                    ) : (
                      <>
                        <SpeakerHigh size={13} />
                        <span>{t(lang, "audio.listen_all")}</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-saffron"
                >
                  <Printer size={13} /> {t(lang, "rti.print")}
                </button>

                <a
                  href={draft.filing_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-saffron-deep focus-visible:outline-2 focus-visible:outline-saffron"
                >
                  {t(lang, "rti.openportal")}{" "}
                  <ArrowSquareOut size={12} weight="bold" />
                </a>
              </div>

              <article className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(27,27,24,0.04),0_16px_40px_-20px_rgba(27,27,24,0.18)] md:p-9">
                <h2 className="sr-only">{t(lang, "rti.preview")}</h2>
                <pre className="whitespace-pre-wrap [overflow-wrap:anywhere] font-mono text-[12.5px] leading-relaxed text-ink">
                  {draft.letter}
                </pre>
              </article>

              <aside className="print-hidden mt-5 rounded-2xl border border-line bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t(lang, "rti.before_file")}
                </h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-muted">
                  {draft.guidance.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </aside>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  extraAction,
}: {
  label: string;
  children: ReactNode;
  extraAction?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        {extraAction}
      </div>
      {children}
    </div>
  );
}
