import React, { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
const isBrowserPreview = typeof (window as any).__TAURI_IPC__ !== 'function';
// prefer backend for path existence due to runtime cwd and sandbox differences

interface ScriptMetadata {
  script_name: string;
  file_status: string;
  paths: {
    script: string;
    working_dir: string;
  };
  documentation: string[];
  dependencies: string[];
  required_files: string[];
  python_env_status?: 'ok' | 'warn' | 'error';
  python_env_message?: string;
  venv_status?: 'ok' | 'warn' | 'error';
  venv_message?: string;
}

interface DepStatus {
  name: string;
  requirement?: string;
  installed: boolean;
  version?: string | null;
  error?: string | null;
}

interface ScriptDetailsPanelProps {
  metadata: ScriptMetadata | null;
  deps?: DepStatus[]; // optional dependency status to render
  requiredFilesStatus?: { name: string; exists: boolean }[];
}

const ScriptDetailsPanel: React.FC<ScriptDetailsPanelProps> = ({ metadata, deps, requiredFilesStatus }) => {
  // Render helpers
  const shortenPath = (input?: string): string => {
    if (!input) return '';
    // Normalize separators to '/'
    let s = input.replace(/\\/g, '/');
    // Collapse home directory to '~' (macOS/Linux)
    s = s.replace(/^\/Users\/[^/]+/, '~');
    // Collapse Windows-style home (e.g., C:/Users/Name)
    s = s.replace(/^[A-Za-z]:\/Users\/[^/]+/i, '~');

    // If short enough, return as-is
    if (s.length <= 40) return s;

    const parts = s.split('/').filter(Boolean);
    const hasTilde = s.startsWith('~');
    const hasRoot = s.startsWith('/');
    const prefix = hasTilde ? '~' : hasRoot ? '/' : '';
    if (parts.length <= 2) return s; // nothing to collapse

    const tail = parts.slice(-2).join('/');
    return `${prefix}…/${tail}`;
  };

  const CheckIcon = () => (
    <svg className="w-4 h-4 text-app-success mr-2" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
  const CrossIcon = () => (
    <svg className="w-4 h-4 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.415L11.414 10l4.95 4.95a1 1 0 11-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10 3.636 5.05A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" />
    </svg>
  );

  const depsToShow: DepStatus[] | null = deps || null;
  const missingFilesSet = new Set((requiredFilesStatus || []).filter(f => !f.exists).map(f => f.name));

  // Map env status to dot color
  const getStatusClasses = (status?: 'ok' | 'warn' | 'error') => {
    return status === 'error' ? 'bg-red-500' : status === 'warn' ? 'bg-yellow-400' : 'bg-app-success';
  };

  // Local state for reveal button enablement and errors
  const workingDir = metadata?.paths?.working_dir || '';
  const [canReveal, setCanReveal] = useState<boolean>(false);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealInfo, setRevealInfo] = useState<string | null>(null);
  const [opening, setOpening] = useState<boolean>(false);

  // Determine if we should even try (only when workingDir is a non-empty string)
  const hasWorkingDir = useMemo(() => Boolean(workingDir && workingDir.trim().length > 0), [workingDir]);

  useEffect(() => {
    let cancelled = false;
    setRevealError(null);
    if (!hasWorkingDir) {
      setCanReveal(false);
      return;
    }
    if (isBrowserPreview) {
      // In browser preview, assume the mocked working dir is present
      setCanReveal(true);
    } else {
      // Check existence via backend (handles absolute/relative paths reliably)
      invoke<boolean>('path_exists', { path: workingDir })
        .then((ok) => { if (!cancelled) setCanReveal(Boolean(ok)); })
        .catch(() => { if (!cancelled) setCanReveal(false); });
    }
    return () => {
      cancelled = true;
    };
  }, [hasWorkingDir, workingDir]);

  // Auto clear error tooltip after a short delay
  useEffect(() => {
    if (!revealError) return;
    const t = setTimeout(() => setRevealError(null), 2500);
    return () => clearTimeout(t);
  }, [revealError]);

  useEffect(() => {
    if (!revealInfo) return;
    const t = setTimeout(() => setRevealInfo(null), 2000);
    return () => clearTimeout(t);
  }, [revealInfo]);

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-app-text mb-4">Snyk Report Compare</h2>
        {/* Script Information */}
        <div className="space-y-3 mb-4">
          {/* Script Info */}
          <div className="mb-4">
            <div className="text-sm font-medium text-app-text mb-2">Script Info:</div>
            <div className="flex items-center justify-between px-3 py-1">
              <div className="flex items-center">
                <CheckIcon />
                <span className="text-xs text-app-text ml-2">{metadata?.script_name || 'Snyk Report Compare'}</span>
              </div>
              <div className="flex items-center text-[11px] text-app-text-secondary">
                <span className="w-2 h-2 bg-app-success rounded-full mr-2"></span>
                <span>{metadata?.file_status || 'Script file exists'}</span>
              </div>
            </div>
          </div>
          {/* Paths */}
          <div className="mb-4">
            <div className="text-sm font-medium text-app-text mb-2">Paths:</div>
            <div className="space-y-1">
              <div className="flex items-center px-3 py-1">
                <span className="text-xs text-app-text-secondary ml-2" title={metadata?.paths?.script || ''}>- Script: {shortenPath(metadata?.paths?.script)}</span>
              </div>
              <div className="flex items-center px-3 py-1">
                <span className="text-xs text-app-text-secondary ml-2" title={metadata?.paths?.working_dir || ''}>- Working Dir: {shortenPath(metadata?.paths?.working_dir)}</span>
                {hasWorkingDir ? (
                  <button
                    onClick={async () => {
                      if (!canReveal || opening) return;
                      setOpening(true);
                      try {
                        if (isBrowserPreview) {
                          // No-op reveal in browser; just show info
                          setRevealInfo('Preview mode: cannot open Finder');
                        } else {
                          const result = await invoke<string>('reveal_path', { path: workingDir });
                          if (result === 'opened_parent') {
                            setRevealInfo('Opened parent folder');
                          }
                        }
                      } catch (e: any) {
                        const msg = typeof e === 'string' ? e : (e?.message || 'Failed to reveal path');
                        setRevealError(msg);
                      } finally {
                        setOpening(false);
                      }
                    }}
                    className={`ml-2 text-app-text-muted transition-colors ${canReveal ? 'hover:text-app-text' : 'opacity-40 cursor-not-allowed'}`}
                    disabled={!canReveal || opening}
                    title={canReveal ? 'Reveal in Finder/Explorer' : (hasWorkingDir ? 'Path not found' : 'Path missing')}
                    aria-label="Reveal working directory"
                  >
                    {opening ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h3l1 1h7a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    )}
                  </button>
                ) : null}
                {revealError ? (
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    {revealError}
                  </span>
                ) : null}
                {revealInfo ? (
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {revealInfo}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {/* Documentation */}
          <div className="mb-4">
            <div className="text-sm font-medium text-app-text mb-2">Documentation:</div>
            <div className="space-y-1">
              {(metadata?.documentation || ['README.txt', 'Snyk_Compare_Script_User_Guide.txt']).map((doc, index) => (
                <div key={index} className="flex items-center px-3 py-1">
                  <CheckIcon />
                  <span className="text-xs text-app-text-secondary ml-2">{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Environment */}
          <div className="mb-4">
            <div className="text-sm font-medium text-app-text mb-2">Environment:</div>
            <div className="flex items-center px-3 py-1 space-x-6">
              <div className="flex items-center" title={metadata?.python_env_message || 'Python environment ready'}>
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusClasses(metadata?.python_env_status)}`}></div>
                <span className="text-xs text-app-text-secondary">Python Environment</span>
              </div>
              <div className="flex items-center" title={metadata?.venv_message || 'Virtual environment ready'}>
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusClasses(metadata?.venv_status)}`}></div>
                <span className="text-xs text-app-text-secondary">Virtual Environment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dependencies Section (no highlight, aligned) */}
        <div className="mt-4">
          <div className="text-sm font-medium text-app-text mb-2">Dependencies:</div>
          <div className="space-y-1">
            {depsToShow ? (
              depsToShow.map((d) => (
                <div key={d.name} className="flex items-center justify-between px-3 py-1">
                  <div className="flex items-center">
                    {d.installed ? <CheckIcon /> : <CrossIcon />}
                    <span className="text-xs text-app-text ml-2">{d.name}</span>
                    {d.version ? <span className="ml-2 text-[10px] text-app-text-secondary">v{d.version}</span> : null}
                  </div>
                  <div className="text-[10px] text-app-text-secondary whitespace-nowrap text-right">{d.requirement || ''}</div>
                </div>
              ))
            ) : (
              (metadata?.dependencies || ['pandas', 'openpyxl', 'colorama']).map((dep, index) => (
                <div key={index} className="flex items-center px-3 py-1">
                  <CheckIcon />
                  <span className="text-xs text-app-text-secondary ml-2">{dep}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Required Files Section */}
        <div className="mt-4">
          <div className="text-sm font-medium text-app-text mb-2">Required Files:</div>
          <div className="space-y-1">
            {(metadata?.required_files && metadata.required_files.length > 0) ? (
              metadata.required_files.map((file, index) => {
                const missing = missingFilesSet.has(file);
                return (
                  <div key={index} className={`flex items-center px-3 py-1 ${missing ? 'text-red-400' : ''}`} title={missing ? 'File not found' : undefined}>
                    {missing ? <CrossIcon /> : <CheckIcon />}
                    <span className={`text-xs ml-2 ${missing ? 'text-red-400' : 'text-app-text-secondary'}`}>{file}</span>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center px-3 py-1">
                <span className="text-xs text-app-text-secondary">Analyzing required files…</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptDetailsPanel;