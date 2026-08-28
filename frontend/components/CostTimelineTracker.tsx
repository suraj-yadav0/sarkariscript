"use client";

import { useState } from "react";
import {
  Coins,
  HourglassHigh,
  ShieldCheck,
  Receipt,
  CheckCircle,
  X,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { calculateFinancials, type FinancialSummary } from "@/lib/financial-calculator";
import type { Lang, Step } from "@/lib/types";

interface CostTimelineTrackerProps {
  eventId: string;
  eventName: string;
  steps: Step[];
  lang: Lang;
}

export function CostTimelineTracker({
  eventId,
  eventName,
  steps,
  lang,
}: CostTimelineTrackerProps) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const fin: FinancialSummary = calculateFinancials(eventId, steps, lang);

  const turnaroundLabel =
    lang === "hi"
      ? fin.estimatedTurnaroundDays.label_hi
      : fin.estimatedTurnaroundDays.label_en;

  return (
    <div className="space-y-3">
      {/* 3-Card Financial & Turnaround Dashboard Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Official Govt Fees */}
        <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-xs hover:border-saffron/30 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron-soft text-saffron-deep">
                <Coins size={18} weight="duotone" />
              </span>
              <span className="rounded-full bg-saffron-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-saffron-deep">
                OFFICIAL FEES
              </span>
            </div>
            <p className="mt-3 font-mono text-xl sm:text-2xl font-bold tracking-tight text-ink tabular-nums">
              {fin.feeRangeLabel}
            </p>
            <p className="mt-1 text-xs text-muted leading-tight">
              {fin.paidStepsCount > 0
                ? `${fin.paidStepsCount} paid step${fin.paidStepsCount > 1 ? "s" : ""}, ${fin.freeStepsCount} free`
                : "100% free statutory citizen service"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsBreakdownOpen(true)}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-saffron-deep hover:underline w-fit"
          >
            <Receipt size={13} />
            View itemized fee list
          </button>
        </div>

        {/* Metric 2: Estimated SLA Turnaround */}
        <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-xs hover:border-saffron/30 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron-soft text-saffron-deep">
                <HourglassHigh size={18} weight="duotone" />
              </span>
              <span className="rounded-full bg-paper border border-line px-2 py-0.5 font-mono text-[10px] font-semibold text-muted">
                STATUTORY SLA
              </span>
            </div>
            <p className="mt-3 font-mono text-base sm:text-lg font-bold tracking-tight text-ink line-clamp-1">
              {turnaroundLabel.split("(")[0]}
            </p>
            <p className="mt-1 text-xs text-muted leading-tight">
              ~{fin.totalEstMinutes} mins total portal submission time
            </p>
          </div>
          <p className="mt-3 text-[11px] font-mono text-faint">
            Official Citizen Charter timeline
          </p>
        </div>

        {/* Metric 3: Anti-Broker Savings */}
        <div className="flex flex-col justify-between rounded-2xl border border-leaf/30 bg-leaf-soft/30 p-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf-soft text-leaf">
                <ShieldCheck size={18} weight="fill" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft border border-leaf/30 px-2 py-0.5 font-mono text-[10px] font-semibold text-leaf">
                <Sparkle size={10} weight="fill" /> ZERO TOUTS
              </span>
            </div>
            <p className="mt-3 font-mono text-xl sm:text-2xl font-bold tracking-tight text-leaf tabular-nums">
              ~₹{fin.brokerSavingsEstimate.toLocaleString("en-IN")} Saved
            </p>
            <p className="mt-1 text-xs text-muted leading-tight">
              By submitting directly on verified government portals
            </p>
          </div>
          <p className="mt-3 text-[11px] font-medium text-leaf flex items-center gap-1">
            <CheckCircle size={13} weight="fill" /> Direct BharatKosh / UPI Gateways
          </p>
        </div>
      </div>

      {/* Itemized Fee & SLA Breakdown Modal */}
      {isBreakdownOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3.5 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="breakdown-title"
        >
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line bg-paper px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-soft text-saffron-deep">
                  <Receipt size={20} weight="duotone" />
                </div>
                <div>
                  <h3 id="breakdown-title" className="text-sm sm:text-base font-semibold text-ink">
                    Official Fee & Turnaround Breakdown
                  </h3>
                  <p className="text-xs text-muted font-mono">{eventName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBreakdownOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink transition-colors"
                aria-label="Close Fee Breakdown Dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
              {/* Statutory Authority Source Banner */}
              <div className="flex items-start gap-2.5 rounded-xl border border-leaf/30 bg-leaf-soft/40 p-3 text-xs text-leaf">
                <ShieldCheck size={18} weight="fill" className="shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold">Official Statutory Authority: </span>
                  {fin.statutorySource}. All charges are fixed under official Government of India rules.
                </div>
              </div>

              {/* Anti-Scam Advisory Alert */}
              <div className="flex items-start gap-2.5 rounded-xl border border-saffron/30 bg-saffron-soft/40 p-3 text-xs text-saffron-deep">
                <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold">Zero Broker Guarantee: </span>
                  All statutory fees listed below are paid <strong>directly</strong> on official <code>.gov.in</code> / <code>.nic.in</code> portals via BharatKosh, UPI, or designated SBI gateways. SarkariScript never asks for or processes payments.
                </div>
              </div>

              {/* Table of Steps */}
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-paper border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-3.5 py-2.5">Step / Service</th>
                      <th className="px-3.5 py-2.5">Portal</th>
                      <th className="px-3.5 py-2.5">Govt Fee</th>
                      <th className="px-3.5 py-2.5">Statutory SLA</th>
                      <th className="px-3.5 py-2.5">Payment Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {fin.stepBreakdowns.map((s, idx) => (
                      <tr key={s.stepId} className="hover:bg-paper/40 transition-colors">
                        <td className="px-3.5 py-2.5 font-medium text-ink">
                          <span className="font-mono text-faint text-[10px] mr-1.5">
                            0{idx + 1}.
                          </span>
                          {s.stepTitle}
                        </td>
                        <td className="px-3.5 py-2.5 text-muted font-mono text-[11px]">
                          {s.portalName}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono font-semibold">
                          {s.isFree ? (
                            <span className="text-leaf bg-leaf-soft px-1.5 py-0.5 rounded text-[10px]">
                              ₹0 FREE
                            </span>
                          ) : (
                            <span className="text-saffron-deep">
                              {s.feeLabel}
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-muted font-mono text-[11px]">
                          {s.turnaroundDays}
                        </td>
                        <td className="px-3.5 py-2.5 text-faint text-[11px]">
                          {s.paymentMode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Summary Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper p-3.5 text-xs">
                <div>
                  <p className="font-semibold text-ink">Official Govt Fee Requirement:</p>
                  <p className="text-muted text-[11px]">
                    Expected Total Timeline: {turnaroundLabel}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-saffron-deep">
                    {fin.feeRangeLabel}
                  </span>
                  <p className="font-mono text-[10px] text-leaf font-semibold">
                    ~₹{fin.brokerSavingsEstimate.toLocaleString("en-IN")} saved vs unauthorized touts
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-line bg-paper px-5 py-3">
              <span className="text-[11px] font-mono text-faint">
                Citations: Official Gazette of India & Portal Charters
              </span>
              <button
                type="button"
                onClick={() => setIsBreakdownOpen(false)}
                className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
