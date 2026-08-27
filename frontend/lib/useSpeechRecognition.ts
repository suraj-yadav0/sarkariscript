"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiBase } from "./api";
import { getLanguageOption } from "./i18n";
import { useApp } from "./store";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export type MicPermission = "prompt" | "granted" | "denied" | "unsupported";
export type SpeechMode = "native" | "backend";

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
    brave?: unknown;
  }
}

function isBrave(): boolean {
  return typeof window !== "undefined" && Boolean((window as { brave?: unknown }).brave);
}

export function useSpeechRecognition({
  onFinalTranscript,
}: {
  onFinalTranscript?: (text: string) => void;
} = {}) {
  const { lang, announce } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    // Voice input is available if native Web Speech works or we can fall back
    // to the backend Whisper endpoint via MediaRecorder (covers Brave).
    const hasNative = Boolean(
      window.SpeechRecognition || window.webkitSpeechRecognition
    );
    const hasRecorder = typeof MediaRecorder !== "undefined";
    return hasNative || hasRecorder;
  });
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<MicPermission>("prompt");
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [mode, setMode] = useState<SpeechMode>(() => {
    if (typeof window === "undefined") return "native";
    const hasNative = Boolean(
      window.SpeechRecognition || window.webkitSpeechRecognition
    );
    return isBrave() || !hasNative ? "backend" : "native";
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef<(lang?: string) => void>(() => {});
  const langOption = getLanguageOption(lang);

  const stopRecorder = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        // already stopped
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mode === "backend") {
      stopRecorder();
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
    }
    setIsListening(false);
  }, [mode, stopRecorder]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return true;
    const md = navigator.mediaDevices as
      | { getUserMedia?: (c: MediaStreamConstraints) => Promise<MediaStream> }
      | undefined;
    if (!md || typeof md.getUserMedia !== "function") {
      setPermission("unsupported");
      return false;
    }
    setRequestingPermission(true);
    try {
      const stream = await md.getUserMedia({ audio: true });
      setPermission("granted");
      streamRef.current = stream;
      return true;
    } catch (err) {
      const name =
        (err as DOMException)?.name ||
        (typeof err === "object" && err && "error" in err
          ? String((err as { error?: unknown }).error)
          : "");
      setPermission(
        name === "NotAllowedError" || name === "SecurityError"
          ? "denied"
          : "prompt"
      );
      return false;
    } finally {
      setRequestingPermission(false);
    }
  }, []);

  const transcribeWithBackend = useCallback(
    async (blob: Blob) => {
      setIsProcessing(true);
      try {
        const form = new FormData();
        const type = blob.type || "audio/webm";
        form.append("audio", new File([blob], "speech.webm", { type }));
        form.append("language", langOption.bcp47.slice(0, 2));
        const res = await fetch(`${getApiBase()}/api/stt/transcribe`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error(`STT ${res.status}`);
        const data = (await res.json()) as { text?: string };
        const text = (data.text ?? "").trim();
        if (text) {
          setTranscript((prev) => {
            const next = prev ? `${prev} ${text}` : text;
            if (onFinalTranscript) onFinalTranscript(next);
            return next;
          });
        } else {
          setError("no-speech");
        }
      } catch {
        setError("network");
        announce("Voice network error. Please verify speech connection.");
      } finally {
        setIsProcessing(false);
        setIsListening(false);
      }
    },
    [announce, langOption.bcp47, onFinalTranscript]
  );

  const startListening = useCallback(
    async (customLang?: string) => {
      if (typeof window === "undefined") return;

      setError(null);
      setTranscript("");
      setInterimTranscript("");

      // Request microphone permission first so the in-page prompt shows.
      const granted = await requestPermission();
      if (!granted) {
        setError("permission_denied");
        setIsListening(false);
        return;
      }

      const stream = streamRef.current;
      if (!stream) {
        setError("permission_denied");
        setIsListening(false);
        return;
      }

      if (mode === "backend") {
        // Use MediaRecorder + backend local Whisper fallback (e.g. Brave).
        const supported = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
          "audio/ogg;codecs=opus",
        ].find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t));
        if (!supported) {
          setError("unsupported");
          setIsListening(false);
          return;
        }
        try {
          chunksRef.current = [];
          const recorder = new MediaRecorder(stream, {
            mimeType: supported,
          });
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: supported });
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            transcribeWithBackend(blob);
          };
          recorderRef.current = recorder;
          recorder.start();
          setIsListening(true);
          return;
        } catch {
          setError("failed_to_start");
          setIsListening(false);
          return;
        }
      }

      // Native Web Speech path.
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError("unsupported");
        setPermission("unsupported");
        return;
      }

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {
            // ignore
          }
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = customLang || langOption.bcp47;

        recognition.onstart = () => {
          setIsListening(true);
          announce("Microphone listening. Please speak.");
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let currentInterim = "";
          let currentFinal = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              currentFinal += res[0].transcript;
            } else {
              currentInterim += res[0].transcript;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => {
              const next = prev
                ? `${prev} ${currentFinal.trim()}`
                : currentFinal.trim();
              if (onFinalTranscript) onFinalTranscript(next);
              return next;
            });
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === "network") {
            // Native speech service unreachable (e.g. Brave). Fall back to the
            // backend Whisper endpoint instead of showing a dead-end message.
            setMode("backend");
            setError(null);
            setIsListening(false);
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            startRef.current(customLang);
            return;
          }
          if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed" ||
            event.error === "audio-capture"
          ) {
            setError("permission_denied");
            setPermission("denied");
            announce("Microphone permission was denied.");
          } else if (
            event.error === "no-speech" ||
            event.error === "aborted" ||
            event.error === "no-match"
          ) {
            // User did not speak or manually stopped; no error needed
          } else {
            setError(event.error);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        setError("failed_to_start");
        setIsListening(false);
      }
    },
    [langOption.bcp47, announce, onFinalTranscript, mode, requestPermission, transcribeWithBackend]
  );

  useEffect(() => {
    startRef.current = startListening;
  }, [startListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // cleanup
        }
      }
    };
  }, [stopListening]);

  return {
    isListening,
    isProcessing,
    transcript,
    interimTranscript,
    isSupported,
    error,
    permission,
    mode,
    requestingPermission,
    requestPermission,
    startListening,
    stopListening,
    resetTranscript,
  };
}
