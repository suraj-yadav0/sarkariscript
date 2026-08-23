"use client";

import { useCallback, useEffect, useState } from "react";
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
  const { lang } = useApp();
  const [statuses, setStatuses] = useState<PortalStatus[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    apiGet<{ portals: PortalStatus[] }>("/api/portals/status")
      .then((data) => {
        if (alive) setStatuses(data.portals);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const retry = useCallback(() => {
    setError(false);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-saffron opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-saffron" />
          </span>
          {t(lang, "status.title")}
          <span className="font-mono text-[10px] font-normal uppercase tracking-[0.14em] text-faint">
            {t(lang, "status.live")}
          </span>
        </h2>
        <button
          onClick={retry}
          aria-label="Refresh status"
          className="rounded-md p-1 text-faint transition-colors hover:bg-black/4 hover:text-ink"
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
          {statuses.slice(0, compact ? 8 : statuses.length).map((p) => (
            <li key={p.portal_id} className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="group flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[p.status]}`} />
                <span className="min-w-0 flex-1 truncate text-sm group-hover:underline">
                  {lang === "hi" ? p.name_hi : p.name_en}
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
                className={`w-14 shrink-0 text-right font-mono text-[11px] font-medium sm:w-16 ${LABEL_CLS[p.status]}`}
              >
                {t(lang, LABEL_KEY[p.status])}
              </span>
            </li>
          ))}
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
