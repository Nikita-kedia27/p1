import React, { useState, useRef } from 'react';
import {
  FileUp,
  FileCheck,
  X,
  Briefcase,
  Layers,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Code2,
  FileText,
} from 'lucide-react';
import { InterviewModeId, InterviewSetup } from '../types';
import { INTERVIEW_MODES, SAMPLE_JOB_TITLES, SAMPLE_JOB_DESCRIPTION } from '../constants';

interface SetupScreenProps {
  onStartInterview: (setup: InterviewSetup) => void;
  isLoading: boolean;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartInterview, isLoading }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedMode, setSelectedMode] = useState<InterviewModeId>('A');
  const [resumeFile, setResumeFile] = useState<{
    name: string;
    size: number;
    base64: string;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    setErrorMsg(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('Please upload a valid PDF document (.pdf).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size is too large (maximum 15MB recommended).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setResumeFile({
          name: file.name,
          size: file.size,
          base64: result,
        });
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected PDF file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleLoadSample = () => {
    setJobTitle('Junior Data Engineer');
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!jobDescription.trim() && !resumeFile && !jobTitle.trim()) {
      setErrorMsg('Please provide either a Job Description, Target Title, or upload a Resume to configure your interview.');
      return;
    }

    onStartInterview({
      jobTitle: jobTitle.trim(),
      jobDescription: jobDescription.trim(),
      mode: selectedMode,
      resumeFile,
    });
  };

  const activeModeObj = INTERVIEW_MODES.find((m) => m.id === selectedMode) || INTERVIEW_MODES[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      {/* Intro Header */}
      <div className="text-center space-y-3 mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Calibrated for 0–2 Years Experience (Freshers & Juniors)</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          Simulate Real-World <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300">Technical Interviews</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload your resume and target job requirements. The AI assumes the mindset of a seasoned hiring manager, asking adaptive questions, probing technical decisions, and evaluating core readiness.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Section 1: Resume Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Upload Candidate Resume (PDF)</span>
                <span className="text-xs font-normal text-slate-400">(Recommended)</span>
              </label>
              {resumeFile && (
                <button
                  type="button"
                  onClick={() => setResumeFile(null)}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>

            {!resumeFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-indigo-400 bg-indigo-950/30'
                    : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-200">
                      Drop your resume PDF here, or <span className="text-indigo-400 underline">browse</span>
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      PDF format, up to 15MB. Inline data sent directly to the model.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{resumeFile.name}</p>
                    <p className="text-xs text-indigo-300 font-mono">{formatFileSize(resumeFile.size)} • PDF Ready</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Ready to Analyze
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Target Role & Job Description */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div className="space-y-2">
              <label htmlFor="target-title" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-400" />
                <span>Target Job Title</span>
                <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                id="target-title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Junior Data Engineer, Associate Software Engineer"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all"
              />
              
              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-slate-500">Quick fill:</span>
                {SAMPLE_JOB_TITLES.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setJobTitle(title)}
                    className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="job-description" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span>Job Description (JD)</span>
                  <span className="text-xs font-normal text-slate-400">(Recommended)</span>
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline cursor-pointer"
                >
                  Load Sample Data Engineer JD
                </button>
              </div>
              <textarea
                id="job-description"
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description, key requirements, tech stack (e.g., Python, SQL, AWS, Spark), or responsibilities here..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all resize-y leading-relaxed font-mono text-xs"
              />
            </div>
          </div>

          {/* Section 3: Interview Mode Selection */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label htmlFor="interview-mode" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Select Interview Mode</span>
              </label>
              <span className="text-xs text-indigo-400 font-mono">Section 14</span>
            </div>

            <div className="relative">
              <select
                id="interview-mode"
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as InterviewModeId)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 outline-none appearance-none cursor-pointer"
              >
                {INTERVIEW_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id} className="bg-slate-900 py-2">
                    {mode.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                ▼
              </div>
            </div>

            {/* Mode Description Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-indigo-300">{activeModeObj.name}:</span>
                <span className="text-slate-400">{activeModeObj.shortDesc}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">{activeModeObj.fullDesc}</p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Preparing Interviewer Persona & Environment...</span>
                </>
              ) : (
                <>
                  <span>Start Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2.5">
              Follows Section 16 Initialization Protocol: selects persona, announces format, and opens with natural first question.
            </p>
          </div>

        </div>
      </form>
    </div>
  );
};
