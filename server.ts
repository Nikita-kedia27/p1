// ==========================================
// INTERVIEWFORGE SERVER
// AI Technical Interview & Hiring Manager Simulator
// ==========================================

// MODEL CONFIGURATION: Swap the model name here if needed.
// Free-tier Flash model: 'gemini-3.8-flash'
export const MODEL = 'gemini-3.8-flash';

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT } from './src/systemPrompt.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize GoogleGenAI client with required aistudio-build telemetry header
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  pdfData?: string; // base64 encoded PDF without data URL prefix
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    model: MODEL,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Audio transcription endpoint for microphone recordings
app.post('/api/transcribe', async (req, res) => {
  const { audioData, mimeType } = req.body as { audioData: string; mimeType?: string };

  if (!audioData) {
    return res.status(400).json({ error: 'Audio data is required.' });
  }

  let ai: GoogleGenAI;
  try {
    ai = getAIClient();
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'API key error' });
  }

  try {
    const cleanBase64 = audioData.replace(/^data:[^;]+;base64,/, '');

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this spoken technical interview answer verbatim. Accurately capture technical terms, programming languages, algorithms, SQL syntax, and architectural concepts. Return only the transcribed text without quotes, markdown wrappers, or intro/outro remarks.',
          },
        ],
      },
    });

    const transcription = response.text?.trim() || '';
    res.json({ transcription });
  } catch (err: any) {
    console.error('[Transcribe Error]', err);
    res.status(500).json({ error: err.message || 'Failed to transcribe audio' });
  }
});

// Streaming interview chat endpoint
app.post('/api/interview/chat', async (req, res) => {
  const { messages } = req.body as { messages: ChatMessage[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  let ai: GoogleGenAI;
  try {
    ai = getAIClient();
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'API key configuration error.' });
  }

  // Format messages into Gemini contents format
  const contents = messages.map((msg, index) => {
    const parts: any[] = [];

    // If PDF is included (typically in the initial user turn)
    if (msg.pdfData) {
      // Strip data url prefix if present
      const cleanBase64 = msg.pdfData.replace(/^data:application\/pdf;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      });
    }

    parts.push({ text: msg.text || '' });

    return {
      role: msg.role === 'model' ? 'model' : 'user',
      parts,
    };
  });

  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Retry logic for 429 rate limit errors
  const maxRetries = 2;
  let attempt = 0;
  let streamSuccess = false;

  while (attempt <= maxRetries && !streamSuccess) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model: MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
      streamSuccess = true;
      return;
    } catch (err: any) {
      attempt++;
      const errorMessage = err?.message || String(err);
      const isRateLimit =
        err?.status === 429 ||
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('quota');

      console.error(`[InterviewForge] Error on attempt ${attempt}:`, errorMessage);

      if (isRateLimit && attempt <= maxRetries) {
        // Send a friendly notification event to the client indicating retry
        res.write(
          `data: ${JSON.stringify({
            isRateLimit: true,
            status: 'retrying',
            attempt,
            message: `Rate limit encountered. Automatically retrying in ${attempt * 2}s (attempt ${attempt} of ${maxRetries})...`,
          })}\n\n`
        );
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
        continue;
      }

      // If we exhausted retries or it's a non-retriable error
      res.write(
        `data: ${JSON.stringify({
          error: errorMessage,
          isRateLimit,
        })}\n\n`
      );
      res.end();
      return;
    }
  }
});

const PORT = 3000;

const startServer = async () => {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InterviewForge running at http://0.0.0.0:${PORT} [Model: ${MODEL}]`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
