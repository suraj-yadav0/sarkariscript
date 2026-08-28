"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { ContrastMode, FontSize, Lang, RoadmapResponse } from "./types";
import { PROFILE_FIELDS } from "./profile-fields";
import { DIGILOCKER_PERSONAS } from "./digilocker";

const STORAGE_KEY = "sarkariscript:v2";

interface PersistedState {
  lang: Lang;
  profile: Record<string, string>;
  docsUploaded: string[];
  stepDone: Record<string, Record<string, boolean>>;
  addedSteps: Record<string, string[]>;
  lastNav: RoadmapResponse | null;
  fontSize: FontSize;
  contrast: ContrastMode;
  dyslexiaFont: boolean;
  reduceMotion: boolean;
  digilockerLinked?: boolean;
  digilockerPersona?: string | null;
  digilockerSyncedAt?: string | null;
  digilockerDocs?: string[];
}

const defaults: PersistedState = {
  lang: "en",
  profile: {},
  docsUploaded: [],
  stepDone: {},
  addedSteps: {},
  lastNav: null,
  fontSize: "normal",
  contrast: "default",
  dyslexiaFont: false,
  reduceMotion: false,
  digilockerLinked: false,
  digilockerPersona: null,
  digilockerSyncedAt: null,
  digilockerDocs: [],
};

function loadState(): PersistedState {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
      profile: parsed.profile || {},
      docsUploaded: Array.isArray(parsed.docsUploaded) ? parsed.docsUploaded : [],
      stepDone: parsed.stepDone || {},
      addedSteps: parsed.addedSteps || {},
      digilockerLinked: Boolean(parsed.digilockerLinked),
      digilockerPersona: parsed.digilockerPersona || null,
      digilockerSyncedAt: parsed.digilockerSyncedAt || null,
      digilockerDocs: Array.isArray(parsed.digilockerDocs) ? parsed.digilockerDocs : [],
    };
  } catch {
    return defaults;
  }
}

