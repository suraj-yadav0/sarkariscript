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
  Printer,
  SealCheck,
  ShieldCheck,
  SpeakerHigh,
  SpeakerSimpleSlash,
  Stamp,
  Waveform,
} from "@phosphor-icons/react";
import { apiGet, apiPost } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { DigiLockerModal } from "@/components/DigiLockerModal";
import { isStepReady, topoSortSteps } from "@/lib/dag";
import { useSpeechSynthesis } from "@/lib/useSpeechSynthesis";
import type { Lang, LifeEventMeta, RoadmapResponse, Step } from "@/lib/types";

export function RoadmapView({ eventId }: { eventId: string }) {
  const {
    lang,
    hydrated,
    lastNav,
    stepDone,
    markStepDone,
    addedSteps: storeAddedSteps,
    addStepToJourney,
    profile,
    docsUploaded,
    toggleDoc,
    announce,
    digilockerLinked,
  } = useApp();

  const [fetched, setFetched] = useState<RoadmapResponse | null>(null);
  const [error, setError] = useState(false);
  const [openSteps, setOpenSteps] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDigiLockerOpen, setIsDigiLockerOpen] = useState(false);

  // Text-to-speech hook
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    speakingId,
    isSupported: speechSupported,
  } = useSpeechSynthesis();

  useEffect(() => {
    if (lastNav && lastNav.intent.event_id === eventId) {
      return;
    }
    let ignore = false;
    apiGet<LifeEventMeta[]>(`/api/life-events`)
      .then(async (events) => {
        if (ignore) return;
        const ev = events.find((e) => e.id === eventId);
        if (!ev) {
          setError(true);
          return;
        }
        const r = await apiPost<RoadmapResponse>(`/api/navigate`, {
          query: ev.name_en,
        });
        if (!ignore) setFetched(r);
      })
      .catch(() => {
        if (!ignore) setError(true);
      });
    return () => {
      ignore = true;
    };
  }, [eventId, lastNav]);

  const roadmap =
    lastNav && lastNav.intent.event_id === eventId ? lastNav : fetched;

  const doneMap: Record<string, boolean> = useMemo(
    () => (hydrated ? stepDone[eventId] ?? {} : {}),
    [hydrated, stepDone, eventId]
  );

  const visibleSteps = useMemo(() => {
    if (!roadmap) return [];
    const base = roadmap.steps.slice();
    const currentAdded = storeAddedSteps[eventId] || [];
    if (roadmap.excluded_steps) {
      for (const s of roadmap.excluded_steps) {
        if (currentAdded.includes(s.id) && !base.some((b) => b.id === s.id)) {
          base.push(s);
        }
      }
    }
    return topoSortSteps(base);
  }, [roadmap, storeAddedSteps, eventId]);

  const toggleOpen = useCallback((id: string) => {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const copyStepJson = useCallback(
    (step: Step) => {
      const payload: Record<string, string> = {};
      step.fields?.forEach((f) => {
        if (f.profile_key) {
          payload[f.profile_key] = profile[f.profile_key] ?? "";
        }
      });
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedId(step.id);
      announce(t(lang, "roadmap.copied"));
      setTimeout(() => setCopiedId(null), 2000);
    },
    [profile, announce, lang]
  );

  // Read entire overview aloud
  const readOverview = useCallback(() => {
    if (!roadmap) return;
    if (isSpeaking && speakingId === "overview") {
      stopSpeaking();
      return;
    }
    const name = getStepText(roadmap.event, "name", lang);
    const summary = getStepText(roadmap.event, "summary", lang);
    const text = `${name}. ${summary}. Total ${visibleSteps.length} steps in this roadmap.`;
    speak(text, "overview");
  }, [roadmap, lang, visibleSteps.length, isSpeaking, speakingId, speak, stopSpeaking]);

  // Read step instructions aloud
  const readStep = useCallback(
    (step: Step, idx: number) => {
      if (isSpeaking && speakingId === step.id) {
        stopSpeaking();
        return;
      }
      const title = getStepText(step, "title", lang);
      const why = getStepText(step, "why", lang);
      const fee = lang === "hi" ? step.fee_note_hi : step.fee_note_en;
      const docs = step.docs_resolved
        ?.map((d) => getStepText(d, "name", lang))
        .join(", ");
      const text = `Step ${idx + 1}: ${title}. ${why}. Estimated time: ${
        step.est_time_min
      } minutes. Official fee: ${fee}. Required documents: ${docs || "None"}.`;
      speak(text, step.id);
    },
    [lang, isSpeaking, speakingId, speak, stopSpeaking]
  );

  // Master unique docs across journey for printing
  const masterDocs = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name_en: string; name_hi: string; mandatory: boolean }
    >();
    visibleSteps.forEach((s) => {
      s.docs_resolved?.forEach((d) => {
        if (!map.has(d.id)) {
          map.set(d.id, {
            id: d.id,
            name_en: d.name_en,
            name_hi: d.name_hi,
            mandatory: d.mandatory,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [visibleSteps]);

  // Total estimated time calculation
  const totalEstMinutes = useMemo(() => {
    return visibleSteps.reduce((acc, s) => acc + (s.est_time_min || 15), 0);
  }, [visibleSteps]);

  if (error) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-ink">
          {t(lang, "roadmap.notfound")}
        </h1>
        <p className="mt-2 text-sm text-faint">
          {t(lang, "roadmap.notfound_sub")}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-saffron-deep transition-colors"
        >
          <ArrowLeft size={14} /> {t(lang, "nav.home")}
        </Link>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-16">
        <div className="h-6 w-48 animate-pulse rounded bg-line" />
        <div className="mt-3 h-4 w-96 animate-pulse rounded bg-line" />
        <ul className="mt-10 space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="h-28 animate-pulse rounded-xl border border-line bg-surface opacity-70"
            />
          ))}
        </ul>
      </div>
    );
  }

  const total = visibleSteps.length;
  const doneCount = visibleSteps.filter((s) => doneMap[s.id]).length;
  const intent = roadmap.intent;
  const eventName = getStepText(roadmap.event, "name", lang);
  const eventSummary = getStepText(roadmap.event, "summary", lang);
  const printDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-[1000px] px-3 sm:px-4 pb-24 pt-4 sm:pt-6 md:pt-10 md:px-6 overflow-x-hidden">
      {/* Screen Navigation Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-2 print-hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs sm:text-sm text-faint transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-saffron"
        >
          <ArrowLeft size={13} /> {t(lang, "nav.home")}
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Printable PDF Generator Button */}
          <button
            onClick={() => window.print()}
            aria-label={t(lang, "roadmap.print_pdf")}
            title={t(lang, "roadmap.print_pdf")}
            className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-line bg-surface px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs font-medium text-muted transition-all hover:border-ink hover:text-ink active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-saffron shadow-sm"
          >
            <Printer size={14} weight="duotone" className="text-saffron-deep shrink-0" />
            <span className="font-semibold text-ink text-[11px] sm:text-xs">
              {t(lang, "roadmap.print_pdf")}
            </span>
          </button>

          {/* Audio Reader for Roadmap Overview */}
          {speechSupported && (
            <button
              onClick={readOverview}
              aria-label={
                isSpeaking && speakingId === "overview"
                  ? t(lang, "audio.stop")
                  : t(lang, "audio.listen_all")
              }
              className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-saffron ${
                isSpeaking && speakingId === "overview"
                  ? "bg-saffron text-white shadow-sm animate-pulse"
                  : "border border-line bg-surface text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {isSpeaking && speakingId === "overview" ? (
                <>
                  <Waveform size={14} weight="bold" className="animate-spin" />
                  <span>{t(lang, "audio.stop")}</span>
                </>
              ) : (
                <>
                  <SpeakerHigh
                    size={14}
                    weight="duotone"
                    className="text-saffron-deep shrink-0"
                  />
                  <span className="hidden xs:inline text-[11px] sm:text-xs">
                    {t(lang, "audio.listen_all")}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED OFFICIAL PRINT HEADER (Only visible when printed or saved as PDF) */}
      {/* ========================================================================= */}
      <div className="print-only mb-6 border-b-2 border-black pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
              <Stamp size={24} weight="bold" />
            </span>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight text-black">
                SarkariScript · Citizen Copilot
              </h1>
              <p className="text-xs uppercase tracking-wider text-gray-700">
                {t(lang, "print.citizen_guide")}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-800">
            <p className="font-semibold">
              {t(lang, "print.generated_on")}: {printDate}
            </p>
            <p>
              {t(lang, "print.generated_for")}:{" "}
              <span className="font-semibold">
                {profile.full_name || "Citizen Applicant"}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-black bg-gray-50 p-3">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-black">{eventName}</h2>
              <p className="mt-0.5 text-xs text-gray-700">{eventSummary}</p>
            </div>
            <div className="text-right text-xs space-y-0.5 shrink-0 pl-4">
              <p>
                <span className="font-semibold">Total Steps:</span> {total}
              </p>
              <p>
                <span className="font-semibold">Est. Time:</span> ~
                {totalEstMinutes} mins
              </p>
              {intent.city && (
                <p>
                  <span className="font-semibold">Location:</span> {intent.city}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Master Document Preparation Checklist (Print View) */}
        {masterDocs.length > 0 && (
          <div className="mt-4 rounded-lg border border-black p-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-black mb-2">
              {t(lang, "print.checklist")}
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-800">
              {masterDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 border border-black rounded-sm shrink-0" />
                  <span className="font-medium">
                    {lang === "hi" ? doc.name_hi : doc.name_en}
                    {doc.mandatory && (
                      <span className="text-[10px] font-semibold text-black ml-1">
                        *
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Screen Header */}
      <header className="rise mt-5 print-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-leaf-soft px-2.5 py-1 font-mono text-[11px] font-medium text-leaf">
            {t(lang, "roadmap.confidence", {
              n: Math.round(intent.confidence * 100),
            })}
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

        <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight md:text-4xl text-ink">
          {eventName}
        </h1>
        <p className="mt-2 max-w-[70ch] text-sm sm:text-base leading-relaxed text-muted">
          {eventSummary}
        </p>

        {/* Progress & Reusable Documents bar */}
        <div className="mt-5 sm:mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3.5 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-leaf-soft text-leaf font-mono text-xs font-semibold">
              {doneCount}/{total}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-semibold text-ink leading-snug">
                {doneCount} {t(lang, "events.of")} {total}{" "}
                {t(lang, "events.steps")} {t(lang, "roadmap.progress")}
              </p>
              <p className="font-mono text-[11px] sm:text-xs text-faint">
                {total - doneCount} {t(lang, "roadmap.remaining")} · ~
                {visibleSteps
                  .filter((s) => !doneMap[s.id])
                  .reduce((acc, s) => acc + s.est_time_min, 0)}{" "}
                {t(lang, "roadmap.min_est")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDigiLockerOpen(true)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-[#0b3b60]/30 bg-[#0b3b60]/10 px-3 py-1.5 text-xs font-semibold text-[#0b3b60] dark:text-[#38bdf8] hover:bg-[#0b3b60]/20 transition-all shrink-0 print-hidden"
            >
              <ShieldCheck size={16} weight="fill" className="text-[#0b3b60] dark:text-[#38bdf8]" />
              {digilockerLinked ? "✓ DigiLocker Synced" : "Fetch from DigiLocker"}
            </button>
          </div>

          {roadmap.reusable_docs && roadmap.reusable_docs.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-saffron-soft/70 p-2.5 sm:p-3 text-xs text-saffron-deep break-words">
              <SealCheck size={16} weight="fill" className="shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-semibold">{t(lang, "roadmap.reused_title")}: </span>
                <span className="text-[11px] sm:text-xs opacity-90">
                  {roadmap.reusable_docs
                    .map((d) => `${d.doc_id.replace(/_/g, " ")} ×${d.used_in_steps}`)
                    .join(" · ")}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Steps List */}
      <ol
        className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 md:space-y-6"
        aria-label="Roadmap steps"
      >
        {visibleSteps.map((step, idx) => {
          const ready = isStepReady(step, doneMap);
          const isDone = Boolean(doneMap[step.id]);
          const isOpen = openSteps.size === 0 ? idx === 0 : openSteps.has(step.id);
          const title = getStepText(step, "title", lang);
          const why = getStepText(step, "why", lang);
          const portalColor = step.portal_info?.line_color ?? "#3b82f6";
          const isCurrentSpeaking = isSpeaking && speakingId === step.id;

          return (
            <li
              key={step.id}
              className="relative transition-all print-break-avoid"
            >
              {/* Step Card Container */}
              <article
                className={`mb-3 sm:mb-4 md:mb-6 rounded-2xl border bg-surface transition-all print:border-black print:bg-white print:shadow-none ${
                  ready || isDone ? "border-line" : "border-line/70 opacity-90"
                } ${isCurrentSpeaking ? "ring-2 ring-saffron" : ""}`}
              >
                <div className="p-3.5 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Badge Row */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-mono text-xs font-bold text-black border border-black rounded px-1.5 py-0.5 print-only">
                          STEP {idx + 1}
                        </span>
                        <span
                          className="rounded-md px-2 py-0.5 font-mono text-[10.5px] sm:text-[11px] font-medium text-white print:text-black print:border print:border-black print:bg-white"
                          style={{ backgroundColor: portalColor }}
                        >
                          {step.portal_info?.short ?? step.portal}
                        </span>
                        {!isDone && !ready && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10.5px] sm:text-[11px] uppercase tracking-wide text-faint print-hidden">
                            <Lock size={11} /> {t(lang, "roadmap.locked")}
                          </span>
                        )}
                        {!isDone && ready && (
                          <span className="rounded-full bg-leaf-soft px-2 py-0.5 text-[10.5px] sm:text-[11px] font-medium text-leaf print-hidden">
                            {t(lang, "roadmap.ready")}
                          </span>
                        )}
                        {isDone && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-leaf px-2 py-0.5 text-[10.5px] sm:text-[11px] font-medium text-white print-hidden">
                            <CheckCircle size={11} weight="fill" />{" "}
                            {t(lang, "roadmap.done")}
                          </span>
                        )}

                        {/* Read Aloud Button for Individual Step (Hidden in Print) */}
                        {speechSupported && (
                          <button
                            type="button"
                            onClick={() => readStep(step, idx)}
                            aria-label={
                              isCurrentSpeaking
                                ? t(lang, "audio.stop")
                                : t(lang, "audio.listen_step")
                            }
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] sm:text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-saffron print-hidden ${
                              isCurrentSpeaking
                                ? "bg-saffron text-white font-semibold animate-pulse"
                                : "text-faint hover:text-ink hover:bg-black/5"
                            }`}
                          >
                            {isCurrentSpeaking ? (
                              <>
                                <SpeakerSimpleSlash size={12} />
                                <span>{t(lang, "audio.stop")}</span>
                              </>
                            ) : (
                              <>
                                <SpeakerHigh size={12} />
                                <span>Listen</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Dependencies */}
                      {step.depends_on.length > 0 && (
                        <p className="mt-1 font-mono text-[10.5px] sm:text-[11px] text-faint print:text-black">
                          <span className="font-semibold">
                            {t(lang, "roadmap.dependsOn")}:
                          </span>{" "}
                          {step.depends_on
                            .map((d) => findTitle(visibleSteps, d, lang))
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}

                      <h2 className="mt-2 text-[15.5px] sm:text-[17px] font-semibold leading-snug tracking-tight text-ink break-words">
                        {idx + 1}. {title}
                      </h2>
                      <p className="mt-1 max-w-[62ch] text-xs sm:text-sm leading-relaxed text-muted print:text-black">
                        {why}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 font-mono text-[10.5px] sm:text-[11px] text-faint print:text-black">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {t(lang, "roadmap.esttime", {
                            n: step.est_time_min,
                          })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Coins size={12} />
                          {lang === "hi"
                            ? step.fee_note_hi
                            : step.fee_note_en}
                        </span>
                        <span className="print-only text-black">
                          Official URL: {step.url}
                        </span>
                      </p>
                    </div>

                    {/* Action Controls (Hidden in Print) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 sm:border-0 sm:pt-0 sm:flex-col sm:items-end sm:justify-start sm:shrink-0 print-hidden">
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          if (!isDone && !ready) e.preventDefault();
                        }}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors active:scale-[0.98] sm:flex-none focus-visible:outline-2 focus-visible:outline-saffron ${
                          ready && !isDone
                            ? "bg-ink text-paper hover:bg-saffron-deep"
                            : "pointer-events-none cursor-not-allowed bg-black/6 text-faint"
                        }`}
                        title={
                          ready && !isDone
                            ? undefined
                            : t(lang, "roadmap.locked")
                        }
                      >
                        {t(lang, "roadmap.openform")}
                        <ArrowSquareOut size={13} weight="bold" />
                      </a>
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                        <button
                          onClick={() => {
                            markStepDone(eventId, step.id, !isDone);
                            announce(
                              !isDone
                                ? t(lang, "a11y.announcement_step_done")
                                : t(lang, "a11y.announcement_step_undone")
                            );
                          }}
                          disabled={!ready && !isDone}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-saffron ${
                            isDone
                              ? "bg-leaf-soft text-leaf hover:bg-leaf hover:text-white"
                              : ready
                              ? "border border-line text-muted hover:border-leaf hover:text-leaf"
                              : "cursor-not-allowed text-faint"
                          }`}
                        >
                          <Check size={12} weight="bold" />
                          {isDone
                            ? t(lang, "roadmap.undone")
                            : t(lang, "roadmap.markdone")}
                        </button>

                        <button
                          onClick={() => toggleOpen(step.id)}
                          aria-expanded={isOpen}
                          aria-label={t(lang, "roadmap.details")}
                          className="rounded-full p-1 sm:p-1.5 text-muted hover:bg-black/5 hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-saffron"
                        >
                          <CaretDown
                            size={16}
                            weight="bold"
                            className={`transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Details (Expanded on screen, ALWAYS printed in PDF) */}
                <div
                  className={`${
                    isOpen ? "block" : "hidden print:block"
                  } border-t border-line/60 bg-paper/60 px-3.5 py-3 sm:px-5 sm:py-4 print:bg-white print:px-5 print:py-3`}
                >
                  <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
                    {/* Required Documents Section */}
                    <div>
                      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted print:text-black">
                        {t(lang, "roadmap.docs")}
                      </h3>
                      {step.docs_resolved && step.docs_resolved.length > 0 ? (
                        <ul className="mt-2.5 space-y-2 text-xs">
                          {step.docs_resolved.map((doc) => {
                            const isUploaded = docsUploaded.includes(doc.id);
                            return (
                              <li
                                key={doc.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 print:border-gray-300 print:bg-white"
                              >
                                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isUploaded}
                                    onChange={() => toggleDoc(doc.id)}
                                    className="h-3.5 w-3.5 rounded accent-leaf shrink-0 print:border print:border-black"
                                  />
                                  <span
                                    className={`truncate ${
                                      isUploaded
                                        ? "line-through text-faint"
                                        : "font-medium text-ink print:text-black"
                                    }`}
                                  >
                                    {lang === "hi" ? doc.name_hi : doc.name_en}
                                  </span>
                                </label>
                                {isUploaded && digilockerLinked && (
                                  <span className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold text-[#0b3b60] dark:text-[#38bdf8] bg-[#0b3b60]/10 px-1.5 py-0.5 rounded shrink-0">
                                    <ShieldCheck size={11} weight="fill" />
                                    DIGILOCKER
                                  </span>
                                )}
                                <span className="font-mono text-[10px] text-faint shrink-0 print:text-black">
                                  {doc.mandatory
                                    ? t(lang, "roadmap.mandatory")
                                    : t(lang, "roadmap.optionalDoc")}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-faint">
                          {t(lang, "roadmap.nodocs")}
                        </p>
                      )}
                    </div>

                    {/* Form Fields & Pre-filling */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted print:text-black">
                          {t(lang, "roadmap.fields")}
                        </h3>
                        <button
                          type="button"
                          onClick={() => copyStepJson(step)}
                          aria-label={t(lang, "roadmap.copyjson")}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-saffron-deep hover:underline print-hidden"
                        >
                          <CopySimple size={12} />
                          {copiedId === step.id
                            ? t(lang, "roadmap.copied")
                            : t(lang, "roadmap.copyjson")}
                        </button>
                      </div>

                      {step.fields && step.fields.length > 0 ? (
                        <dl className="mt-2.5 divide-y divide-line/60 rounded-lg border border-line bg-surface text-xs print:border-gray-300 print:bg-white">
                          {step.fields.map((f, fi) => {
                            const val = f.profile_key
                              ? profile[f.profile_key] ?? ""
                              : "";
                            const hasProfileVal = Boolean(val);
                            return (
                              <div
                                key={fi}
                                className="flex items-center justify-between gap-3 px-3 py-2"
                              >
                                <dt className="text-muted truncate font-normal print:text-black">
                                  {lang === "hi" ? f.label_hi : f.label_en}
                                  {f.required && (
                                    <span className="text-saffron-deep ml-0.5">
                                      *
                                    </span>
                                  )}
                                </dt>
                                <dd className="shrink-0 text-right">
                                  {hasProfileVal ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-leaf-soft px-1.5 py-0.5 font-mono text-[11px] text-leaf max-w-[140px] truncate print:border print:border-black print:text-black">
                                      <Check size={11} weight="bold" />
                                      <span className="truncate">{val}</span>
                                    </span>
                                  ) : (
                                    <Link
                                      href="/profile"
                                      className="inline-flex items-center gap-1 rounded bg-wait-soft px-2 py-0.5 font-mono text-[11px] text-wait hover:underline focus-visible:outline-2 focus-visible:outline-saffron print:border print:border-gray-400 print:text-black"
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
                      ) : (
                        <p className="mt-2 text-xs text-faint">
                          {t(lang, "roadmap.nofields")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ground Tips */}
                  {step.tips && step.tips.length > 0 && (
                    <div className="mt-4 rounded-xl border border-saffron/25 bg-saffron-soft/60 p-3 print:border-black print:bg-gray-50">
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-saffron-deep print:text-black">
                        <Lightbulb size={13} weight="fill" />{" "}
                        {t(lang, "roadmap.tips")}
                      </h4>
                      <ol className="mt-1.5 list-inside list-decimal space-y-1 text-xs leading-relaxed text-muted print:text-black">
                        {step.tips.map((tip, ti) => (
                          <li key={ti}>{tip}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      {/* ========================================================================= */}
      {/* DEDICATED OFFICIAL PRINT FILING LOG (Printed on the last page of the PDF)  */}
      {/* ========================================================================= */}
      <div className="print-only mt-8 pt-4 border-t-2 border-black print-break-avoid">
        <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
          {t(lang, "print.filing_log")}
        </h3>
        <table className="w-full border-collapse border border-black text-xs text-left">
          <thead>
            <tr className="bg-gray-100 border-b border-black font-semibold text-black">
              <th className="border-r border-black p-2 w-12">Step #</th>
              <th className="border-r border-black p-2">Government Form / Portal</th>
              <th className="border-r border-black p-2 w-36">Ack / Ref Number</th>
              <th className="border-r border-black p-2 w-28">Submission Date</th>
              <th className="p-2 w-28">Status / Sign</th>
            </tr>
          </thead>
          <tbody>
            {visibleSteps.map((s, idx) => (
              <tr key={s.id} className="border-b border-black">
                <td className="border-r border-black p-2 font-mono text-center">
                  {idx + 1}
                </td>
                <td className="border-r border-black p-2">
                  <span className="font-semibold">{s.portal_info?.short}</span> —{" "}
                  {lang === "hi" ? s.title_hi : s.title_en}
                </td>
                <td className="border-r border-black p-2 text-gray-400 font-mono">
                  ________________
                </td>
                <td className="border-r border-black p-2 text-gray-400 font-mono">
                  DD / MM / YYYY
                </td>
                <td className="p-2 text-gray-400 font-mono">[ ] Done</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-between items-center text-[10px] text-gray-600 border-t border-gray-300 pt-2">
          <span>
            Generated via SarkariScript Citizen Copilot (Open Source) · Always
            verify details on official portals (.gov.in)
          </span>
          <span>Page 1 of Roadmap Manual</span>
        </div>
      </div>

      {/* Optional Skipped Steps Section (Screen View) */}
      {roadmap.excluded_steps && roadmap.excluded_steps.length > 0 && (
        <section
          className="mt-12 rounded-2xl border border-line bg-surface p-5 print-hidden"
          aria-labelledby="optional-steps-title"
        >
          <h3
            id="optional-steps-title"
            className="text-sm font-semibold text-ink"
          >
            {t(lang, "roadmap.optional")}
          </h3>
          <p className="mt-1 text-xs text-faint">
            {t(lang, "roadmap.optional_sub")}
          </p>

          <ul className="mt-4 divide-y divide-line/60">
            {roadmap.excluded_steps.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 py-3 text-xs"
              >
                <div>
                  <p className="font-medium text-ink">
                    {lang === "hi" ? s.title_hi : s.title_en}
                  </p>
                  <p className="text-faint font-mono text-[11px]">
                    {s.condition_label_en ?? "Conditional step"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    addStepToJourney(eventId, s.id);
                    announce("Added step to journey");
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-leaf hover:text-leaf active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-saffron"
                >
                  <PlusCircle size={13} /> {t(lang, "roadmap.addstep")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {/* DigiLocker Modal */}
      <DigiLockerModal
        isOpen={isDigiLockerOpen}
        onClose={() => setIsDigiLockerOpen(false)}
      />
    </div>
  );
}

function getStepText(
  obj: unknown,
  propPrefix: string,
  lang: Lang
): string {
  if (!obj || typeof obj !== "object") return "";
  const record = obj as Record<string, unknown>;
  if (lang === "hi" && record[`${propPrefix}_hi`]) {
    return String(record[`${propPrefix}_hi`]);
  }
  return String(record[`${propPrefix}_en`] || record[`${propPrefix}_hi`] || "");
}

function findTitle(steps: Step[], id: string, lang: Lang): string | null {
  const s = steps.find((st) => st.id === id);
  if (!s) return id.replace(/_/g, " ");
  return lang === "hi" ? s.title_hi : s.title_en;
}
