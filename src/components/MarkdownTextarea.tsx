import React, { useCallback } from 'react';
import { cn } from '../utils/cn';

const INDENT = '  ';

function applyIndent(
  value: string,
  start: number,
  end: number,
  outdent: boolean
): { nextValue: string; nextStart: number; nextEnd: number } {
  const hasSelection = start !== end;
  const spansLines = hasSelection && value.slice(start, end).includes('\n');

  // Single-cursor Tab → insert spaces at caret
  if (!outdent && !spansLines && !hasSelection) {
    const nextValue = value.slice(0, start) + INDENT + value.slice(end);
    const caret = start + INDENT.length;
    return { nextValue, nextStart: caret, nextEnd: caret };
  }

  // Selection without newlines + Tab → replace selection with indent
  if (!outdent && hasSelection && !spansLines) {
    const nextValue = value.slice(0, start) + INDENT + value.slice(end);
    const caret = start + INDENT.length;
    return { nextValue, nextStart: caret, nextEnd: caret };
  }

  // Multi-line selection or Shift+Tab → indent / outdent whole lines
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const afterEnd = value.indexOf('\n', end);
  const lineEnd = afterEnd === -1 ? value.length : afterEnd;
  const block = value.slice(lineStart, lineEnd);
  const lines = block.split('\n');

  let firstDelta = 0;
  const nextLines = lines.map((line, i) => {
    if (outdent) {
      if (line.startsWith(INDENT)) {
        if (i === 0) firstDelta = -INDENT.length;
        return line.slice(INDENT.length);
      }
      if (line.startsWith('\t')) {
        if (i === 0) firstDelta = -1;
        return line.slice(1);
      }
      if (line.startsWith(' ')) {
        if (i === 0) firstDelta = -1;
        return line.slice(1);
      }
      return line;
    }
    if (i === 0) firstDelta = INDENT.length;
    return INDENT + line;
  });

  const nextBlock = nextLines.join('\n');
  const nextValue = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
  const totalDelta = nextBlock.length - block.length;
  const nextStart = Math.max(lineStart, start + firstDelta);
  const nextEnd = Math.max(nextStart, end + totalDelta);
  return { nextValue, nextStart, nextEnd };
}

export type MarkdownTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange'
> & {
  value: string;
  onChange: (value: string) => void;
};

/** Textarea with Tab / Shift+Tab indent for Markdown editing. */
export const MarkdownTextarea: React.FC<MarkdownTextareaProps> = ({
  className,
  onKeyDown,
  onChange,
  value,
  ...rest
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented || e.key !== 'Tab') return;

      e.preventDefault();
      const ta = e.currentTarget;
      const { nextValue, nextStart, nextEnd } = applyIndent(
        value,
        ta.selectionStart,
        ta.selectionEnd,
        e.shiftKey
      );
      onChange(nextValue);
      requestAnimationFrame(() => {
        ta.selectionStart = nextStart;
        ta.selectionEnd = nextEnd;
      });
    },
    [onChange, onKeyDown, value]
  );

  return (
    <textarea
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn(className)}
      spellCheck={false}
    />
  );
};
