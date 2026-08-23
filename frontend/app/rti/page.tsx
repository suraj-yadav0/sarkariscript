"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ArrowSquareOut, Check, CopySimple, Printer } from "@phosphor-icons/react";
import { apiPost } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
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
  const { lang, profile } = useApp();
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
        applicant_address: [profile.address_line, profile.city, profile.state, profile.pincode]
          .filter(Boolean)
          .join(", "),
        applicant_phone: profile.mobile ?? "",
        applicant_email: profile.email ?? "",
        ...form,
      });
      setDraft(result);
      requestAnimationFrame(() => {
        document.getElementById("rti-preview")?.scrollIntoView({ behavior: "smooth" });
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
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-24 pt-10 md:px-6">
      <header className="rise">
        <h1 className="max-w-[24ch] text-3xl font-semibold tracking-tight md:text-4xl">
          {t(lang, "rti.title")}
        </h1>
        <p className="mt-2 max-w-[62ch] leading-relaxed text-muted">{t(lang, "rti.sub")}</p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[380px_1fr]">
        <section className="print-hidden space-y-4 rounded-xl border border-line bg-surface p-5">
          <Field label={lang === "hi" ? "विभाग" : "Department"}>
            <select
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label={lang === "hi" ? "शिकायत पंजीकरण संख्या" : "Grievance registration no."}>
            <input
              value={form.grievance_number}
              onChange={(e) => set("grievance_number", e.target.value)}
              placeholder="PMOPG/E/2026/0123456"
              autoComplete="off"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-mono text-sm outline-none placeholder:text-faint/70 focus:border-saffron focus:ring-2 focus:ring-saffron/20"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "hi" ? "दर्ज तिथि" : "Filed on"}>
              <input
                type="date"
                value={form.filed_on}
                onChange={(e) => set("filed_on", e.target.value)}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
              />
            </Field>
            <Field label={lang === "hi" ? "लंबित दिन" : "Days pending"}>
              <input
                type="number"
                min={1}
                max={999}
                value={form.days_pending}
                onChange={(e) => set("days_pending", Number(e.target.value))}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
              />
            </Field>
          </div>
          <Field label={lang === "hi" ? "शिकायत का विषय" : "Subject of grievance"}>
            <textarea
              rows={3}
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder={
                lang === "hi"
                  ? "रद्द टिकट का रिफंड अब तक नहीं मिला…"
                  : "Refund of cancelled ticket not received…"
              }
              className="w-full resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-faint/70 focus:border-saffron focus:ring-2 focus:ring-saffron/20"
            />
          </Field>
          <p className="text-xs leading-relaxed text-faint">
            {lang === "hi"
              ? "आपका नाम, पता और संपर्क प्रोफ़ाइल से स्वतः भरा जाएगा।"
              : "Your name, address and contact come from your citizen profile."}
          </p>
          <button
            onClick={generate}
            disabled={loading || !form.grievance_number.trim() || !form.subject.trim()}
            className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition-colors hover:bg-saffron-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "…" : t(lang, "rti.generate")}
          </button>
          {error && <p className="rounded-lg bg-alert-soft px-3 py-2 text-xs text-alert">{error}</p>}
        </section>

        <section id="rti-preview">
          {!draft && (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-line p-8 text-center">
              <p className="max-w-[36ch] text-sm text-faint">
                {lang === "hi"
                  ? "फ़ॉर्म भरें — तैयार आवेदन पत्र यहीं दिखेगा।"
                  : "Fill the form — your ready-to-file application appears here."}
              </p>
            </div>
          )}
          {draft && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2 print-hidden">
                <button
                  onClick={copyLetter}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink hover:text-ink"
                >
                  {copied ? <Check size={13} weight="bold" /> : <CopySimple size={13} />}
                  {copied ? t(lang, "roadmap.copied") : t(lang, "rti.copy")}
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink hover:text-ink"
                >
                  <Printer size={13} /> {t(lang, "rti.print")}
                </button>
                <a
                  href={draft.filing_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-saffron-deep"
                >
                  {t(lang, "rti.openportal")} <ArrowSquareOut size={12} weight="bold" />
                </a>
              </div>
              <article className="rounded-xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(27,27,24,0.04),0_16px_40px_-20px_rgba(27,27,24,0.18)] md:p-9">
                <h2 className="sr-only">{t(lang, "rti.preview")}</h2>
                <pre className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-ink">
                  {draft.letter}
                </pre>
              </article>
              <aside className="print-hidden mt-5 rounded-xl border border-line bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {lang === "hi" ? "दाखिल करने से पहले" : "Before you file"}
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium">{label}</span>
      {children}
    </div>
  );
}
