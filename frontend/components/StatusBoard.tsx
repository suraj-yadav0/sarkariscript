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

const DEFAULT_PORTALS: Pick<PortalStatus, "portal_id" | "name_en" | "name_hi" | "short" | "url">[] = [
  { portal_id: "MCA", name_en: "Ministry of Corporate Affairs", name_hi: "कॉर्पोरेट कार्य मंत्रालय", short: "MCA", url: "https://www.mca.gov.in/content/mca/global/en/home.html" },
  { portal_id: "GST", name_en: "GST Portal", name_hi: "जीएसटी पोर्टल", short: "GST", url: "https://www.gst.gov.in/" },
  { portal_id: "EPFO", name_en: "EPFO", name_hi: "ईपीएफओ", short: "EPFO", url: "https://unifiedportal-emp.epfindia.gov.in/epfo/" },
  { portal_id: "FSSAI", name_en: "FSSAI", name_hi: "एफएसएसएआई", short: "FSSAI", url: "https://foscos.fssai.gov.in/" },
  { portal_id: "MSME", name_en: "Udyam (MSME)", name_hi: "उद्यम (एमएसएमई)", short: "Udyam", url: "https://udyamregistration.gov.in/" },
  { portal_id: "SHRAM", name_en: "Shram Suvidha", name_hi: "श्रम सुविधा", short: "Shram", url: "https://shramsuvidha.gov.in/home" },
  { portal_id: "VAHAN", name_en: "Parivahan (VAHAN)", name_hi: "परिवहन (वाहन)", short: "Vahan", url: "https://vahan.parivahan.gov.in/vahanservice/" },
  { portal_id: "SARATHI", name_en: "Parivahan (Sarathi)", name_hi: "परिवहन (सारथी)", short: "Sarathi", url: "https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do" },
  { portal_id: "IT", name_en: "Income Tax e-Filing", name_hi: "आयकर ई-फाइलिंग", short: "IT", url: "https://eportal.incometax.gov.in/iec/foservices/#/login" },
  { portal_id: "CPGRAMS", name_en: "CPGRAMS", name_hi: "सीपीग्राम", short: "CPGRAMS", url: "https://pgportal.gov.in/Signin" },
  { portal_id: "RTI", name_en: "RTI Online", name_hi: "आरटीआई ऑनलाइन", short: "RTI", url: "https://rtionline.gov.in/index.php" },
  { portal_id: "PASSPORT", name_en: "Passport Seva", name_hi: "पासपोर्ट सेवा", short: "Passport", url: "https://www.passportindia.gov.in/psp/" },
  { portal_id: "NETC", name_en: "NETC FASTag", name_hi: "एनईटीसी फास्टैग", short: "FASTag", url: "https://ihmcl.co.in/fastag-user/" },
  { portal_id: "IRDAI", name_en: "Insurance (IRDAI)", name_hi: "बीमा (इरडा)", short: "Insurance", url: "https://bimabharosa.irdai.gov.in/" },
  { portal_id: "UIDAI", name_en: "Unique Identification Authority of India (UIDAI)", name_hi: "भारतीय विशिष्ट पहचान प्राधिकरण (यूआईडीएआई)", short: "UIDAI", url: "https://myaadhaar.uidai.gov.in/" },
  { portal_id: "NSDL", name_en: "Protean TIN-PAN (NSDL)", name_hi: "प्रोटीन टिन-पैन (एनएसडीएल)", short: "NSDL", url: "https://www.protean-tinpan.com/" },
  { portal_id: "NFSA", name_en: "National Food Security Portal (NFSA)", name_hi: "राष्ट्रीय खाद्य सुरक्षा पोर्टल (एनएफएसए)", short: "NFSA", url: "https://nfsa.gov.in/" },
  { portal_id: "ECI", name_en: "Election Commission of India (Voters Portal)", name_hi: "भारत निर्वाचन आयोग (मतदाता सेवा पोर्टल)", short: "Voters (ECI)", url: "https://voters.eci.gov.in/" },
  { portal_id: "PMJAY", name_en: "National Health Authority (Ayushman PM-JAY)", name_hi: "राष्ट्रीय स्वास्थ्य प्राधिकरण (आयुष्मान भारत)", short: "PM-JAY", url: "https://beneficiary.nha.gov.in/" },
  { portal_id: "CRS", name_en: "Civil Registration System (ORGI)", name_hi: "सिविल रजिस्ट्रेशन सिस्टम (जन्म एवं मृत्यु)", short: "CRS", url: "https://crsorgi.gov.in/" },
];

function defaultStatuses(): PortalStatus[] {
  return DEFAULT_PORTALS.map((p) => ({
    ...p,
    status: "up" as PortalHealth,
    avg_latency_ms: 0,
    checked_at: "",
  }));
}

export function StatusBoard({ compact = false }: { compact?: boolean }) {
  const { lang, announce } = useApp();
  const [statuses, setStatuses] = useState<PortalStatus[]>(defaultStatuses);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const forceRef = useRef(false);
  const hasDataRef = useRef(false);

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
            setLoaded(true);
            hasDataRef.current = true;
            setError(false);
          }
        })
        .catch(() => {
          if (alive && !hasDataRef.current) setError(true);
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

      {!error && (
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
                <span
                  className={`hidden w-14 shrink-0 text-right font-mono text-[11px] sm:block ${
                    loaded ? "text-faint" : "text-line"
                  }`}
                >
                  {loaded ? `${p.avg_latency_ms}ms` : "—"}
                </span>
                <span
                  className={`shrink-0 text-right font-mono text-[11px] font-medium ${
                    loaded
                      ? LABEL_CLS[p.status]
                      : "text-line"
                  }`}
                >
                  {loaded ? t(lang, LABEL_KEY[p.status]) : t(lang, "status.checking")}
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
