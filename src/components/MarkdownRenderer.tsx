import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Configure marked with a custom code renderer that adds copy buttons and Prism highlight
  const html = useMemo(() => {
    const renderer = new marked.Renderer();

    renderer.code = function ({ text, lang }) {
      const language = (lang || 'text').toLowerCase();
      let highlighted = text;

      if (Prism.languages[language]) {
        try {
          highlighted = Prism.highlight(text, Prism.languages[language], language);
        } catch {
          highlighted = text;
        }
      } else if (language === 'sql' && Prism.languages.sql) {
        highlighted = Prism.highlight(text, Prism.languages.sql, 'sql');
      } else if (language === 'py' || language === 'python') {
        highlighted = Prism.highlight(text, Prism.languages.python, 'python');
      }

      // Generate a unique id for the snippet
      const blockId = 'code-' + Math.random().toString(36).substring(2, 9);
      const encodedText = encodeURIComponent(text);

      return `
        <div class="relative group my-4 rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-md overflow-hidden">
          <div class="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/70 text-xs font-mono text-slate-400">
            <span class="uppercase tracking-wider font-semibold text-slate-300">${language || 'CODE'}</span>
            <button 
              type="button"
              class="code-copy-btn flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              data-code="${encodedText}"
              data-id="${blockId}"
            >
              <span class="btn-label">Copy</span>
            </button>
          </div>
          <pre class="p-4 overflow-x-auto text-sm font-mono text-slate-100 leading-relaxed font-normal"><code>${highlighted}</code></pre>
        </div>
      `;
    };

    return marked.parse(content || '', {
      renderer,
      gfm: true,
      breaks: true,
    });
  }, [content]);

  // Handle delegated click for copy buttons inside rendered HTML
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('.code-copy-btn') as HTMLElement;
    if (target) {
      const code = decodeURIComponent(target.getAttribute('data-code') || '');
      const blockId = target.getAttribute('data-id') || '';
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          setCopiedId(blockId);
          const label = target.querySelector('.btn-label');
          if (label) label.textContent = 'Copied!';
          setTimeout(() => {
            setCopiedId(null);
            if (label) label.textContent = 'Copy';
          }, 2000);
        });
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`prose prose-invert max-w-none 
        prose-headings:text-slate-100 prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:text-xl prose-h1:border-b prose-h1:border-slate-800 prose-h1:pb-2 prose-h1:mb-3
        prose-h2:text-lg prose-h2:text-indigo-300 prose-h2:mt-4 prose-h2:mb-2
        prose-h3:text-base prose-h3:text-emerald-300 prose-h3:mt-3 prose-h3:mb-1.5
        prose-p:text-slate-200 prose-p:leading-relaxed prose-p:my-2
        prose-strong:text-white prose-strong:font-semibold
        prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5
        prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-5
        prose-li:text-slate-200 prose-li:my-1
        prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-950/20 prose-blockquote:px-4 prose-blockquote:py-1.5 prose-blockquote:rounded-r prose-blockquote:text-slate-300
        prose-table:w-full prose-table:border-collapse prose-table:my-3
        prose-th:bg-slate-800/80 prose-th:text-slate-200 prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-slate-700 prose-th:text-left prose-th:text-xs prose-th:font-semibold
        prose-td:border prose-td:border-slate-700/80 prose-td:px-3 prose-td:py-2 prose-td:text-xs prose-td:text-slate-300
        prose-hr:border-slate-800 prose-hr:my-4
        ${className}`}
      dangerouslySetInnerHTML={{ __html: html as string }}
    />
  );
};
