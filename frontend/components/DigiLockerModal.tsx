"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle,
  FileText,
  LockKey,
  ShieldCheck,
  Spinner,
  X,
} from "@phosphor-icons/react";
import { DIGILOCKER_PERSONAS, type DigiLockerPersona } from "@/lib/digilocker";
import { useApp } from "@/lib/store";

interface DigiLockerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DigiLockerModal({ isOpen, onClose }: DigiLockerModalProps) {
  const { linkDigiLocker, announce } = useApp();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    DIGILOCKER_PERSONAS[0].id
  );
  const [pin, setPin] = useState<string>("123456");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationStage, setVerificationStage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPersona =
    DIGILOCKER_PERSONAS.find((p) => p.id === selectedPersonaId) ||
    DIGILOCKER_PERSONAS[0];

  const handlePersonaChange = (persona: DigiLockerPersona) => {
    setSelectedPersonaId(persona.id);
    setPin(persona.pin);
  };

  const handleAuthorize = async () => {
    setIsVerifying(true);
    setIsSuccess(false);

    setVerificationStage("Connecting to DigiLocker National Gateway…");
    await new Promise((r) => setTimeout(r, 450));

    setVerificationStage("Verifying UIDAI cryptographic signatures…");
    await new Promise((r) => setTimeout(r, 450));

    setVerificationStage("Fetching PAN & educational issued records…");
    await new Promise((r) => setTimeout(r, 450));

    // Link state into SarkariScript store
    linkDigiLocker(selectedPersonaId);
    announce(
      `DigiLocker account linked for ${currentPersona.name}. ${currentPersona.documents.length} verified documents synced.`
    );

    setIsVerifying(false);
    setIsSuccess(true);

    setTimeout(() => {
      onClose();
      setIsSuccess(false);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3.5 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="digilocker-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* DigiLocker Official Brand Header */}
        <div className="bg-[#0b3b60] px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white font-bold tracking-tight">
                <ShieldCheck size={24} weight="fill" className="text-[#38bdf8]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-wide text-sm sm:text-base">
                    DigiLocker
                  </span>
                  <span className="rounded bg-[#38bdf8]/20 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#38bdf8] uppercase">
                    MeriPehchaan
                  </span>
                </div>
                <p className="text-[10px] text-white/70">
                  National e-Governance Division · Govt. of India
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close DigiLocker Dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {isSuccess ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-leaf-soft text-leaf">
                <Check size={32} weight="bold" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-ink">
                DigiLocker Linked Successfully!
              </h3>
              <p className="mt-1 text-xs text-muted">
                {currentPersona.documents.length} verified documents & citizen profile
                imported into SarkariScript.
              </p>
            </div>
          ) : isVerifying ? (
            <div className="py-10 text-center">
              <Spinner
                size={36}
                className="mx-auto animate-spin text-[#0b3b60] dark:text-[#38bdf8]"
              />
              <h3 className="mt-4 text-sm font-semibold text-ink">
                DigiLocker Authentication in Progress
              </h3>
              <p className="mt-1.5 text-xs text-muted font-mono animate-pulse">
                {verificationStage}
              </p>
            </div>
          ) : (
            <>
              <div>
                <h2
                  id="digilocker-title"
                  className="text-base font-semibold tracking-tight text-ink"
                >
                  Consent to Share Issued Documents
                </h2>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  SarkariScript is requesting read access to your DigiLocker
                  issued document repository to pre-fill paperwork and verify
                  checklists.
                </p>
              </div>

              {/* Citizen Persona Switcher (For Demo Pitching) */}
              <div className="mt-4">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Select Citizen Profile (Demo Sandbox)
                </label>
                <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {DIGILOCKER_PERSONAS.map((p) => {
                    const active = p.id === selectedPersonaId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePersonaChange(p)}
                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                          active
                            ? "border-[#0b3b60] bg-saffron-soft/20 text-ink ring-1 ring-[#0b3b60]"
                            : "border-line bg-surface hover:border-ink/20 text-muted"
                        }`}
                      >
                        <span className="text-xs font-semibold text-ink">
                          {p.name.split(" ")[0]}
                        </span>
                        <span className="mt-0.5 text-[10px] text-faint line-clamp-1">
                          {p.role_en.split("·")[1]?.trim() || p.role_en}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Documents to be Synced */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Issued Documents Found ({currentPersona.documents.length})
                  </span>
                  <span className="font-mono text-[10px] text-leaf flex items-center gap-1 font-medium">
                    <CheckCircle size={12} weight="fill" /> Authentic Govt Records
                  </span>
                </div>
                <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {currentPersona.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-line bg-paper/60 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={16} className="text-[#0b3b60] dark:text-[#38bdf8] shrink-0" />
                        <div className="truncate">
                          <p className="font-medium text-ink truncate">{doc.name}</p>
                          <p className="text-[10px] text-faint truncate font-mono">
                            {doc.issuer_code} · {doc.uri}
                          </p>
                        </div>
                      </div>
                      <span className="rounded bg-leaf-soft px-1.5 py-0.5 font-mono text-[9px] font-semibold text-leaf shrink-0 ml-2">
                        VERIFIED
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security PIN verification */}
              <div className="mt-4 rounded-xl border border-line bg-paper p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LockKey size={18} className="text-saffron-deep shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      6-Digit Security PIN
                    </p>
                    <p className="text-[10px] text-faint">
                      Auto-filled from demo sandbox
                    </p>
                  </div>
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  className="w-24 rounded-lg border border-line bg-surface px-2.5 py-1 text-center font-mono text-sm tracking-widest text-ink outline-none focus:border-saffron"
                />
              </div>

              {/* Authorize button */}
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-line px-4 py-2.5 text-xs font-medium text-muted hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAuthorize}
                  className="flex-[2] rounded-xl bg-[#0b3b60] hover:bg-[#082a46] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} weight="fill" />
                  Approve & Import Records
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
