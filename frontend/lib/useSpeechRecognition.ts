"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  }
}

export function useSpeechRecognition({
  onFinalTranscript,
}: {
  onFinalTranscript?: (text: string) => void;
} = {}) {
  const { lang, announce } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return Boolean(
      window.SpeechRecognition || window.webkitSpeechRecognition
    );
  });
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const langOption = getLanguageOption(lang);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (customLang?: string) => {
      if (typeof window === "undefined") return;
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError("unsupported");
        return;
      }

      setError(null);
      setTranscript("");
      setInterimTranscript("");

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {
            // ignore
          }
        }

        const recognition = new SpeechRecognition();
        // Use non-continuous recognition for web input stability and to avoid socket timeout network drops
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
          if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
          ) {
            setError("permission_denied");
            announce("Microphone permission was denied.");
          } else if (event.error === "network") {
            setError("network");
            announce("Voice network error. Please verify speech connection.");
          } else if (event.error === "no-speech" || event.error === "aborted") {
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
    [langOption.bcp47, announce, onFinalTranscript]
  );

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // cleanup
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
