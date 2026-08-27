"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLanguageOption } from "./i18n";
import { useApp } from "./store";

export function useSpeechSynthesis() {
  const { lang, announce } = useApp();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return "speechSynthesis" in window;
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const langOption = getLanguageOption(lang);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (text: string, id: string = "general") => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      window.speechSynthesis.cancel();

      if (!text.trim()) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langOption.bcp47;
      utterance.rate = 0.95; // slightly slower for better clarity in Indian languages

      // Try finding a matching native voice
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(
        (v) => v.lang === langOption.bcp47 || v.lang.startsWith(langOption.code)
      );
      if (match) {
        utterance.voice = match;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingId(id);
        announce("Reading aloud started");
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingId(null);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingId(null);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [langOption.bcp47, langOption.code, announce]
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    speakingId,
    isSupported,
  };
}
