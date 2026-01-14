import { useState, useCallback } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

// Simple syntax highlighting for Python
function highlightPython(code: string): string {
  const keywords = ['from', 'import', 'def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'await', 'async'];
  const builtins = ['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple'];

  let result = code;

  // Comments
  result = result.replace(/(#.*)$/gm, '<span class="syntax-comment">$1</span>');

  // Strings (triple quotes first, then single/double)
  result = result.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, '<span class="syntax-string">$1</span>');
  result = result.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="syntax-string">$1</span>');

  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="syntax-number">$1</span>');

  // Keywords
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    result = result.replace(regex, '<span class="syntax-keyword">$1</span>');
  });

  // Builtins / function calls
  builtins.forEach(fn => {
    const regex = new RegExp(`\\b(${fn})\\s*\\(`, 'g');
    result = result.replace(regex, '<span class="syntax-function">$1</span>(');
  });

  // Function definitions
  result = result.replace(/\b(def|class)\s+(\w+)/g, '<span class="syntax-keyword">$1</span> <span class="syntax-function">$2</span>');

  // Variable assignments (simple pattern)
  result = result.replace(/^(\s*)(\w+)(\s*=)/gm, '$1<span class="syntax-variable">$2</span>$3');

  return result;
}

export function CodeBlock({ code, language = 'python', showLineNumbers = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code]);

  const highlightedCode = language === 'python' ? highlightPython(code) : code;
  const lines = code.split('\n');

  return (
    <div className="code-block relative rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <span className="text-xs text-[var(--text-muted)] font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="copy-button flex items-center gap-1.5 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          {showLineNumbers ? (
            <code className="flex">
              <span className="select-none text-[var(--text-muted)] pr-4 text-right" style={{ minWidth: '2rem' }}>
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </span>
              <span dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            </code>
          ) : (
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          )}
        </pre>
      </div>
    </div>
  );
}
