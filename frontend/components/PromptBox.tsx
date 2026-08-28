"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Microphone,
  PaperPlaneRight,
  X,
  Waveform,
} from "@phosphor-icons/react";
import { apiPost } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import type { Lang, RoadmapResponse } from "@/lib/types";

const MULTILINGUAL_EXAMPLES: Record<Lang, string[]> = {
  en: [
    "I want to open a grocery shop in Lucknow",
    "Apply for new Aadhaar card and book slot",
    "Apply for instant e-PAN or physical PAN card",
    "Apply for family ration card under NFSA",
    "Apply for new voter ID card online",
    "Get Ayushman Bharat card for 5 lakh free treatment",
    "Register birth certificate online",
    "Buy a new car, get RC and FASTag",
    "File income tax return for refund",
    "Grievance pending for 45 days RTI",
    "Apply for fresh passport to travel abroad",
    "Get driving licence for the first time",
  ],
  hi: [
    "मुझे लखनऊ में किराना दुकान खोलनी है",
    "नया आधार कार्ड बनवाना है स्लॉट बुक करें",
    "नया पैन कार्ड या ई-पैन बनवाना है",
    "परिवार के लिए नया राशन कार्ड बनवाना है",
    "नया वोटर आईडी कार्ड बनवाना है",
    "आयुष्मान भारत कार्ड बनवाना है ₹5 लाख मुफ्त इलाज",
    "जन्म प्रमाणपत्र बनवाना है नगर निगम से",
    "नई गाड़ी खरीदनी है, RC और FASTag भी",
    "ITR भरना है रिफंड चाहिए",
    "शिकायत दर्ज करानी है, 45 दिन से अटकी है",
    "नया पासपोर्ट बनवाना है विदेश जाने के लिए",
    "ड्राइविंग लाइसेंस बनवाना है पहली बार",
  ],
  bn: [
    "আমি কলকাতায় নতুন মুদি দোকান খুলতে চাই",
    "নতুন আধার কার্ড তৈরি ও অ্যাপয়েন্টমেন্ট",
    "নতুন প্যান কার্ড বা ই-প্যান আবেদন",
    "নতুন রেশন কার্ডের আবেদন করতে চাই",
    "নতুন ভোটার আইডি কার্ড বানাতে হবে",
    "আয়ুষ্মান ভারত গোল্ডেন কার্ড তৈরি ৫ লাখ চিকিৎসা",
    "জন্ম সার্টিফিকেট নিবন্ধন করতে চাই",
    "নতুন গাড়ি রেজিস্ট্রেশন ও ফাস্ট্যাগ করাতে হবে",
    "ইনকাম ট্যাক্স রিটার্ন ফাইল করে রিফান্ড চাই",
    "৪৫ দিন ধরে অভিযোগ অমীমাংসিত আরটিআই",
    "নতুন পাসপোর্টের আবেদন করতে চাই",
    "প্রথমবার ড্রাইভিং লাইসেন্স তৈরি করতে হবে",
  ],
  mr: [
    "मला पुण्यात किराणा दुकान सुरू करायचे आहे",
    "नवीन आधार कार्ड आणि अपॉइंटमेंट बुक करा",
    "नवीन पॅन कार्ड किंवा ई-पॅन अर्ज करायचा आहे",
    "कुटुंबासाठी नवीन रेशन कार्ड काढायचे आहे",
    "नवीन मतदार ओळखपत्र (Voter ID) अर्ज",
    "आयुष्मान भारत ५ लाख मोफत उपचार कार्ड",
    "नवीन जन्म दाखला नोंदणी करायची आहे",
    "नवीन गाडीची नोंदणी आणि फास्टॅग काढायचा आहे",
    "आयकर परतावा मिळवण्यासाठी आयटीआर भरायचा आहे",
    "४५ दिवसांपासून तक्रार प्रलंबित आहे आरटीआय",
    "नवीन पासपोर्ट काढायचा आहे",
    "पहिल्यांदा ड्रायव्हिंग लायसन्स काढायचे आहे",
  ],
  ta: [
    "நான் சென்னையில் மளிகைக் கடை தொடங்க வேண்டும்",
    "புதிய ஆதார் அட்டை முன்பதிவு செய்ய வேண்டும்",
    "புதிய பான் கார்டு அல்லது இ-பான் விண்ணப்பம்",
    "புதிய குடும்ப அட்டை / ரேஷன் அட்டை விண்ணப்பம்",
    "புதிய வாக்காளர் அடையாள அட்டை விண்ணப்பம்",
    "ஆயுஷ்மான் பாரத் மருத்துவ அட்டை பெற வேண்டும்",
    "பிறப்புச் சான்றிதழ் பதிவு செய்ய வேண்டும்",
    "புதிய கார் பதிவு மற்றும் FASTag தேவை",
    "வருமான வரி தாக்கல் செய்து ரீஃபண்ட் பெற வேண்டும்",
    "45 நாட்களாக நிலுவையில் உள்ள புகார் ஆர்டிஐ",
    "புதிய பாஸ்போர்ட் விண்ணப்பிக்க வேண்டும்",
    "முதல்முறை ஓட்டுநர் உரிமம் பெற வேண்டும்",
  ],
  te: [
    "నేను హైదరాబాద్‌లో కిరాణా దుకాణం ప్రారంభించాలనుకుంటున్నాను",
    "కొత్త ఆధార్ కార్డు స్లాట్ బుక్ చేసుకోవాలి",
    "కొత్త పాన్ కార్డ్ లేదా ఈ-పాన్ దరఖాస్తు",
    "కొత్త రేషన్ కార్డు కోసం దరఖాస్తు చేయాలి",
    "కొత్త ఓటర్ ఐడీ కార్డు పొందాలి",
    "ఆయుష్మాన్ భారత్ ఉచిత వైద్య కార్డు కావాలి",
    "జనన ధృవీకరణ పత్రం నమోదు చేయాలి",
    "కొత్త కారు రిజిస్ట్రేషన్ మరియు ఫాస్టాగ్ కావాలి",
    "రీఫండ్ కోసం ఐటీఆర్ దాఖలు చేయాలి",
    "45 రోజులుగా పెండింగ్‌లో ఉన్న ఫిర్యాదు ఆర్‌టీఐ",
    "కొత్త పాస్‌పోర్ట్ కోసం దరఖాస్తు చేసుకోవాలి",
    "మొదటిసారి డ್ರైవింగ్ లైసెన్స్ పొందాలి",
  ],
  gu: [
    "મારે અમદાવાદમાં કરિયાણાની દુકાન શરૂ કરવી છે",
    "નવું આધાર કાર્ડ બનાવવું છે સ્લોટ બુક કરો",
    "નવું પાન કાર્ડ અથવા ઈ-પાન બનાવવું છે",
    "નવું રેશન કાર્ડ બનાવવું છે",
    "નવું ચૂંટણી કાર્ડ / વોટર આઈડી બનાવવું છે",
    "આયુષ્માન ભારત કાર્ડ ૫ લાખ મફત સારવાર",
    "નવો જન્મ દાખલો બનાવવો છે",
    "નવી ગાડીનું રજીસ્ટ્રેશન અને ફાસ્ટેગ કરાવવું છે",
    "રિફંડ મેળવવા માટે આઈટીઆર ભરવું છે",
    "૪૫ દિવસથી ફરિયાદ અટકી છે આરટીઆઈ",
    "નવો પાસપોર્ટ બનાવવો છે",
    "પહેલી વાર ડ્રાઇવિંગ લાયસન્સ બનાવવું છે",
  ],
  kn: [
    "ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ದಿನಸಿ ಅಂಗಡಿ ತೆರೆಯಲು ಬಯಸುತ್ತೇನೆ",
    "ಹೊಸ ಆಧಾರ್ ಕಾರ್ಡ್ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಬೇಕು",
    "ಹೊಸ ಪ್ಯಾನ್ ಕಾರ್ಡ್ ಅಥವಾ ಇ-ಪ್ಯಾನ್ ಅರ್ಜಿ",
    "ಕುಟುಂಬಕ್ಕೆ ಹೊಸ ರೇಷನ್ ಕಾರ್ಡ್ ಬೇಕು",
    "ಹೊಸ ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ ಅರ್ಜಿ",
    "ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಪಡೆಯಬೇಕು",
    "ಜನನ ಪ್ರಮಾಣಪತ್ರ ನೋಂದಣಿ ಮಾಡಬೇಕು",
    "ಹೊಸ ಕಾರು ನೋಂದಣಿ ಮತ್ತು ಫಾಸ್ಟ್‌ಟ್ಯಾಗ್ ಬೇಕು",
    "ಮರುಪಾವತಿಗಾಗಿ ಐಟಿಆರ್ ಸಲ್ಲಿಸಬೇಕು",
    "45 ದಿನಗಳಿಂದ ಬಾಕಿ ಇರುವ ದೂರು ಆರ್‌ಟಿಐ",
    "ಹೊಸ ಪಾಸ್‌ಪೋರ್ಟ್‌ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕು",
    "ಮೊದಲ ಬಾರಿಗೆ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಪಡೆಯಬೇಕು",
  ],
};

