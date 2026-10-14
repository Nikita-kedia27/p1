import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  FileCheck2,
  Cpu,
  User,
  CornerDownLeft,
  Loader2,
  RefreshCw,
  Code2,
} from 'lucide-react';
import { ChatMessage, InterviewModeId } from '../types';
import { INTERVIEW_MODES } from '../constants';
import { MarkdownRenderer } from './MarkdownRenderer';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentMode = INTERVIEW_MODES.find((m) => m.id === mode) || INTERVIEW_MODES[0];

  // Auto-scroll to bottom on new messages or streaming chunks
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, retryStatus]);

  // Handle Enter to send, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-5xl mx-auto w-full px-2 sm:px-4">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-6 space-y-6">
        
        {/* Session Banner */}
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-slate-100">{currentMode.name}</span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400">{currentMode.shortDesc}</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-300 font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>{personaName}</span>
          </div>
        </div>

        {/* Message Thread */}
        {messages.map((message) => {
          const isInterviewer = message.role === 'model';
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
                  <span className="font-bold tracking-wide uppercase opacity-80">
                    {isInterviewer ? personaName || 'Technical Interviewer' : 'Candidate'}
                  </span>
                  <span className="opacity-60">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
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
                <span className="text-indigo-400 text-[10px] animate-pulse">Responding...</span>
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
                  <span className="ml-1">Analyzing your response and framing follow-up...</span>
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

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Action Buttons Toolbar */}
      <div className="py-2 px-1 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Quick Helper Prompts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isStreaming}
              onClick={onTriggerHint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all disabled:opacity-40 cursor-pointer text-xs"
              title="Request a subtle hint from the interviewer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Give me a hint</span>
            </button>

            <button
              type="button"
              disabled={isStreaming}
              onClick={onTriggerDontKnow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all disabled:opacity-40 cursor-pointer text-xs"
              title="State you don't know and ask how to reason about it"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>I don&apos;t know</span>
            </button>

            {/* Quick Code Block inserters */}
            <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-800 text-[11px] text-slate-400">
              <span className="text-slate-500">Insert code:</span>
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
            disabled={isStreaming}
            onClick={onRequestReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-40 cursor-pointer text-xs ml-auto"
            title="Conclude interview and generate Section 13 comprehensive evaluation report"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>End interview and get report</span>
          </button>
        </div>

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
                : 'Type your answer or code here... (Press Enter to send, Shift + Enter for new line)'
            }
            className="w-full px-4 pt-3 pb-12 sm:pb-3 sm:pr-24 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none resize-none font-sans leading-relaxed"
          />

          {/* Bottom Send & Shortcut info */}
          <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
            <span className="hidden md:inline text-[10px] text-slate-500 font-mono">
              Shift+Enter: newline
            </span>
            <button
              type="button"
              disabled={!inputText.trim() || isStreaming}
              onClick={handleSend}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              title="Send Response (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
