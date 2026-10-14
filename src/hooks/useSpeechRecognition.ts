import { useState, useRef, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface UseSpeechRecognitionOptions {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onAutoSend?: (finalTranscript: string) => void;
}

export const useSpeechRecognition = (options?: UseSpeechRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasWebSpeech, setHasWebSpeech] = useState(false);
  const [duration, setDuration] = useState(0);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setHasWebSpeech(Boolean(SpeechRecognitionAPI));
  }, []);

  // Audio visualizer tracking
  const setupAudioVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch {
      // AudioContext not available or blocked
    }
  };

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  // Start listening
  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    setDuration(0);

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    try {
      // Request mic permission and setup visualizer
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setupAudioVisualizer(stream);

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Path A: Web Speech API supported (instant streaming dictation)
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let accumulated = '';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (final) {
            accumulated += (accumulated ? ' ' : '') + final.trim();
          }

          const currentFullText = (accumulated + (interim ? ' ' + interim : '')).trim();
          setTranscript(currentFullText);
          options?.onTranscriptUpdate?.(currentFullText, false);
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone access was denied. Please allow microphone permissions.');
            stopListening();
          }
        };

        recognition.onend = () => {
          // If stopped intentionally, do not auto-restart
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } else {
        // Path B: MediaRecorder fallback using Gemini Audio API
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start(250);
        mediaRecorderRef.current = recorder;
        setIsListening(true);
      }
    } catch (err: any) {
      console.error('Failed to access microphone:', err);
      setError(err.message || 'Microphone access failed. Please check permissions.');
      setIsListening(false);
      cleanupAudio();
    }
  }, [options]);

  // Stop listening
  const stopListening = useCallback(async () => {
    setIsListening(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop Web Speech
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    // If we used MediaRecorder fallback, process audio via Gemini transcribe API
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setIsProcessing(true);
      const recorder = mediaRecorderRef.current;

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Data = reader.result as string;
            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioData: base64Data, mimeType: 'audio/webm' }),
              });
              const data = await res.json();
              if (data.transcription) {
                setTranscript(data.transcription);
                options?.onTranscriptUpdate?.(data.transcription, true);
              } else if (data.error) {
                setError(data.error);
              }
            } catch (apiErr: any) {
              setError(apiErr.message || 'Transcription error.');
            } finally {
              setIsProcessing(false);
              cleanupAudio();
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (err: any) {
          setError(err.message || 'Failed to process audio.');
          setIsProcessing(false);
          cleanupAudio();
        }
      };

      recorder.stop();
    } else {
      cleanupAudio();
    }
  }, [options]);

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isListening,
    isProcessing,
    transcript,
    error,
    hasWebSpeech,
    duration,
    audioLevel,
    startListening,
    stopListening,
    clearTranscript,
  };
};
