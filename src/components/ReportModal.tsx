import React, { useEffect } from 'react';
import {
  Download,
  Printer,
  X,
  FileCheck2,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Award,
  Layers,
  Cpu,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MarkdownRenderer } from './MarkdownRenderer';
import { InterviewModeId } from '../types';
import { INTERVIEW_MODES } from '../constants';

interface ReportModalProps {
  reportContent: string;
  onClose: () => void;
  onReset: () => void;
  mode: InterviewModeId;
  personaName: string;
  jobTitle?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  reportContent,
  onClose,
  onReset,
  mode,
  personaName,
  jobTitle,
}) => {
  // Trigger congratulatory confetti once on open
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#38bdf8', '#fbbf24'],
      });
    } catch {
      // ignore
    }
  }, []);

  const currentMode = INTERVIEW_MODES.find((m) => m.id === mode) || INTERVIEW_MODES[0];

  const handleDownloadMarkdown = () => {
    const titleSlug = (jobTitle || 'Technical_Interview').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `InterviewForge_Report_${titleSlug}_${new Date().toISOString().split('T')[0]}.md`;
    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex justify-center p-2 sm:p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto print-surface">
        
        {/* Modal Top Header (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Technical Interview Evaluation Report
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Section 13 Standard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {jobTitle || 'Target Technical Role'} • {currentMode.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download MD */}
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
              title="Download full report as Markdown file"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download .md</span>
            </button>

            {/* Print / Save as PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Back to conversation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Header (Only visible when printing) */}
        <div className="hidden print:block p-6 border-b border-slate-300">
          <h1 className="text-2xl font-bold text-slate-900">InterviewForge Performance Evaluation</h1>
          <p className="text-sm text-slate-600 mt-1">
            Target Role: {jobTitle || 'Technical Role'} | Mode: {currentMode.name} | Interviewer Persona: {personaName}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Date: {new Date().toLocaleDateString()} | Generated by AI Technical Interview Engine
          </p>
        </div>

        {/* Metadata Strip in UI */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 no-print">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Evaluator: <strong className="text-slate-200">{personaName}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rubric: <strong className="text-slate-200">100-Point System Rubric</strong></span>
            </span>
          </div>
          <span className="text-emerald-400 font-mono text-[11px]">Comprehensive Assessment Complete</span>
        </div>

        {/* Report Body */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[75vh] print:max-h-none print:overflow-visible">
          <MarkdownRenderer content={reportContent} className="text-sm leading-relaxed" />
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 no-print">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Chat</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Start New Interview</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
