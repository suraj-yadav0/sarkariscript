"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkle,
  UserCircle,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  X,
  Trash,
  Buildings,
  GraduationCap,
  UsersThree,
  Briefcase,
} from "@phosphor-icons/react";
import { DIGILOCKER_PERSONAS, type DigiLockerPersona } from "@/lib/digilocker";
import { useApp } from "@/lib/store";

const PERSONA_ICONS: Record<string, React.ReactNode> = {
  ramesh: <Buildings size={20} weight="duotone" className="text-saffron-deep" />,
  priya: <GraduationCap size={20} weight="duotone" className="text-saffron-deep" />,
  sunita: <UsersThree size={20} weight="duotone" className="text-saffron-deep" />,
  vikram: <Briefcase size={20} weight="duotone" className="text-saffron-deep" />,
};

const PERSONA_TARGET_JOURNEYS: Record<
  string,
  { id: string; name: string }[]
> = {
  ramesh: [
    { id: "start_business", name: "Start a Business" },
    { id: "pan_card", name: "PAN / e-PAN" },
  ],
  priya: [
    { id: "passport", name: "Fresh Passport" },
    { id: "voter_id", name: "Voter ID (Form 6)" },
    { id: "driving_licence", name: "Driving Licence" },
  ],
  sunita: [
    { id: "ayushman_card", name: "Ayushman Card" },
    { id: "ration_card", name: "Ration Card (NFSA)" },
    { id: "birth_certificate", name: "Birth Certificate" },
  ],
  vikram: [
    { id: "itr_filing", name: "ITR e-Filing" },
    { id: "buy_vehicle", name: "Vehicle RC" },
  ],
};

export function DemoPersonaSwitcher() {
  const { digilockerPersona, linkDigiLocker, unlinkDigiLocker, announce } = useApp();
  const [open, setOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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

  function handleSelectPersona(persona: DigiLockerPersona) {
    linkDigiLocker(persona.id);
    setOpen(false);
    announce(`Switched demo profile to ${persona.name}`);
    setActiveToast(
      `✓ Switched to ${persona.name.split(" ")[0]} (${persona.role_en.split("·")[0].trim()})`
    );
    setTimeout(() => setActiveToast(null), 4000);
  }

  function handleReset() {
    unlinkDigiLocker();
    setOpen(false);
    announce("Reset sandbox profile to blank state");
    setActiveToast("✓ Reset sandbox profile to blank state");
    setTimeout(() => setActiveToast(null), 3000);
  }

  function handleJump(journeyId: string) {
    setOpen(false);
    router.push(`/roadmap/${journeyId}`);
  }

  const currentPersona = DIGILOCKER_PERSONAS.find((p) => p.id === digilockerPersona);

  return (
    <>
      {/* Trigger Button in Header Toolbar */}
      <div className="relative shrink-0" ref={modalRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Instant Demo Personas Switcher"
          title="Switch Citizen Demo Personas (Hackathon Pitch Feature)"
          className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-saffron shrink-0 ${
            currentPersona
              ? "border-leaf/30 bg-leaf-soft text-leaf hover:border-leaf"
              : "border-saffron/30 bg-saffron-soft text-saffron-deep hover:border-saffron"
          }`}
        >
          <Sparkle size={14} weight="fill" className="animate-pulse shrink-0" />
          <span className="text-[11px] sm:text-xs">
            {currentPersona ? (
              <>
                <span className="hidden sm:inline">Persona: </span>
                {currentPersona.name.split(" ")[0]}
              </>
            ) : (
              <>
                <span className="sm:hidden">Demo</span>
                <span className="hidden sm:inline">Demo Personas</span>
              </>
            )}
          </span>
        </button>

        {/* Dropdown Modal */}
        {open && (
          <div
            className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-10 z-50 w-[calc(100vw-16px)] sm:w-[480px] max-w-[500px] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-label="Instant Demo Personas Selection"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-3 sm:px-5 sm:py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-saffron-soft text-saffron-deep">
                  <Sparkle size={16} weight="fill" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-ink">
                    Instant Demo Personas
                  </h3>
                  <p className="text-[10.5px] text-muted">
                    1-Click citizen pre-fills & DigiLocker sync for pitch demos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-black/5 hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Persona List */}
            <div className="p-3 sm:p-4 max-h-[70vh] overflow-y-auto space-y-2.5">
              {DIGILOCKER_PERSONAS.map((p) => {
                const isCurrent = digilockerPersona === p.id;
                const targets = PERSONA_TARGET_JOURNEYS[p.id] || [];

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3 transition-all ${
                      isCurrent
                        ? "border-leaf bg-leaf-soft/20 shadow-xs ring-1 ring-leaf"
                        : "border-line bg-surface hover:border-saffron/40 hover:bg-paper/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper border border-line">
                          {PERSONA_ICONS[p.id] || <UserCircle size={20} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-bold text-ink truncate">
                              {p.name}
                            </h4>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-leaf text-white px-1.5 py-0.2 font-mono text-[9px] font-semibold">
                                <CheckCircle size={10} weight="fill" /> ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted truncate">
                            {p.role_en}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-faint">
                            <span className="rounded bg-paper border border-line px-1.5 py-0.5">
                              {p.documents.length} DigiLocker Docs
                            </span>
                            <span className="rounded bg-paper border border-line px-1.5 py-0.5">
                              {p.profile.city}, {p.profile.state}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectPersona(p)}
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                          isCurrent
                            ? "bg-leaf-soft text-leaf border border-leaf/30"
                            : "bg-ink text-paper hover:bg-saffron-deep"
                        }`}
                      >
                        {isCurrent ? "Loaded ✓" : "Load Persona"}
                      </button>
                    </div>

                    {/* Quick Roadmaps Link */}
                    {targets.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between gap-1 text-[10.5px]">
                        <span className="font-mono text-faint">Recommended test:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {targets.map((tgt) => (
                            <button
                              key={tgt.id}
                              type="button"
                              onClick={() => handleJump(tgt.id)}
                              className="inline-flex items-center gap-0.5 text-saffron-deep hover:underline font-semibold"
                            >
                              {tgt.name}
                              <ArrowRight size={10} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-line bg-paper px-4 py-2.5 sm:px-5">
              <button
                type="button"
                onClick={handleReset}
                disabled={!digilockerPersona}
                className="inline-flex items-center gap-1 text-xs font-medium text-alert hover:underline disabled:opacity-40 disabled:hover:no-underline"
              >
                <Trash size={13} />
                Clear to Blank State
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-surface border border-line px-3 py-1 text-xs font-semibold text-ink hover:bg-paper"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Success Toast */}
      {activeToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-paper shadow-2xl animate-in slide-in-from-bottom-3 duration-200 border border-white/10"
        >
          <ShieldCheck size={16} weight="fill" className="text-leaf shrink-0" />
          <span>{activeToast}</span>
        </div>
      )}
    </>
  );
}
