import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { SetupScreen } from './components/SetupScreen';
import { ChatScreen } from './components/ChatScreen';
import { ReportModal } from './components/ReportModal';
import { ChatMessage, InterviewModeId, InterviewSetup } from './types';
import { INTERVIEW_MODES } from './constants';

export default function App() {
  const [interviewActive, setInterviewActive] = useState(false);
  const [setupData, setSetupData] = useState<InterviewSetup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [personaName, setPersonaName] = useState<string>('Technical Interviewer');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [retryStatus, setRetryStatus] = useState<{
    isRetrying: boolean;
    attempt: number;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interviewStartTime, setInterviewStartTime] = useState<number | null>(null);

  // Helper to extract persona name from first response
  const detectPersona = (text: string): string => {
    const personaMatches = [
      /Persona [A-H]:?\s*([A-Za-z0-9\s/—–-]+?)(?:\.|\n|,|$)/i,
      /act as (?:a|the)?\s*([A-Za-z0-9\s/—–-]+?(?:Manager|Interviewer|Recruiter|Engineer|Lead))/i,
      /I'll act as (?:the|a)?\s*([A-Za-z0-9\s/—–-]+?)(?:\.|\n|,|$)/i,
      /I will act as (?:the|a)?\s*([A-Za-z0-9\s/—–-]+?)(?:\.|\n|,|$)/i,
    ];

    for (const regex of personaMatches) {
      const match = text.match(regex);
      if (match && match[1]) {
        const cleaned = match[1].trim().replace(/^[:\-\s]+/, '');
        if (cleaned.length > 3 && cleaned.length < 50) {
          return cleaned;
        }
      }
    }

    if (text.toLowerCase().includes('big data')) return 'Big Data Hiring Manager';
    if (text.toLowerCase().includes('sql developer')) return 'SQL Developer Interviewer';
    if (text.toLowerCase().includes('data engineer')) return 'Data Engineer Hiring Manager';
    if (text.toLowerCase().includes('recruiter')) return 'Technical Recruiter';
    if (text.toLowerCase().includes('cloud')) return 'Cloud Data Interviewer';

    return 'Technical Hiring Manager';
  };

  // Helper to detect if a message is an end-of-interview Section 13 report
  const isSection13Report = (text: string): boolean => {
    const lower = text.toLowerCase();
    const hasReportTitle =
      lower.includes('end-of-interview report') ||
      lower.includes('overall assessment') ||
      lower.includes('performance evaluation') ||
      lower.includes('evaluation report');
    const hasReportSections =
      (lower.includes('skill-wise breakdown') || lower.includes('skills breakdown')) &&
      (lower.includes('improvement plan') || lower.includes('hiring-manager perspective') || lower.includes('answer review'));
    return Boolean(hasReportTitle && hasReportSections);
  };

  // Stream communication with the server endpoint
  const streamChat = async (allMessages: ChatMessage[]) => {
    setIsStreaming(true);
    setStreamingText('');
    setError(null);
    setRetryStatus(null);

    // Prepare payload for backend
    const payloadMessages = allMessages.map((msg, index) => ({
      role: msg.role,
      text: msg.text,
      // Include PDF in first message if available
      ...(index === 0 && msg.pdfData ? { pdfData: msg.pdfData } : {}),
    }));

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in response body.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);

            // Handle 429 auto-retry notification event
            if (parsed.status === 'retrying') {
              setRetryStatus({
                isRetrying: true,
                attempt: parsed.attempt,
                message: parsed.message,
              });
              continue;
            }

            // Handle server-propagated error
            if (parsed.error) {
              if (parsed.isRateLimit) {
                setRetryStatus({
                  isRetrying: false,
                  attempt: 3,
                  message: 'Rate limit exceeded. Please wait a short moment and try again.',
                });
              }
              throw new Error(parsed.error);
            }

            // Handle streaming text chunk
            if (parsed.text) {
              setRetryStatus(null);
              accumulatedText += parsed.text;
              setStreamingText(accumulatedText);
            }
          } catch (e: any) {
            if (e.message && !e.message.includes('JSON')) {
              throw e;
            }
          }
        }
      }

      // Finalize turn
      if (accumulatedText.trim()) {
        const newModelMsg: ChatMessage = {
          id: 'model-' + Date.now(),
          role: 'model',
          text: accumulatedText,
          timestamp: Date.now(),
        };

        // Extract persona name if this is the first turn
        if (allMessages.length <= 1) {
          const detected = detectPersona(accumulatedText);
          setPersonaName(detected);
        }

        // Check if this response contains Section 13 final report
        if (isSection13Report(accumulatedText)) {
          newModelMsg.isReport = true;
          setReportContent(accumulatedText);
          setReportModalOpen(true);
        }

        setMessages((prev) => [...prev, newModelMsg]);
      }
    } catch (err: any) {
      console.error('Streaming error:', err);
      setError(err.message || 'An error occurred while communicating with the AI interviewer.');
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  // Start new interview from Setup Screen
  const handleStartInterview = (setup: InterviewSetup) => {
    setSetupData(setup);
    setInterviewActive(true);
    setInterviewStartTime(Date.now());
    setReportContent(null);
    setReportModalOpen(false);

    const modeObj = INTERVIEW_MODES.find((m) => m.id === setup.mode) || INTERVIEW_MODES[0];

    // Format first turn message according to Section 16 (Initialization Protocol)
    let initPrompt = `INTERVIEW SESSION INITIALIZATION:\n`;
    initPrompt += `- Selected Interview Mode: ${modeObj.label}\n`;
    initPrompt += `- Mode Details: ${modeObj.fullDesc}\n`;
    initPrompt += `- Target Job Title: ${setup.jobTitle || 'To be determined from Resume / JD'}\n`;
    
    if (setup.jobDescription) {
      initPrompt += `\nJOB DESCRIPTION:\n${setup.jobDescription}\n`;
    } else {
      initPrompt += `\nJOB DESCRIPTION: (None provided. Infer target role from candidate resume or ask a clarifying question).\n`;
    }

    if (setup.resumeFile) {
      initPrompt += `\nCANDIDATE RESUME: Attached as an inline PDF document named "${setup.resumeFile.name}".\n`;
    } else {
      initPrompt += `\nCANDIDATE RESUME: (No resume uploaded. Calibrate for a fresher/junior 0-2 years experience level).\n`;
    }

    initPrompt += `\nINSTRUCTIONS: Follow the Section 16 Initialization Protocol:
1. Review the attached resume and job description.
2. Select the appropriate hiring-manager persona (Persona A through H) matching this role.
3. Briefly announce your selected persona and interview format.
4. Open with your first natural technical interview question.
Do not output a questionnaire or multiple questions at once.`;

    const initialUserMsg: ChatMessage = {
      id: 'user-init-' + Date.now(),
      role: 'user',
      text: initPrompt,
      timestamp: Date.now(),
      pdfData: setup.resumeFile?.base64,
    };

    setMessages([initialUserMsg]);
    streamChat([initialUserMsg]);
  };

  // Candidate sends response
  const handleSendMessage = (text: string) => {
    if (isStreaming) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    streamChat(updated);
  };

  // Quick Action: Give me a hint
  const handleTriggerHint = () => {
    handleSendMessage(
      "Could you give me a subtle hint to point me in the right direction without revealing the complete solution?"
    );
  };

  // Quick Action: I don't know
  const handleTriggerDontKnow = () => {
    handleSendMessage(
      "I don't know the exact answer to this question. Could you explain the key concept and guide me on how an engineer should approach this problem?"
    );
  };

  // Quick Action: End interview and get report
  const handleRequestReport = () => {
    handleSendMessage(
      "Let's conclude the interview here. Please generate the full End-of-Interview Report following Section 13 of your instructions with all sections (A. Overall assessment, B. Skill-wise breakdown, C. Answer review, D. Hiring-manager perspective, and E. Prioritized improvement plan)."
    );
  };

  // Retry the last turn if there was an error
  const handleRetryLast = () => {
    if (messages.length > 0) {
      streamChat(messages);
    }
  };

  // Reset interview session
  const handleResetInterview = () => {
    setInterviewActive(false);
    setSetupData(null);
    setMessages([]);
    setPersonaName('Technical Interviewer');
    setStreamingText('');
    setReportContent(null);
    setReportModalOpen(false);
    setInterviewStartTime(null);
    setError(null);
    setRetryStatus(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header
        isInterviewActive={interviewActive}
        mode={setupData?.mode || 'A'}
        personaName={personaName}
        hasReport={Boolean(reportContent)}
        onOpenReport={() => setReportModalOpen(true)}
        onResetInterview={handleResetInterview}
        interviewStartTime={interviewStartTime}
      />

      <main className="flex-1 flex flex-col">
        {!interviewActive ? (
          <SetupScreen
            onStartInterview={handleStartInterview}
            isLoading={isStreaming}
          />
        ) : (
          <ChatScreen
            messages={messages}
            mode={setupData?.mode || 'A'}
            personaName={personaName}
            isStreaming={isStreaming}
            streamingText={streamingText}
            onSendMessage={handleSendMessage}
            onTriggerHint={handleTriggerHint}
            onTriggerDontKnow={handleTriggerDontKnow}
            onRequestReport={handleRequestReport}
            retryStatus={retryStatus}
            error={error}
            onRetryLast={handleRetryLast}
          />
        )}
      </main>

      {/* Section 13 Comprehensive Report Modal */}
      {reportModalOpen && reportContent && (
        <ReportModal
          reportContent={reportContent}
          onClose={() => setReportModalOpen(false)}
          onReset={handleResetInterview}
          mode={setupData?.mode || 'A'}
          personaName={personaName}
          jobTitle={setupData?.jobTitle}
        />
      )}
    </div>
  );
}
