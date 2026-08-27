"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe, CaretDown } from "@phosphor-icons/react";
import { LANGUAGES, getLanguageOption, t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { Lang } from "@/lib/types";

export function LanguageSelector() {
  const { lang, setLang, announce } = useApp();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = getLanguageOption(lang);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Handle keyboard navigation inside dropdown
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleSelect(code: Lang, nativeLabel: string) {
    setLang(code);
    setOpen(false);
    announce(`Language switched to ${nativeLabel}`);
  }

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t(lang, "nav.lang")}: ${current.nativeLabel}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-all hover:border-ink hover:text-ink active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-saffron"
      >
        <Globe size={15} weight="duotone" className="text-saffron-deep shrink-0" />
        <span className="font-semibold text-ink">{current.nativeLabel}</span>
        <CaretDown
          size={12}
          weight="bold"
          className={`text-faint transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t(lang, "nav.lang")}
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.14)] backdrop-blur-md focus:outline-none"
        >
          <div className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-faint border-b border-line mb-1">
            {t(lang, "nav.lang")}
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-0.5">
            {LANGUAGES.map((item) => {
              const active = item.code === lang;
              return (
                <button
                  key={item.code}
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(item.code, item.nativeLabel)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-saffron-soft text-saffron-deep font-semibold"
                      : "text-muted hover:bg-black/5 hover:text-ink"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-[13.5px] leading-snug">
                      {item.nativeLabel}
                    </span>
                    <span className="text-[11px] text-faint">
                      {item.label}
                    </span>
                  </div>
                  {active && (
                    <Check size={14} weight="bold" className="text-saffron-deep shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