export function PromptBox() {
  const router = useRouter();
  const { lang, setLastNav, announce } = useApp();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exampleIdx, setExampleIdx] = useState(0);

  const {
    isListening,
    isConnecting,
    isProcessing,
    interimTranscript,
    isSupported,
    error: voiceError,
    permission,
    requestingPermission,
    requestPermission,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onFinalTranscript: (text) => {
      setQuery(text);
    },
  });

  // Global Alt+V shortcut for Voice Search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.altKey && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isListening, startListening, stopListening]);

  async function navigate(text: string) {
    if (!text.trim() || loading) return;
    if (isListening) stopListening();
    setLoading(true);
    setError(null);
    try {
      const roadmap = await apiPost<RoadmapResponse>("/api/navigate", {
        query: text,
      });
      setLastNav(roadmap);
      announce(`Roadmap generated for ${roadmap.event.name_en}`);
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

  const examples = MULTILINGUAL_EXAMPLES[lang] || MULTILINGUAL_EXAMPLES.en;

  return (
    <div className="w-full">
      {/* Listening Banner */}
      {(isListening || isConnecting || isProcessing) && (
        <div
          role="status"
          aria-live="assertive"
          className="mb-3 flex items-center justify-between rounded-xl border border-saffron/40 bg-saffron-soft px-4 py-2.5 text-xs text-saffron-deep shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-saffron-deep" />
            </span>
            <span className="font-semibold">
              {isConnecting
                ? t(lang, "voice.connecting")
                : isProcessing
                ? t(lang, "voice.processing")
                : t(lang, "voice.listening")}
            </span>
            {!isProcessing && !isConnecting && interimTranscript && (
              <span className="italic opacity-85 truncate max-w-[200px] sm:max-w-[320px]">
                &ldquo;{interimTranscript}&rdquo;
              </span>
            )}
          </div>
          {!isProcessing && !isConnecting && (
            <button
              type="button"
              onClick={stopListening}
              className="rounded-full bg-saffron-deep text-white px-3 py-1 font-semibold text-[11px] hover:bg-ink transition-colors"
            >
              {t(lang, "voice.stop")}
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate(query);
        }}
        className="relative rounded-2xl border border-line bg-surface p-2 sm:p-2.5 shadow-[0_2px_4px_rgba(27,27,24,0.04),0_12px_32px_-12px_rgba(27,27,24,0.14)] transition-all focus-within:border-saffron focus-within:shadow-[0_2px_4px_rgba(27,27,24,0.04),0_14px_40px_-10px_rgba(194,102,29,0.25)]"
      >
        <label htmlFor="prompt" className="sr-only">
          {t(lang, "hero.sub")}
        </label>
        <div className="relative">
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
            className="w-full resize-none bg-transparent px-2.5 sm:px-3 pt-1.5 sm:pt-2 text-sm sm:text-[15px] leading-relaxed outline-none placeholder:text-faint pr-8"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t(lang, "voice.clear")}
              className="absolute right-2 top-2 p-1 text-faint hover:text-ink transition-colors rounded-full hover:bg-black/5"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5 xs:gap-2 px-2.5 sm:px-3 pt-2 pb-1.5 border-t border-line/60 bg-paper/60 rounded-b-2xl">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={() => {
                if (isListening || isConnecting) {
                  stopListening();
                } else {
                  startListening();
                }
              }}
              aria-label={
                isListening
                  ? t(lang, "voice.stop")
                  : isConnecting
                  ? t(lang, "voice.connecting")
                  : t(lang, "voice.start")
              }
              title={
                isListening
                  ? t(lang, "voice.stop")
                  : isConnecting
                  ? t(lang, "voice.connecting")
                  : t(lang, "voice.start")
              }
              className={`relative inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.96] shrink-0 ${
                isListening || isConnecting || isProcessing
                  ? "bg-saffron text-white shadow-md animate-pulse"
                  : "bg-surface text-muted hover:bg-black/5 hover:text-ink border border-line"
              }`}
            >
              {isListening ? (
                <>
                  <Waveform size={14} weight="bold" className="animate-spin" />
                  <span className="text-[11px] sm:text-xs">{t(lang, "voice.stop")}</span>
                </>
              ) : isConnecting ? (
                <>
                  <Waveform size={14} weight="bold" className="animate-spin" />
                  <span className="text-[11px] sm:text-xs">
                    {t(lang, "voice.connecting")}
                  </span>
                </>
              ) : isProcessing ? (
                <>
                  <Waveform size={14} weight="bold" className="animate-spin" />
                  <span className="text-[11px] sm:text-xs">Transcribing…</span>
                </>
              ) : (
                <>
                  <Microphone size={14} weight="duotone" className="text-saffron-deep" />
                  <span className="text-[11px] sm:text-xs">Voice</span>
                </>
              )}
            </button>

            {loading && (
              <span
                className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.1em] text-saffron truncate"
                aria-live="polite"
              >
                {t(lang, "hero.thinking")}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-ink px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-paper transition-all hover:bg-saffron-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink focus-visible:outline-2 focus-visible:outline-saffron ml-auto shrink-0"
          >
            {loading ? (
              <PaperPlaneRight size={14} className="animate-pulse" />
            ) : (
              <PaperPlaneRight size={14} weight="fill" />
            )}
            <span className="text-xs sm:text-sm">{t(lang, "hero.navigate")}</span>
          </button>
        </div>
      </form>

      {/* Voice or Backend Error Alert */}
      {voiceError && !isListening && (
        <div
          role="alert"
          className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-alert-soft px-3 py-2 text-xs text-alert border border-alert/20"
        >
          <span className="leading-snug">
            {voiceError === "permission_denied"
              ? t(lang, "voice.permission_denied")
              : voiceError === "network"
              ? t(lang, "voice.network")
              : !isSupported
              ? t(lang, "voice.unsupported")
              : `Voice error: ${voiceError}`}
          </span>
          {(voiceError === "network" || voiceError === "permission_denied") && (
            <button
              type="button"
              onClick={() => startListening()}
              className="shrink-0 rounded-full bg-alert text-white px-2.5 py-0.5 text-[11px] font-semibold hover:opacity-90 transition-opacity"
            >
              {t(lang, "voice.retry")}
            </button>
          )}
        </div>
      )}

      {/* Microphone permission prompt shown inside the page */}
      {!isSupported ? (
        <div
          role="alert"
          className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-wait-soft px-3.5 py-2 text-xs text-wait border border-wait/20"
        >
          <span>{t(lang, "voice.unsupported")}</span>
        </div>
      ) : (
        permission === "denied" && (
          <div
            role="alert"
            className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-alert-soft px-3.5 py-2 text-xs text-alert border border-alert/20"
          >
            <span>
              {t(lang, "voice.allow_hint")} {t(lang, "voice.permission_denied")}
            </span>
            <button
              type="button"
              onClick={requestPermission}
              disabled={requestingPermission}
              className="shrink-0 rounded-full bg-alert text-white px-2.5 py-0.5 text-[11px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {requestingPermission
                ? t(lang, "voice.requesting")
                : t(lang, "voice.allow")}
            </button>
          </div>
        )
      )}

      {error && (
        <p
          role="alert"
          className="mt-2.5 rounded-xl bg-alert-soft px-3.5 py-2 text-sm text-alert border border-alert/20"
        >
          {error}
        </p>
      )}

      {/* Multilingual Examples */}
      <div className="mt-3 sm:mt-4 flex flex-col xs:flex-row xs:items-center gap-1.5 sm:gap-2 w-full min-w-0">
        <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-faint shrink-0">
          {t(lang, "hero.examples")}
        </span>
        <div className="flex items-center gap-1.5 min-w-0 flex-1 w-full">
          {examples.slice(exampleIdx, exampleIdx + 1).map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQuery(ex);
                navigate(ex);
              }}
              className="group inline-flex min-w-0 flex-1 items-center justify-between gap-1.5 rounded-full border border-line bg-surface px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs text-muted transition-colors hover:border-saffron hover:text-saffron-deep focus-visible:outline-2 focus-visible:outline-saffron overflow-hidden"
            >
              <span className="truncate text-left">{ex}</span>
              <ArrowRight
                size={11}
                weight="bold"
                className="shrink-0 opacity-40 group-hover:opacity-100"
              />
            </button>
          ))}
          <button
            onClick={() => setExampleIdx((i) => (i + 1) % examples.length)}
            className="rounded-full px-1.5 py-0.5 font-mono text-[10px] sm:text-[11px] text-faint underline decoration-dotted underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-saffron shrink-0"
          >
            more →
          </button>
        </div>
      </div>
    </div>
  );
}
