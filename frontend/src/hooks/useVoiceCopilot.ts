import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguageStore } from "@/store/languageStore";
import api from "@/lib/api";

const audioCache = new Map<string, string>();

const LANG_MAP: Record<string, string> = {
  en: "en-US",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  as: "as-IN",
};

export function useVoiceCopilot(onTranscript: (text: string) => void) {
  const language = useLanguageStore((s) => s.language);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [listenError, setListenError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsVoiceSupported(true);
    } else {
      setIsVoiceSupported(false);
    }
  }, []);

  const toggleListening = useCallback(async () => {
    setListenError(null);

    // Stop recording
    if (isListening && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        
        // Stop all tracks to release the mic
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (audioBlob.size < 500) {
           return; // Too short to transcribe
        }

        setIsAudioLoading(true);
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");
          formData.append("language", language);

          const res = await fetch("/api/stt", {
            method: "POST",
            body: formData,
          });
          
          if (!res.ok) {
             throw new Error(`STT HTTP Error: ${res.status}`);
          }
          
          const data = await res.json();
          const transcript = data.transcript;
          if (transcript && transcript.trim()) {
            onTranscriptRef.current(transcript.trim());
          }
        } catch (error) {
          console.error("[VoiceCopilot] STT error:", error);
          setListenError("Voice service is currently unavailable. Please try again.");
        } finally {
          setIsAudioLoading(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (e) {
      console.warn("[VoiceCopilot] Could not start microphone:", e);
      setListenError("Unable to access microphone. Please check permissions.");
      setIsListening(false);
    }
  }, [isListening, language]);

  const interruptSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsAudioLoading(false);
  }, []);

  const browserSpeak = useCallback(
    (text: string, overrideLang?: string) => {
      setIsAudioLoading(false);
      if (typeof window === "undefined" || !window.speechSynthesis) {
        setIsSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = LANG_MAP[overrideLang || language] || "en-US";

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (v) =>
          v.lang.startsWith(utt.lang.split("-")[0]) &&
          (v.name.toLowerCase().includes("female") ||
            v.name.toLowerCase().includes("woman")),
      );
      if (femaleVoice) utt.voice = femaleVoice;

      utt.rate = 1.05;
      utt.onend = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utt);
    },
    [language],
  );

  const speak = useCallback(
    async (payload: string | { text: string; lang: string }) => {
      interruptSpeech();

      const textToSpeak = typeof payload === "string" ? payload : payload.text;
      const reqLang = typeof payload === "string" ? language : payload.lang;

      const cleanSpeech = textToSpeak
        .replace(/[\*\_\`\#]/g, "")
        .replace(/\n+/g, " ")
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
        .trim();

      if (!cleanSpeech) return;

      setIsAudioLoading(true);

      try {
        if (audioCache.has(cleanSpeech)) {
          const audioUrl = audioCache.get(cleanSpeech)!;
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
          setIsAudioLoading(false);
          setIsSpeaking(true);
          audio.play();
          return;
        }

        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: cleanSpeech,
            gender: "female",
            language: reqLang,
          }),
        });

        if (res.status === 204) {
          browserSpeak(cleanSpeech, reqLang);
          return;
        }

        if (!res.ok) throw new Error(`TTS API ${res.status}`);

        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        audioCache.set(cleanSpeech, audioUrl);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          browserSpeak(cleanSpeech, reqLang);
        };

        setIsAudioLoading(false);
        setIsSpeaking(true);
        audio.play();
      } catch {
        setIsAudioLoading(false);
        browserSpeak(cleanSpeech, reqLang);
      }
    },
    [interruptSpeech, browserSpeak, language],
  );

  return {
    isListening,
    isSpeaking,
    isAudioLoading,
    isVoiceSupported,
    listenError,
    toggleListening,
    speak,
    interruptSpeech,
  };
}