interface AppContextValue {
  lang: Lang;
  hydrated: boolean;
  profile: Record<string, string>;
  docsUploaded: string[];
  stepDone: Record<string, Record<string, boolean>>;
  addedSteps: Record<string, string[]>;
  lastNav: RoadmapResponse | null;
  fontSize: FontSize;
  contrast: ContrastMode;
  dyslexiaFont: boolean;
  reduceMotion: boolean;
  announcement: string;
  digilockerLinked: boolean;
  digilockerPersona: string | null;
  digilockerSyncedAt: string | null;
  digilockerDocs: string[];
  setLang: (lang: Lang) => void;
  setProfileField: (key: string, value: string) => void;
  toggleDoc: (docId: string) => void;
  markStepDone: (eventId: string, stepId: string, done: boolean) => void;
  addStepToJourney: (eventId: string, stepId: string) => void;
  setLastNav: (nav: RoadmapResponse) => void;
  clearLastNav: () => void;
  setFontSize: (size: FontSize) => void;
  setContrast: (contrast: ContrastMode) => void;
  setDyslexiaFont: (val: boolean) => void;
  setReduceMotion: (val: boolean) => void;
  resetA11y: () => void;
  announce: (message: string) => void;
  linkDigiLocker: (personaId: string) => void;
  unlinkDigiLocker: () => void;
  profileCompletionPct: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    let alive = true;
    void Promise.resolve().then(() => {
      if (!alive) return;
      setState(loadState());
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable; in-memory fallback
    }

    // Apply a11y & lang attributes to document root
    const root = document.documentElement;
    root.setAttribute("lang", state.lang);
    root.setAttribute("data-font-size", state.fontSize);
    root.setAttribute("data-contrast", state.contrast);
    root.setAttribute("data-dyslexia-font", String(state.dyslexiaFont));
    root.setAttribute("data-reduced-motion", String(state.reduceMotion));
  }, [state, hydrated]);

  const setLang = useCallback((lang: Lang) => {
    setState((s) => ({ ...s, lang }));
  }, []);

  const setProfileField = useCallback((key: string, value: string) => {
    setState((s) => ({ ...s, profile: { ...s.profile, [key]: value } }));
  }, []);

  const toggleDoc = useCallback((docId: string) => {
    setState((s) => ({
      ...s,
      docsUploaded: s.docsUploaded.includes(docId)
        ? s.docsUploaded.filter((d) => d !== docId)
        : [...s.docsUploaded, docId],
    }));
  }, []);

  const markStepDone = useCallback(
    (eventId: string, stepId: string, done: boolean) => {
      setState((s) => ({
        ...s,
        stepDone: {
          ...s.stepDone,
          [eventId]: {
            ...(s.stepDone[eventId] || {}),
            [stepId]: done,
          },
        },
      }));
    },
    []
  );

  const addStepToJourney = useCallback((eventId: string, stepId: string) => {
    setState((s) => {
      const current = s.addedSteps[eventId] || [];
      if (current.includes(stepId)) return s;
      return {
        ...s,
        addedSteps: {
          ...s.addedSteps,
          [eventId]: [...current, stepId],
        },
      };
    });
  }, []);

  const setLastNav = useCallback((nav: RoadmapResponse) => {
    setState((s) => ({ ...s, lastNav: nav }));
  }, []);

  const clearLastNav = useCallback(() => {
    setState((s) => ({ ...s, lastNav: null }));
  }, []);

  const setFontSize = useCallback((fontSize: FontSize) => {
    setState((s) => ({ ...s, fontSize }));
  }, []);

  const setContrast = useCallback((contrast: ContrastMode) => {
    setState((s) => ({ ...s, contrast }));
  }, []);

  const setDyslexiaFont = useCallback((dyslexiaFont: boolean) => {
    setState((s) => ({ ...s, dyslexiaFont }));
  }, []);

  const setReduceMotion = useCallback((reduceMotion: boolean) => {
    setState((s) => ({ ...s, reduceMotion }));
  }, []);

  const resetA11y = useCallback(() => {
    setState((s) => ({
      ...s,
      fontSize: "normal",
      contrast: "default",
      dyslexiaFont: false,
      reduceMotion: false,
    }));
  }, []);

  const announce = useCallback((msg: string) => {
    setAnnouncement("");
    requestAnimationFrame(() => {
      setAnnouncement(msg);
    });
  }, []);

  const linkDigiLocker = useCallback((personaId: string) => {
    const persona =
      DIGILOCKER_PERSONAS.find((p) => p.id === personaId) ||
      DIGILOCKER_PERSONAS[0];
    if (!persona) return;

    // Collect all mapped doc IDs from this persona's issued documents
    const docIds = new Set<string>();
    persona.documents.forEach((d) => {
      d.mapped_doc_ids.forEach((id) => docIds.add(id));
    });

    setState((s) => {
      const mergedDocs = Array.from(new Set([...s.docsUploaded, ...docIds]));
      return {
        ...s,
        profile: {
          ...s.profile,
          ...persona.profile,
        },
        docsUploaded: mergedDocs,
        digilockerLinked: true,
        digilockerPersona: persona.id,
        digilockerSyncedAt: new Date().toISOString(),
        digilockerDocs: persona.documents.map((d) => d.id),
      };
    });
  }, []);

  const unlinkDigiLocker = useCallback(() => {
    setState((s) => ({
      ...s,
      digilockerLinked: false,
      digilockerPersona: null,
      digilockerSyncedAt: null,
      digilockerDocs: [],
    }));
  }, []);

  const profileCompletionPct = useMemo(() => {
    const filled = PROFILE_FIELDS.filter((f) => (state.profile[f.key] ?? "").trim()).length;
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
  }, [state.profile]);

  const value: AppContextValue = {
    lang: state.lang,
    hydrated,
    profile: state.profile,
    docsUploaded: state.docsUploaded,
    stepDone: state.stepDone,
    addedSteps: state.addedSteps,
    lastNav: state.lastNav,
    fontSize: state.fontSize,
    contrast: state.contrast,
    dyslexiaFont: state.dyslexiaFont,
    reduceMotion: state.reduceMotion,
    announcement,
    digilockerLinked: Boolean(state.digilockerLinked),
    digilockerPersona: state.digilockerPersona ?? null,
    digilockerSyncedAt: state.digilockerSyncedAt ?? null,
    digilockerDocs: state.digilockerDocs ?? [],
    setLang,
    setProfileField,
    toggleDoc,
    markStepDone,
    addStepToJourney,
    setLastNav,
    clearLastNav,
    setFontSize,
    setContrast,
    setDyslexiaFont,
    setReduceMotion,
    resetA11y,
    announce,
    linkDigiLocker,
    unlinkDigiLocker,
    profileCompletionPct,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
