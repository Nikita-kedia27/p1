import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  FileCheck2,
  Cpu,
  User,
  Loader2,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Wand2,
  Flame,
  Check,
} from 'lucide-react';
import { ChatMessage, InterviewModeId } from '../types';
import { INTERVIEW_MODES } from '../constants';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { analyzeSpeechText, cleanFillerWords, speakText, stopSpeaking } from '../utils/nlp';

interface ChatScreenProps {
  messages: ChatMessage[];
  mode: InterviewModeId;
  personaName: string;
  isStreaming: boolean;
  streamingText: string;
  onSendMessage: (text: string) => void;
  onTriggerHint: () => void;
  onTriggerDontKnow: () => void;
  onRequestReport: () => void;
  retryStatus: {
    isRetrying: boolean;
    attempt: number;
    message: string;
  } | null;
  error: string | null;
  onRetryLast: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  mode,
  personaName,
  isStreaming,
  streamingText,
  onSendMessage,
  onTriggerHint,
  onTriggerDontKnow,
  onRequestReport,
  retryStatus,
  error,
  onRetryLast,
}) => {
  const [inputText, setInputText] = useState('');
  const [autoSendOnMicStop, setAutoSendOnMicStop] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [fillerCleanedToast, setFillerCleanedToast] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRecordingTextRef = useRef<string>('');

  const currentMode = INTERVIEW_MODES.find((m) => m.id === mode) || INTERVIEW_MODES[0];

  // Speech Recognition Hook
  const {
    isListening,
    isProcessing,
    error: speechError,
    duration: speechDuration,
    audioLevel,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onTranscriptUpdate: (newTranscript) => {
      const base = preRecordingTextRef.current;
      const combined = base ? `${base.trim()} ${newTranscript.trim()}` : newTranscript;
      setInputText(combined);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
      }
    },
  });

  // NLP Analysis of current input text
  const speechAnalysis = analyzeSpeechText(inputText);

  // Auto-scroll to bottom on new messages or streaming chunks
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, retryStatus, isListening]);

  // Read latest model message aloud if TTS enabled
  useEffect(() => {
    if (!ttsEnabled || isStreaming) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'model') {
      setActiveSpeakingMsgId(lastMsg.id);
      speakText(lastMsg.text, () => {
        setActiveSpeakingMsgId(null);
      });
    }
  }, [messages, ttsEnabled, isStreaming]);

  // Handle Enter to send, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isListening) {
      stopListening();
    }
    stopSpeaking();
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText.trim());
    setInputText('');
    preRecordingTextRef.current = '';
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Start Voice Recording
  const handleToggleMic = async () => {
    if (isListening) {
      await stopListening();
      if (autoSendOnMicStop && inputText.trim()) {
        setTimeout(() => {
          handleSend();
        }, 300);
      }
    } else {
      stopSpeaking();
      preRecordingTextRef.current = inputText;
      await startListening();
    }
  };

  // Voice recording: Stop and directly feed to machine
  const handleStopAndSend = async () => {
    await stopListening();
    setTimeout(() => {
      if (inputText.trim()) {
        onSendMessage(inputText.trim());
        setInputText('');
        preRecordingTextRef.current = '';
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }, 200);
  };

  // Auto resize textarea height
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 220)}px`;
  };

  const insertCodeTemplate = (lang: string) => {
    const template = `\n\`\`\`${lang}\n\n\`\`\`\n`;
    setInputText((prev) => prev + template);
    textareaRef.current?.focus();
  };

  const handleCleanFillers = () => {
    const cleaned = cleanFillerWords(inputText);
    setInputText(cleaned);
    setFillerCleanedToast(true);
    setTimeout(() => setFillerCleanedToast(false), 2000);
  };

  const handlePlayMessageAudio = (msg: ChatMessage) => {
    if (activeSpeakingMsgId === msg.id) {
      stopSpeaking();
      setActiveSpeakingMsgId(null);
    } else {
      stopSpeaking();
      setActiveSpeakingMsgId(msg.id);
      speakText(msg.text, () => {
        setActiveSpeakingMsgId(null);
      });
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-5xl mx-auto w-full px-2 sm:px-4">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-5">
        
        {/* Top Session & NLP Voice Bar */}
        <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-slate-100">{currentMode.name}</span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="text-slate-400">{personaName}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto Readout Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !ttsEnabled;
                setTtsEnabled(next);
                if (!next) stopSpeaking();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                ttsEnabled
                  ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Read interviewer questions aloud using speech synthesis"
            >
              {ttsEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{ttsEnabled ? 'Voice Aloud: ON' : 'Voice Aloud: OFF'}</span>
            </button>
          </div>
        </div>

        {/* Message Thread */}
        {messages.map((message) => {
          const isInterviewer = message.role === 'model';
          const isSpeakingThis = activeSpeakingMsgId === message.id;

          return (
            <div
              key={message.id}
              className={`flex gap-3 sm:gap-4 ${
                isInterviewer ? 'justify-start' : 'justify-end'
              } animate-fade-in`}
            >
              {/* Interviewer Avatar */}
              {isInterviewer && (
                <div className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                  <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 shadow-sm ${
                  isInterviewer
                    ? 'bg-slate-900/90 border border-slate-800 text-slate-100'
                    : 'bg-indigo-600/90 border border-indigo-500/50 text-white shadow-indigo-900/20'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10 text-[11px] font-mono">
                  <span className="font-bold tracking-wide uppercase opacity-80 flex items-center gap-1.5">
                    <span>{isInterviewer ? personaName || 'Technical Interviewer' : 'Candidate (You)'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Speak question button for model messages */}
                    {isInterviewer && (
                      <button
                        type="button"
                        onClick={() => handlePlayMessageAudio(message)}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                          isSpeakingThis ? 'text-indigo-400 animate-pulse' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={isSpeakingThis ? 'Stop voice readout' : 'Read question aloud'}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="opacity-60">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {isInterviewer ? (
                  <MarkdownRenderer content={message.text} />
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                    {message.text}
                  </div>
                )}
              </div>

              {/* Candidate Avatar */}
              {!isInterviewer && (
                <div className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-300">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Real-time Streaming Model Turn */}
        {isStreaming && (
          <div className="flex gap-3 sm:gap-4 justify-start animate-fade-in">
            <div className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 bg-slate-900/90 border border-slate-800 text-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10 text-[11px] font-mono">
                <span className="font-bold tracking-wide uppercase opacity-80 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                  <span>{personaName || 'Technical Interviewer'}</span>
                </span>
                <span className="text-indigo-400 text-[10px] animate-pulse">Evaluating & Formulating...</span>
              </div>

              {streamingText ? (
                <>
                  <MarkdownRenderer content={streamingText} />
                  <span className="streaming-cursor" />
                </>
              ) : (
                <div className="flex items-center gap-2 py-3 text-slate-400 text-xs italic">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1">Analyzing candidate response and reasoning follow-up...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 429 Rate Limit Auto-Retry Notification Banner */}
        {retryStatus && retryStatus.isRetrying && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs flex items-center gap-3 animate-pulse">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-300">Rate Limit Reached (429)</p>
              <p className="text-amber-200/90">{retryStatus.message}</p>
            </div>
          </div>
        )}

        {/* Error Notification with Retry */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/50 text-rose-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={onRetryLast}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {speechError && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{speechError}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Action Buttons Toolbar */}
      <div className="py-2.5 px-1 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Quick Helper Prompts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isStreaming || isListening}
              onClick={onTriggerHint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all disabled:opacity-40 cursor-pointer text-xs"
              title="Request a subtle hint from the interviewer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Give me a hint</span>
            </button>

            <button
              type="button"
              disabled={isStreaming || isListening}
              onClick={onTriggerDontKnow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all disabled:opacity-40 cursor-pointer text-xs"
              title="State you don't know and ask how to reason about it"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>I don&apos;t know</span>
            </button>

            {/* Quick Code Block inserters */}
            <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-800 text-[11px] text-slate-400">
              <span className="text-slate-500">Code:</span>
              <button
                type="button"
                onClick={() => insertCodeTemplate('sql')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 font-mono text-[10px] cursor-pointer"
              >
                SQL
              </button>
              <button
                type="button"
                onClick={() => insertCodeTemplate('python')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 font-mono text-[10px] cursor-pointer"
              >
                Python
              </button>
            </div>
          </div>

          {/* End Interview and Get Section 13 Report Button */}
          <button
            type="button"
            disabled={isStreaming || isListening}
            onClick={onRequestReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-40 cursor-pointer text-xs ml-auto"
            title="Conclude interview and generate Section 13 comprehensive evaluation report"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>End interview and get report</span>
          </button>
        </div>

        {/* NLP Speech Analysis Bar (When user has spoken or typed) */}
        {inputText.trim().length > 0 && !isListening && (
          <div className="flex flex-wrap items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-300">
                {speechAnalysis.wordCount} words (~{speechAnalysis.estimatedSpeakingSeconds}s speech)
              </span>
              {speechAnalysis.fillerWordCount > 0 ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {speechAnalysis.fillerWordCount} filler words ({speechAnalysis.fillerWordsFound.join(', ')})
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Crisp phrasing
                </span>
              )}
            </div>

            {speechAnalysis.fillerWordCount > 0 && (
              <button
                type="button"
                onClick={handleCleanFillers}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                title="Remove unnecessary filler words (um, uh, like, etc.)"
              >
                <Wand2 className="w-3 h-3" />
                <span>Clean fillers</span>
              </button>
            )}
            {fillerCleanedToast && (
              <span className="text-[10px] text-emerald-400 font-mono">Fillers cleaned!</span>
            )}
          </div>
        )}

        {/* Live Microphone Recording Banner */}
        {isListening && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-indigo-950/60 border border-rose-500/40 shadow-lg space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                </span>
                <span className="text-xs font-bold text-white tracking-wide">
                  LISTENING TO MIC... ({formatSeconds(speechDuration)})
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Speak your answer clearly; live words appear below
                </span>
              </div>

              {/* Audio Waveform visualization */}
              <div className="flex items-center gap-1 h-5 px-2 bg-slate-950/50 rounded-lg">
                {[40, 70, 100, 60, 90, 50, 80, 30].map((baseHeight, i) => {
                  const dynamicHeight = Math.max(15, Math.min(100, (audioLevel / 100) * baseHeight * 1.3));
                  return (
                    <span
                      key={i}
                      className="w-1 bg-gradient-to-t from-rose-500 to-indigo-400 rounded-full transition-all duration-75"
                      style={{ height: `${dynamicHeight}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Quick Action controls while speaking */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10 text-xs">
              <label className="flex items-center gap-1.5 text-slate-300 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSendOnMicStop}
                  onChange={(e) => setAutoSendOnMicStop(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span>Direct Feed (auto-send on mic stop)</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  Stop & Review
                </button>
                <button
                  type="button"
                  onClick={handleStopAndSend}
                  className="px-3.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Stop & Feed to Machine</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Audio Modal / Toast */}
        {isProcessing && (
          <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>AI Transcribing speech audio accurately...</span>
          </div>
        )}

        {/* Input Box Area */}
        <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900/90 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-lg">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={
              isStreaming
                ? 'Interviewer is speaking...'
                : isListening
                ? 'Listening to microphone... your spoken words will appear here in real time.'
                : 'Type your answer, or click the mic button to speak directly... (Enter to send, Shift+Enter for newline)'
            }
            className="w-full px-4 pt-3 pb-12 sm:pb-3 sm:pr-32 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none resize-none font-sans leading-relaxed"
          />

          {/* Bottom Send & Mic Controls */}
          <div className="absolute right-2.5 bottom-2 flex items-center gap-1.5">
            {/* Microphone Answer Button */}
            <button
              type="button"
              disabled={isStreaming}
              onClick={handleToggleMic}
              className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title={isListening ? 'Stop recording' : 'Answer using microphone (speech-to-text)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-rose-400" />}
            </button>

            {/* Send Button */}
            <button
              type="button"
              disabled={!inputText.trim() || isStreaming}
              onClick={handleSend}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              title="Send Response to Interviewer (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
