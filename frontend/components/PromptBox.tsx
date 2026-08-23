"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, PaperPlaneRight } from "@phosphor-icons/react";
import { apiPost } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { RoadmapResponse } from "@/lib/types";

const EXAMPLES = [
  "Mujhe Lucknow mein kirana dukaan kholni hai",
  "Gaadi kharidni hai nayi, RC aur FASTag bhi",
  "ITR bharna hai refund chahiye",
  "शिकायत दर्ज करानी है, 45 दिन से atki hai",
  "Passport banana hai videsh jana hai",
  "Driving licence banwana hai pehli baar",
];

export function PromptBox() {
  const router = useRouter();
  const { lang, setLastNav } = useApp();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exampleIdx, setExampleIdx] = useState(0);

  async function navigate(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const roadmap = await apiPost<RoadmapResponse>("/api/navigate", {
        query: text,
      });
      setLastNav(roadmap);
      router.push(`/roadmap/${roadmap.event.id}`);
    } catch {
      setError(
        lang === "hi"
          ? "बैकएंड से कनेक्ट नहीं हो सका। कृपया पुनः प्रयास करें।"
          : "Could not reach the backend. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate(query);
        }}
        className="rounded-xl border border-line bg-surface p-2 shadow-[0_1px_2px_rgba(27,27,24,0.05),0_8px_28px_-12px_rgba(27,27,24,0.14)] transition-shadow focus-within:shadow-[0_1px_2px_rgba(27,27,24,0.05),0_10px_36px_-10px_rgba(194,102,29,0.25)]"
      >
        <label htmlFor="prompt" className="sr-only">
          Describe what you want to do
        </label>
        <textarea
          id="prompt"
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              navigate(query);
            }
          }}
          placeholder={t(lang, "hero.placeholder")}
          className="w-full resize-none bg-transparent px-3 pt-2 text-[15px] leading-relaxed outline-none placeholder:text-faint"
        />
        <div className="flex items-center justify-between gap-3 px-1 pb-1">
          <span
            className={`font-mono text-[11px] uppercase tracking-[0.14em] transition-opacity ${
              loading ? "text-saffron opacity-100" : "text-transparent opacity-0"
            }`}
            aria-live="polite"
          >
            {loading ? t(lang, "hero.thinking") : "…"}
          </span>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-all hover:bg-saffron-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink"
          >
            {loading ? (
              <PaperPlaneRight size={16} className="animate-pulse" />
            ) : (
              <PaperPlaneRight size={16} weight="fill" />
            )}
            {t(lang, "hero.navigate")}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-2 rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          {t(lang, "hero.examples")}
        </span>
        {EXAMPLES.slice(exampleIdx, exampleIdx + 2).map((ex) => (
          <button
            key={ex}
            onClick={() => navigate(ex)}
            className="group inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-saffron hover:text-saffron-deep sm:max-w-[320px]"
          >
            <span className="min-w-0 truncate">{ex}</span>
            <ArrowRight size={11} weight="bold" className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
        <button
          onClick={() => setExampleIdx((i) => (i + 2) % EXAMPLES.length)}
          className="rounded-full px-2 py-1 font-mono text-[11px] text-faint underline decoration-dotted underline-offset-4 hover:text-ink"
        >
          more →
        </button>
      </div>
    </div>
  );
}
