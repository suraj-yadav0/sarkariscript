"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowSquareOut, ArrowsClockwise } from "@phosphor-icons/react";
import { apiGet } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { PortalHealth, PortalStatus } from "@/lib/types";

const DOT: Record<PortalHealth, string> = {
  up: "bg-leaf",
  degraded: "bg-wait",
  down: "bg-alert animate-pulse",
};

const LABEL_KEY: Record<PortalHealth, string> = {
  up: "status.up",
  degraded: "status.degraded",
  down: "status.down",
};

const LABEL_CLS: Record<PortalHealth, string> = {
  up: "text-leaf",
  degraded: "text-wait",
  down: "text-alert",
};

export function StatusBoard({ compact = false }: { compact?: boolean }) {
  const { lang, announce } = useApp();
  const [statuses, setStatuses] = useState<PortalStatus[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const forceRef = useRef(false);

  useEffect(() => {
    let alive = true;
    const load = (force = false) => {
      const url = force
        ? "/api/portals/status?force=1"
        : "/api/portals/status";
      return apiGet<{ portals: PortalStatus[] }>(url)
        .then((data) => {
          if (alive) {
            setStatuses(data.portals);
            setError(false);
          }
        })
        .catch(() => {
          if (alive) setError(true);
        });
    };
    load(forceRef.current);
    forceRef.current = false;
    const interval = setInterval(() => load(false), 5 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [refreshKey]);

  const retry = useCallback(() => {
    forceRef.current = true;
    setError(false);
    setRefreshKey((k) => k + 1);
    announce("Portal statuses refreshed");
  }, [announce]);

  return (
    <section className="rounded-2xl border border-line bg-surface overflow-hidden shadow-2xs">
      <header className="flex items-center justify-between border-b border-line bg-paper/60 px-4 py-3">
        <h2 className="flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-tight text-ink">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf" />
          </span>
          <span>{t(lang, "status.title")}</span>
          <span className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[9px] sm:text-[9.5px] font-semibold uppercase tracking-[0.14em] text-faint">
            NIC & DIRECT GATEWAYS
          </span>
        </h2>
        <button
          onClick={retry}
          aria-label="Refresh status"
          className="rounded-md p-1 text-faint transition-colors hover:bg-black/4 hover:text-ink focus-visible:outline-2 focus-visible:outline-saffron"
        >
          <ArrowsClockwise size={15} />
        </button>
      </header>

      {error && (
        <div className="px-4 py-6 text-center">
          <p className="mb-3 text-sm text-muted">
            Backend not reachable. Start it with{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-xs">
              uvicorn main:app --port 8000
            </code>
          </p>
          <button
            onClick={retry}
            className="rounded-full border border-line px-4 py-1.5 text-xs font-medium hover:border-ink"
          >
            Retry
          </button>
        </div>
      )}

      {!error && statuses === null && (
        <ul className="divide-y divide-line/70" aria-hidden>
          {Array.from({ length: compact ? 8 : 14 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2">
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-line" />
              <span
                className="h-3 flex-1 animate-pulse rounded bg-line"
                style={{ maxWidth: `${45 + ((i * 13) % 40)}%` }}
              />
              <span className="h-3 w-10 shrink-0 animate-pulse rounded bg-line" />
              <span className="h-3 w-12 shrink-0 animate-pulse rounded bg-line" />
            </li>
          ))}
        </ul>
      )}

      {!error && statuses !== null && (
        <ul className="divide-y divide-line/70">
          {statuses.slice(0, compact ? 8 : statuses.length).map((p) => {
            const portalName = lang === "hi" ? p.name_hi : p.name_en;
            return (
              <li
                key={p.portal_id}
                className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4"
              >
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-w-0 flex-1 items-center gap-2 sm:gap-3 focus-visible:outline-2 focus-visible:outline-saffron"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${DOT[p.status]}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm group-hover:underline text-ink">
                    {portalName}
                  </span>
                  <ArrowSquareOut
                    size={12}
                    className="shrink-0 text-transparent transition-colors group-hover:text-faint"
                  />
                </a>
                <span className="hidden w-14 shrink-0 text-right font-mono text-[11px] text-faint sm:block">
                  {p.avg_latency_ms}ms
                </span>
                <span
                  className={`shrink-0 text-right font-mono text-[11px] font-medium ${
                    LABEL_CLS[p.status]
                  }`}
                >
                  {t(lang, LABEL_KEY[p.status])}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {!error && (
        <footer className="border-t border-line px-4 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            {t(lang, "status.simulated")}
          </p>
        </footer>
      )}
    </section>
  );
}
