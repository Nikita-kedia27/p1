// ==========================================
// NLP UTILITIES & SPEECH SYNTHESIS
// ==========================================

export interface SpeechAnalysis {
  wordCount: number;
  fillerWordCount: number;
  fillerWordsFound: string[];
  estimatedSpeakingSeconds: number;
  pacingNote: string;
}

const COMMON_FILLER_WORDS = [
  'um',
  'uh',
  'erm',
  'ah',
  'like',
  'you know',
  'basically',
  'actually',
  'literally',
  'sort of',
  'kind of',
  'i mean',
];

export const analyzeSpeechText = (text: string): SpeechAnalysis => {
  if (!text.trim()) {
    return {
      wordCount: 0,
      fillerWordCount: 0,
      fillerWordsFound: [],
      estimatedSpeakingSeconds: 0,
      pacingNote: 'No text entered',
    };
  }

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const wordCount = words.length;
  const foundFillers: string[] = [];

  // Check multi-word fillers first
  const lowerText = text.toLowerCase();
  ['you know', 'sort of', 'kind of', 'i mean'].forEach((phrase) => {
    const matches = lowerText.split(phrase).length - 1;
    for (let i = 0; i < matches; i++) {
      foundFillers.push(phrase);
    }
  });

  // Check single-word fillers
  words.forEach((word) => {
    if (['um', 'uh', 'erm', 'ah', 'basically', 'actually', 'literally'].includes(word)) {
      foundFillers.push(word);
    }
  });

  // Count instances of "like" when used as filler
  const likeMatches = words.filter((w) => w === 'like').length;
  if (likeMatches > 1) {
    for (let i = 0; i < likeMatches - 1; i++) {
      foundFillers.push('like');
    }
  }

  const speakingSeconds = Math.round((wordCount / 140) * 60);

  let pacing = 'Normal conversational pace';
  if (wordCount < 20) pacing = 'Concise response';
  else if (wordCount > 150) pacing = 'Detailed technical explanation';

  return {
    wordCount,
    fillerWordCount: foundFillers.length,
    fillerWordsFound: Array.from(new Set(foundFillers)),
    estimatedSpeakingSeconds: speakingSeconds,
    pacingNote: pacing,
  };
};

export const cleanFillerWords = (text: string): string => {
  let cleaned = text;
  // Replace filler words
  COMMON_FILLER_WORDS.forEach((filler) => {
    const regex = new RegExp(`\\b${filler}\\b,?\\s*`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  // Clean double spaces
  return cleaned.replace(/\s{2,}/g, ' ').trim();
};

// Clean markdown syntax for smooth TTS playback
export const stripMarkdownForSpeech = (markdown: string): string => {
  return markdown
    .replace(/```[\s\S]*?```/g, ' [code block omitted] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/>\s+/g, '')
    .replace(/[-*+]\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speakText = (text: string, onEnd?: () => void) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const clean = stripMarkdownForSpeech(text);
  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  currentUtterance = utterance;

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Pick a natural English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice =
    voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))) ||
    voices.find((v) => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };

  utterance.onerror = () => {
    currentUtterance = null;
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};
