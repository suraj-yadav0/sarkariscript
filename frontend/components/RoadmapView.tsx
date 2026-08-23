"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowSquareOut,
  CaretDown,
  CheckCircle,
  Check,
  Clock,
  Coins,
  CopySimple,
  FilePlus,
  Lightbulb,
  Lock,
  PlusCircle,
  SealCheck,
} from "@phosphor-icons/react";
import { apiGet, apiPost } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { isStepReady, topoSortSteps } from "@/lib/dag";
import type { LifeEventMeta, RoadmapResponse, Step } from "@/lib/types";

export function RoadmapView({ eventId }: { eventId: string }) {
  const { lang, hydrated, lastNav, stepDone, markStepDone, profile, docsUploaded, toggleDoc } =
    useApp();
  const [fetched, setFetched] = useState<RoadmapResponse | null>(null);
  const [error, setError] = useState(false);
  const [openSteps, setOpenSteps] = useState<Set<string>>(new Set());
  const [addedSteps, setAddedSteps] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const stored =
    hydrated && lastNav && lastNav.event.id === eventId ? lastNav : null;
  const roadmap = stored ?? fetched;

  useEffect(() => {
    if (!hydrated || stored) return;
    let alive = true;
    (async () => {
      try {
        const event = await apiGet<LifeEventMeta & Record<string, unknown>>(
          `/api/life-events/${eventId}`
        );
        if (!alive) return;
        const nav = await apiPost<RoadmapResponse>("/api/navigate", {
          query: event.name_en,
        });
        if (!alive) return;
        setFetched(nav);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, eventId, stored]);

  const doneMap = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const [key, val] of Object.entries(stepDone)) {
      if (key.startsWith(`${eventId}:`) && val) {
        out[key.slice(eventId.length + 1)] = true;
      }
    }
    return out;
  }, [stepDone, eventId]);

  const visibleSteps = useMemo(() => {
    if (!roadmap) return [];
    const base = roadmap.steps.filter(Boolean);
    const extras = roadmap.excluded_steps.filter((s) => addedSteps.has(s.id));
    return topoSortSteps([...base, ...extras]);
  }, [roadmap, addedSteps]);

  const remainingExcluded = useMemo(() => {
    if (!roadmap) return [];
    return roadmap.excluded_steps.filter((s) => !addedSteps.has(s.id));
  }, [roadmap, addedSteps]);

  const toggleOpen = useCallback((id: string) => {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const copyJson = useCallback(async (step: Step) => {
    const payload = Object.fromEntries(
      step.fields
        .filter((f) => f.profile_key)
        .map((f) => [f.label_en, profile[f.profile_key as string] ?? ""])
    );
    payload["form"] = step.form_name;
    payload["portal"] = step.portal_info?.name_en ?? step.portal;
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(step.id);
    setTimeout(() => setCopied(null), 1600);
  }, [profile]);

  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-24 text-center md:px-6">
        <p className="text-muted">{t(lang, "roadmap.notfound")}</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-saffron-deep"
        >
          <ArrowLeft size={15} /> {t(lang, "nav.home")}
        </Link>
      </div>
    );
  }

  if (!roadmap || !hydrated) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pt-10 md:px-6" aria-hidden>
        <div className="h-8 w-72 animate-pulse rounded-lg bg-line" />
        <div className="mt-3 h-4 w-96 animate-pulse rounded bg-line" />
        <ul className="mt-10 space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-28 animate-pulse rounded-xl border border-line bg-surface opacity-70" />
          ))}
        </ul>
      </div>
    );
  }

  const total = visibleSteps.length;
  const doneCount = visibleSteps.filter((s) => doneMap[s.id]).length;
  const intent = roadmap.intent;

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-24 pt-10 md:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-faint transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} /> {t(lang, "nav.home")}
      </Link>

      <header className="rise mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-leaf-soft px-2.5 py-1 font-mono text-[11px] font-medium text-leaf">
            {t(lang, "roadmap.confidence", { n: Math.round(intent.confidence * 100) })}
          </span>
          <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-faint">
            {intent.engine === "gemini" ? "gemini ai" : "on-device rules"}
          </span>
          {intent.city && (
            <span className="rounded-full bg-saffron-soft px-2.5 py-1 font-mono text-[11px] text-saffron-deep">
              {t(lang, "roadmap.city", { city: intent.city })}
            </span>
          )}
          <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-faint">
            {intent.detected_language}
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          {lang === "hi" ? roadmap.event.name_hi : roadmap.event.name_en}
        </h1>
        <p className="mt-2 max-w-[65ch] leading-relaxed text-muted">
          {lang === "hi" ? roadmap.event.summary_hi : roadmap.event.summary_en}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-leaf transition-all duration-500"
              style={{ width: total === 0 ? 0 : `${(doneCount / total) * 100}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted whitespace-nowrap">
            {doneCount}/{total} {t(lang, "roadmap.progress")}
          </span>
        </div>

        {roadmap.reusable_docs.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
            <SealCheck size={14} weight="fill" className="text-leaf" />
            <span>
              Upload once, reused across forms:{" "}
              <span className="font-mono text-muted">
                {roadmap.reusable_docs.map((r) => `${r.doc_id.replace(/_/g, " ")} ×${r.used_in_steps}`).join(" · ")}
              </span>
            </span>
          </div>
        )}
      </header>

      <ol className="mt-12 space-y-0">
        {visibleSteps.map((step, idx) => {
          const isDone = !!doneMap[step.id];
          const ready = isStepReady(step, doneMap);
          const isOpen = openSteps.has(step.id);
          const portalColor = step.portal_info?.line_color ?? "#888";

          return (
            <li key={step.id} className="relative grid grid-cols-[36px_1fr] gap-x-4 md:grid-cols-[48px_1fr]">
              <div className="flex flex-col items-center">
                <span
                  className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs transition-colors ${
                    isDone
                      ? "border-leaf bg-leaf text-white"
                      : ready
                        ? "border-saffron bg-paper text-saffron-deep"
                        : "border-line bg-paper text-faint"
                  }`}
                  style={ready && !isDone ? { boxShadow: "0 0 0 4px rgba(194,102,29,0.12)" } : undefined}
                >
                  {isDone ? <Check size={16} weight="bold" /> : String(idx + 1).padStart(2, "0")}
                </span>
                {idx < visibleSteps.length - 1 && (
                  <span
                    className="w-0.5 grow rounded-full"
                    style={{ backgroundColor: isDone ? "#2c7a57" : `${portalColor}55`, minHeight: "100%" }}
                  />
                )}
              </div>

              <article
                className={`mb-6 rounded-xl border bg-surface transition-all ${
                  ready || isDone ? "border-line" : "border-line/70 opacity-80"
                }`}
              >
                <div className="p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-md px-2 py-0.5 font-mono text-[11px] font-medium text-white"
                          style={{ backgroundColor: portalColor }}
                        >
                          {step.portal_info?.short ?? step.portal}
                        </span>
                        {!isDone && !ready && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wide text-faint">
                            <Lock size={11} /> {t(lang, "roadmap.locked")}
                          </span>
                        )}
                        {!isDone && ready && (
                          <span className="rounded-full bg-leaf-soft px-2 py-0.5 text-[11px] font-medium text-leaf">
                            {t(lang, "roadmap.ready")}
                          </span>
                        )}
                        {isDone && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-leaf px-2 py-0.5 text-[11px] font-medium text-white">
                            <CheckCircle size={11} weight="fill" /> {t(lang, "roadmap.done")}
                          </span>
                        )}
                        {step.depends_on.length > 0 && (
                          <span className="font-mono text-[11px] text-faint">
                            {t(lang, "roadmap.dependsOn")}:{" "}
                            {step.depends_on
                              .map((d) => findTitle(visibleSteps, d, lang))
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-2 text-[17px] font-semibold leading-snug tracking-tight">
                        {lang === "hi" ? step.title_hi : step.title_en}
                      </h2>
                      <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted">
                        {lang === "hi" ? step.why_hi : step.why_en}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-faint">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {t(lang, "roadmap.esttime", { n: step.est_time_min })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Coins size={12} />
                          {lang === "hi" ? step.fee_note_hi : step.fee_note_en}
                        </span>
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          if (!isDone && !ready) e.preventDefault();
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98] ${
                          ready && !isDone
                            ? "bg-ink text-paper hover:bg-saffron-deep"
                            : "pointer-events-none cursor-not-allowed bg-black/6 text-faint"
                        }`}
                        title={ready && !isDone ? undefined : t(lang, "roadmap.locked")}
                      >
                        {t(lang, "roadmap.openform")}
                        <ArrowSquareOut size={13} weight="bold" />
                      </a>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            markStepDone(eventId, step.id, !isDone)
                          }
                          disabled={!ready && !isDone}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors ${
                            isDone
                              ? "text-leaf underline decoration-dotted underline-offset-4 hover:text-alert"
                              : ready
                                ? "font-medium text-leaf hover:bg-leaf-soft"
                                : "cursor-not-allowed text-faint"
                          }`}
                        >
                          {isDone ? t(lang, "roadmap.undone") : t(lang, "roadmap.markdone")}
                        </button>
                        {(step.fields.length > 0 || step.docs_resolved.length > 0) && (
                          <button
                            onClick={() => toggleOpen(step.id)}
                            aria-expanded={isOpen}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted hover:bg-black/4 hover:text-ink"
                          >
                            {t(lang, "roadmap.details")}
                            <CaretDown
                              size={12}
                              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-5 grid gap-6 border-t border-dashed border-line pt-5 lg:grid-cols-2">
                      {step.fields.length > 0 && (
                        <section>
                          <h3 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
                            {t(lang, "roadmap.fields")}
                            <button
                              onClick={() => copyJson(step)}
                              className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 font-mono text-[10px] normal-case tracking-normal text-muted transition-colors hover:border-ink hover:text-ink"
                            >
                              {copied === step.id ? (
                                <>
                                  <Check size={11} weight="bold" /> {t(lang, "roadmap.copied")}
                                </>
                              ) : (
                                <>
                                  <CopySimple size={11} /> {t(lang, "roadmap.copyjson")}
                                </>
                              )}
                            </button>
                          </h3>
                          <dl className="mt-3 divide-y divide-line/70 rounded-lg border border-line">
                            {step.fields.map((f, fi) => {
                              const val = f.profile_key ? (profile[f.profile_key] ?? "") : "";
                              return (
                                <div key={fi} className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2">
                                  <dt className="min-w-0">
                                    <span className="block truncate text-sm">{lang === "hi" ? f.label_hi : f.label_en}</span>
                                    {f.label_en !== (lang === "hi" ? f.label_hi : f.label_en) && (
                                      <span className="block truncate font-mono text-[10px] text-faint">{f.label_en}</span>
                                    )}
                                  </dt>
                                  <dd className="justify-self-end">
                                    {!f.profile_key ? (
                                      <span className="rounded bg-black/5 px-2 py-1 font-mono text-[11px] text-faint">
                                        {t(lang, "roadmap.youfill")}
                                      </span>
                                    ) : val ? (
                                      <span className="inline-flex max-w-[220px] items-center gap-1 rounded bg-leaf-soft px-2 py-1 font-mono text-[11px] text-leaf">
                                        <Check size={10} weight="bold" />
                                        <span className="truncate">{val}</span>
                                      </span>
                                    ) : (
                                      <Link
                                        href="/profile"
                                        className="inline-flex items-center gap-1 rounded bg-wait-soft px-2 py-1 font-mono text-[11px] text-wait hover:underline"
                                      >
                                        <FilePlus size={10} />
                                        {t(lang, "roadmap.missing")}
                                      </Link>
                                    )}
                                  </dd>
                                </div>
                              );
                            })}
                          </dl>
                          {step.tips && step.tips.length > 0 && (
                            <div className="mt-4 rounded-lg border border-saffron/25 bg-saffron-soft/60 p-3">
                              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-saffron-deep">
                                <Lightbulb size={13} weight="fill" /> {t(lang, "roadmap.tips")}
                              </h4>
                              <ol className="mt-1.5 list-inside list-decimal space-y-1 text-xs leading-relaxed text-muted">
                                {step.tips.map((tip, ti) => (
                                  <li key={ti}>{tip}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </section>
                      )}

                      {step.docs_resolved.length > 0 && (
                        <section>
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                            {t(lang, "roadmap.docs")}
                          </h3>
                          <ul className="mt-3 space-y-1.5">
                            {step.docs_resolved.map((doc) => {
                              const uploaded = docsUploaded.includes(doc.id);
                              return (
                                <li key={doc.id}>
                                  <label
                                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                                      uploaded ? "border-leaf/40 bg-leaf-soft/60" : "border-line bg-surface hover:border-ink/25"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={uploaded}
                                      onChange={() => toggleDoc(doc.id)}
                                      className="h-4 w-4 rounded"
                                    />
                                    <span className={`min-w-0 flex-1 truncate text-sm ${uploaded ? "text-muted line-through decoration-leaf/50" : ""}`}>
                                      {lang === "hi" ? doc.name_hi : doc.name_en}
                                    </span>
                                    <span
                                      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                                        doc.mandatory ? "bg-alert-soft text-alert" : "bg-black/5 text-faint"
                                      }`}
                                    >
                                      {doc.mandatory ? t(lang, "roadmap.mandatory") : t(lang, "roadmap.optionalDoc")}
                                    </span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                          <p className="mt-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-faint">
                            <SealCheck size={11} weight="fill" className="text-leaf" />
                            {t(lang, "roadmap.uploaded")}
                          </p>
                        </section>
                      )}
                    </div>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      {remainingExcluded.length > 0 && (
        <section className="mt-2 rounded-xl border border-dashed border-line bg-surface/60 p-4">
          <h2 className="text-sm font-semibold tracking-tight text-muted">
            {t(lang, "roadmap.optional")}
          </h2>
          <ul className="mt-3 space-y-2">
            {remainingExcluded.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="block truncate text-sm text-muted">
                    {lang === "hi" ? s.title_hi : s.title_en}
                  </span>
                  <span className="block font-mono text-[10px] uppercase tracking-wide text-faint">
                    {s.condition_label_en}
                  </span>
                </div>
                <button
                  onClick={() => setAddedSteps((prev) => new Set(prev).add(s.id))}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-leaf hover:text-leaf active:scale-[0.98]"
                >
                  <PlusCircle size={13} /> {t(lang, "roadmap.addstep")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function findTitle(steps: Step[], id: string, lang: "en" | "hi"): string | null {
  const s = steps.find((st) => st.id === id);
  if (!s) return id.replace(/_/g, " ");
  return lang === "hi" ? s.title_hi : s.title_en;
}
