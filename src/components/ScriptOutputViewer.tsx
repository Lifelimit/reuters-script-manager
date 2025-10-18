import React, { useEffect, useLayoutEffect, useRef } from 'react';

interface ScriptOutputViewerProps {
  output: string;
  onClearOutput: () => void;
}

const ScriptOutputViewer: React.FC<ScriptOutputViewerProps> = ({ output, onClearOutput }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new output arrives
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll after layout updates to ensure scrollHeight is accurate
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      if (endRef.current) {
        endRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    });
  }, [output]);
  // Replace textarea with styled line-by-line viewer to allow highlighting
  const renderOutput = () => {
    const lines = (output || '').split('\n');
    // Track context to style section lines (e.g., missing files for DataDome)
    let currentScript: 'datadome' | 'snyk' | 'other' | null = null;
    let inMissingSection = false;
    return (
      <div className="w-full p-4 bg-transparent text-app-text font-mono text-sm whitespace-pre-wrap" style={{fontFamily: 'Consolas, Monaco, "Courier New", monospace', lineHeight: '1.5'}}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Update script context when analyzer header appears
          const analyzingMatch = /^Analyzing required files for\s+(.+?)\.\.\./i.exec(trimmed);
          if (analyzingMatch) {
            const scriptTitle = analyzingMatch[1].toLowerCase();
            if (scriptTitle.includes('datadome')) currentScript = 'datadome';
            else if (scriptTitle.includes('snyk')) currentScript = 'snyk';
            else currentScript = 'other';
            inMissingSection = false; // reset on new header
          }
          // Enter/exit missing section
          if (/^Missing files:/i.test(trimmed)) inMissingSection = true;
          if (/^Present files:/i.test(trimmed) || /^All required files found\./i.test(trimmed) || trimmed.length === 0) {
            inMissingSection = false;
          }

          const isStderr = trimmed.startsWith('[stderr] ');
          const isStep = /^->\s/.test(trimmed);
          const isSuccess = /(^|\b)(✓|success|completed|done)\b/i.test(trimmed) || /✓/.test(line);
          const isWarning = /(^|\b)(warning|warn|caution)\b/i.test(trimmed);
          const isError = /(^|\b)(error|failed|\u2717)\b/i.test(trimmed);
          const isMissing = /(^|\b)missing(s)?\b/i.test(trimmed) || /^Missing\s/i.test(trimmed);
          const isBullet = /^[\s\t]*[-•]/.test(trimmed) || /^[\s\t]*✓/.test(trimmed);
          // Any bullet under a "Missing files:" section should be red (applies to Check Requirements and analyzer output)
          const isMissingBullet = inMissingSection && isBullet && !/^✓/.test(trimmed);

          let className = '';
          if (isStderr || isError || isMissing || isMissingBullet) className = 'text-red-400';
          else if (isWarning) className = 'text-yellow-300';
          else if (isSuccess) className = 'text-green-400';
          else if (isStep) className = 'text-cyan-300';
          return (
            <div key={idx} className={className}>
              {line.length > 0 ? line : '\u00A0'}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-app-text-muted" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a1 1 0 000 2h12a1 1 0 100-2H4zm0 5a1 1 0 000 2h12a1 1 0 100-2H4zm0 5a1 1 0 000 2h12a1 1 0 100-2H4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-app-text">Output</span>
        </div>
        
        <button
          onClick={onClearOutput}
          className="text-sm text-app-text-muted hover:text-app-text transition-colors duration-200 flex items-center space-x-1"
          title="Clear the output log"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Clear Output</span>
        </button>
      </div>

      {/* Output Area */}
      <div className="flex-1 min-h-0 panel panel-rounded">
        <div ref={scrollerRef} className="h-full overflow-y-auto">
          {renderOutput()}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mt-3 text-xs text-app-text-muted">
        <div className="flex items-center space-x-4">
          <span>Lines: {output.split('\n').length}</span>
          <span>Characters: {output.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-app-success rounded-full"></div>
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
};

export default ScriptOutputViewer;