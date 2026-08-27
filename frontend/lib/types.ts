export type Lang = "en" | "hi" | "bn" | "mr" | "ta" | "te" | "gu" | "kn";

export type FontSize = "normal" | "large" | "xlarge";
export type ContrastMode = "default" | "high" | "dark";

export interface A11yPreferences {
  fontSize: FontSize;
  contrast: ContrastMode;
  dyslexiaFont: boolean;
  reduceMotion: boolean;
  autoReadAloud: boolean;
}

export interface Portal {
  id: string;
  name_en: string;
  name_hi: string;
  short: string;
  url: string;
  line_color: string;
}

export interface DocRequired {
  doc: string;
  mandatory: boolean;
}

export interface ResolvedDoc {
  id: string;
  name_en: string;
  name_hi: string;
  mandatory: boolean;
}

export interface StepField {
  label_en: string;
  label_hi: string;
  profile_key: string | null;
  required: boolean;
}

export interface Step {
  id: string;
  portal: string;
  form_name: string;
  title_en: string;
  title_hi: string;
  why_en: string;
  why_hi: string;
  url: string;
  est_time_min: number;
  fee_note_en: string;
  fee_note_hi: string;
  depends_on: string[];
  docs_resolved: ResolvedDoc[];
  fields: StepField[];
  tips?: string[];
  included?: boolean;
  condition_label_en?: string;
  condition_label_hi?: string;
  portal_info: Portal;
}

export interface LifeEventMeta {
  id: string;
  name_en: string;
  name_hi: string;
  summary_en: string;
  summary_hi: string;
  icon: string;
}

export interface IntentResult {
  event_id: string;
  confidence: number;
  detected_language: string;
  city: string | null;
  conditions: Record<string, boolean>;
  matched_keywords: string[];
  alternatives: { event_id: string; score: number }[];
  engine: string;
}

export interface RoadmapResponse {
  intent: IntentResult;
  event: LifeEventMeta & { steps: Step[]; keywords: unknown };
  steps: Step[];
  excluded_steps: Step[];
  reusable_docs: { doc_id: string; used_in_steps: number }[];
}

export type PortalHealth = "up" | "degraded" | "down";

export interface PortalStatus {
  portal_id: string;
  name_en: string;
  name_hi: string;
  short: string;
  url: string;
  status: PortalHealth;
  avg_latency_ms: number;
  checked_at: string;
}

export interface RtiDraftResponse {
  letter: string;
  filing_url: string;
  guidance: string[];
}
