export type InterviewModeId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface InterviewMode {
  id: InterviewModeId;
  label: string;
  name: string;
  shortDesc: string;
  fullDesc: string;
  tag: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  pdfData?: string; // base64 string
  isReport?: boolean;
}

export interface InterviewSetup {
  jobTitle: string;
  jobDescription: string;
  mode: InterviewModeId;
  resumeFile: {
    name: string;
    size: number;
    base64: string;
  } | null;
}
