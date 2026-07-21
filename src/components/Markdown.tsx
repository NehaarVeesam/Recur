import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../utils/cn';

interface MarkdownProps {
  content: string;
  className?: string;
}

/** Ensure GFM tables parse even when pasted without a blank line before them. */
function normalizeMarkdown(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    // Blank line before a table header row when missing
    .replace(/([^\n])\n(\|[^\n]+\|\n\|[-:| ]+\|)/g, '$1\n\n$2');
}

export const Markdown: React.FC<MarkdownProps> = ({ content, className }) => {
  return (
    <div
      className={cn(
        'prose prose-invert max-w-none text-slate-300 leading-relaxed',
        'prose-headings:text-white prose-headings:font-semibold prose-headings:tracking-tight',
        'prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
        'prose-a:text-indigo-400 hover:prose-a:text-indigo-300',
        'prose-strong:text-slate-100',
        'prose-code:text-indigo-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:bg-[#010101] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg prose-pre:text-slate-200',
        'prose-blockquote:border-l-indigo-500/50 prose-blockquote:text-slate-400',
        'prose-hr:border-white/10',
        'prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5',
        'prose-li:my-1 prose-li:marker:text-slate-500',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="not-prose my-4 w-full overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm text-slate-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/[0.06] text-slate-200">{children}</thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="whitespace-nowrap border-r border-white/5 px-3 py-2.5 font-semibold last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-r border-white/5 px-3 py-2 align-top last:border-r-0 [&_code]:text-indigo-300 [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.85em]">
              {children}
            </td>
          ),
        }}
      >
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
};
