// Thin wrappers around the Web Speech API (still vendor-prefixed as
// `webkitSpeechRecognition` in Chrome/Edge, and entirely absent in Firefox/
// Safari) so components can feature-detect once and not deal with the
// prefix directly.

const getSpeechRecognitionCtor = (): { new (): SpeechRecognition } | undefined =>
  window.SpeechRecognition || window.webkitSpeechRecognition;

export const isSpeechRecognitionSupported = (): boolean => Boolean(getSpeechRecognitionCtor());

export const isSpeechSynthesisSupported = (): boolean =>
  typeof window !== "undefined" && "speechSynthesis" in window;

// Continuous + interim results, so the composer can show live partial
// transcripts instead of only committing text once the user stops talking.
export const createSpeechRecognition = (): SpeechRecognition | null => {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = navigator.language || "en-US";
  return recognition;
};

// Voices load asynchronously in some browsers (notably Chrome, on first
// page load) - resolves once the list is populated, or immediately if it
// already is.
export const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve([]);
      return;
    }
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    const handleVoicesChanged = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
  });
};

// Only one utterance plays at a time - starting a new one cancels whatever
// was already speaking.
export const speak = (text: string, voiceURI?: string, onEnd?: () => void): void => {
  if (!isSpeechSynthesisSupported() || !text.trim()) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  if (voiceURI) {
    const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceURI);
    if (voice) utterance.voice = voice;
  }
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = (): void => {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
};
