"use client";

import { useEffect, useRef, useState } from "react";
import {
  TextAa,
  Sun,
  Moon,
  Eye,
  ArrowsClockwise,
  X,
  Keyboard,
  PersonSimpleWalk,
} from "@phosphor-icons/react";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { ContrastMode, FontSize } from "@/lib/types";

export function A11yToolbar() {
  const {
    lang,
    fontSize,
    contrast,
    dyslexiaFont,
    reduceMotion,
    setFontSize,
    setContrast,
    setDyslexiaFont,
    setReduceMotion,
    resetA11y,
    announce,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener: Alt + A (A11y), Alt + H / Esc
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
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

  const hasCustomSettings =
    fontSize !== "normal" ||
    contrast !== "default" ||
    dyslexiaFont ||
    reduceMotion;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t(lang, "a11y.button_label")}
        title={t(lang, "a11y.button_label")}
        className={`relative inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border transition-all active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-saffron ${
          open || hasCustomSettings
            ? "border-saffron bg-saffron-soft text-saffron-deep font-bold"
            : "border-line bg-surface text-muted hover:border-ink hover:text-ink"
        }`}
      >
        <Eye size={16} weight={hasCustomSettings ? "fill" : "bold"} className="sm:w-[18px] sm:h-[18px]" />
        {hasCustomSettings && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-saffron ring-2 ring-surface" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t(lang, "a11y.title")}
          className="absolute right-0 top-full z-50 mt-2 w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-line bg-surface p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-lg focus:outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Eye size={18} weight="duotone" className="text-saffron-deep" />
              <h2 className="text-sm font-semibold tracking-tight text-ink">
                {t(lang, "a11y.title")}
              </h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t(lang, "a11y.close")}
              className="rounded-full p-1 text-faint hover:bg-black/5 hover:text-ink transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 space-y-5">
            {/* Font Size Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                {t(lang, "a11y.font_size")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: "normal", label: "A", desc: "100%" },
                    { key: "large", label: "A+", desc: "115%" },
                    { key: "xlarge", label: "A++", desc: "130%" },
                  ] as { key: FontSize; label: string; desc: string }[]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setFontSize(opt.key);
                      announce(`Font size changed to ${opt.desc}`);
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl border py-2 px-1 text-center transition-all ${
                      fontSize === opt.key
                        ? "border-saffron bg-saffron-soft text-saffron-deep font-bold shadow-sm"
                        : "border-line bg-paper/60 text-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="font-mono text-[10px] text-faint">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contrast Mode Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                {t(lang, "a11y.contrast")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: "default", label: "Natural", icon: Sun },
                    { key: "high", label: "Light+", icon: TextAa },
                    { key: "dark", label: "Dark+", icon: Moon },
                  ] as { key: ContrastMode; label: string; icon: typeof Sun }[]
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = contrast === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setContrast(opt.key);
                        announce(`Contrast mode set to ${opt.label}`);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2 px-1 text-center transition-all ${
                        active
                          ? "border-saffron bg-saffron-soft text-saffron-deep font-bold shadow-sm"
                          : "border-line bg-paper/60 text-muted hover:border-ink hover:text-ink"
                      }`}
                    >
                      <Icon size={16} weight={active ? "fill" : "regular"} />
                      <span className="text-[11.5px] font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-1 border-t border-line">
              {/* Dyslexia / Legibility Mode */}
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg p-2 hover:bg-black/4 transition-colors">
                <div className="flex items-center gap-2">
                  <TextAa size={16} className="text-saffron-deep shrink-0" />
                  <span className="text-xs font-medium text-ink">
                    {t(lang, "a11y.dyslexia")}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={dyslexiaFont}
                  onChange={(e) => {
                    setDyslexiaFont(e.target.checked);
                    announce(
                      e.target.checked
                        ? "High legibility font enabled"
                        : "High legibility font disabled"
                    );
                  }}
                  className="h-4 w-4 rounded accent-saffron"
                />
              </label>

              {/* Reduce Motion */}
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg p-2 hover:bg-black/4 transition-colors">
                <div className="flex items-center gap-2">
                  <PersonSimpleWalk size={16} className="text-saffron-deep shrink-0" />
                  <span className="text-xs font-medium text-ink">
                    {t(lang, "a11y.reduce_motion")}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={(e) => {
                    setReduceMotion(e.target.checked);
                    announce(
                      e.target.checked
                        ? "Reduced animations enabled"
                        : "Reduced animations disabled"
                    );
                  }}
                  className="h-4 w-4 rounded accent-saffron"
                />
              </label>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted hover:bg-black/5 hover:text-ink transition-colors"
              >
                <Keyboard size={14} />
                <span>{t(lang, "a11y.shortcuts")}</span>
              </button>

              {hasCustomSettings && (
                <button
                  onClick={() => {
                    resetA11y();
                    announce("Accessibility preferences reset to default");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-faint hover:text-alert transition-colors"
                >
                  <ArrowsClockwise size={12} />
                  <span>{t(lang, "a11y.reset")}</span>
                </button>
              )}
            </div>

            {/* Shortcuts Guide Drawer */}
            {showShortcuts && (
              <div className="mt-2 rounded-xl bg-paper p-3 text-xs border border-line">
                <h3 className="font-semibold text-ink mb-2">
                  {t(lang, "a11y.shortcuts_title")}
                </h3>
                <dl className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Voice Search</span>
                    <kbd className="rounded bg-surface border border-line px-1.5 py-0.5 font-mono font-bold text-ink">
                      Alt + V
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Accessibility Panel</span>
                    <kbd className="rounded bg-surface border border-line px-1.5 py-0.5 font-mono font-bold text-ink">
                      Alt + A
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Close Popups</span>
                    <kbd className="rounded bg-surface border border-line px-1.5 py-0.5 font-mono font-bold text-ink">
                      Esc
                    </kbd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
