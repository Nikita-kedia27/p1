import React, { useEffect, useState } from 'react';
import { Terminal, Clock, RefreshCw, FileText, ShieldAlert, Cpu } from 'lucide-react';
import { InterviewModeId } from '../types';
import { INTERVIEW_MODES } from '../constants';

interface HeaderProps {
  isInterviewActive: boolean;
  mode: InterviewModeId;
  personaName?: string;
  hasReport: boolean;
  onOpenReport: () => void;
  onResetInterview: () => void;
  interviewStartTime: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  isInterviewActive,
  mode,
  personaName,
  hasReport,
  onOpenReport,
  onResetInterview,
  interviewStartTime,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    if (!isInterviewActive || !interviewStartTime) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - interviewStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isInterviewActive, interviewStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentMode = INTERVIEW_MODES.find((m) => m.id === mode) || INTERVIEW_MODES[0];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 py-3.5 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Terminal className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Interview<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Forge</span>
                </h1>
                <span className="text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  AI Simulator
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Technical Interview & Hiring Manager Engine
              </p>
            </div>
          </div>

          {/* Active Interview Status Bar */}
          {isInterviewActive && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Persona Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">Persona:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[160px] sm:max-w-[220px]">
                  {personaName || 'Technical Interviewer'}
                </span>
              </div>

              {/* Mode Badge */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="font-medium">{currentMode.tag}</span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2">
            {hasReport && (
              <button
                type="button"
                onClick={onOpenReport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Evaluation Report</span>
              </button>
            )}

            {isInterviewActive && (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                title="Start a new interview"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Interview</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Confirmation Modal for Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">Start New Interview?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ending this session will clear the current conversation and responses. Are you sure you want to reset and begin fresh?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmReset(false);
                  onResetInterview();
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
