/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

// Detect if running outside of Tauri (e.g., plain browser hitting Vite dev server)
const isBrowserPreview = typeof (window as any).__TAURI_IPC__ !== 'function';
import Header from './components/Header';
import ScriptDetailsPanel from './components/ScriptDetailsPanel';
import ScriptControlPanel from './components/ScriptControlPanel';
import ScriptOutputViewer from './components/ScriptOutputViewer';
import DocumentViewer from './components/DocumentViewer';

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

function App() {
  const FILE_WATCH_DEBOUNCE_MS = 800; // increase/decrease to tune file change bursts
  const [selectedScript, setSelectedScript] = useState<string>('');
  const [selectedLabel, setSelectedLabel] = useState<string>('Snyk Report Compare');
  const [scriptMetadata, setScriptMetadata] = useState<ScriptMetadata | null>(null);
  const [output, setOutput] = useState<string>('');
  const [deps, setDeps] = useState<DepStatus[] | null>(null);
  const [envStatus, setEnvStatus] = useState<{
    python_env_status: 'ok' | 'warn' | 'error';
    python_env_message?: string;
    venv_status: 'ok' | 'warn' | 'error';
    venv_message?: string;
  }>({ python_env_status: 'ok', venv_status: 'ok' });
  const [requiredFilesStatus, setRequiredFilesStatus] = useState<{ name: string; exists: boolean }[] | null>(null);
  const [depsChecked, setDepsChecked] = useState<boolean>(false);
  const [isCheckingRequirements, setIsCheckingRequirements] = useState<boolean>(false);
  const setupRan = useRef(false);
  const [docModal, setDocModal] = useState<{ title: string; file: string; content: string } | null>(null);
  const fileWatchUnsub = useRef<null | (() => void)>(null);
  const watchDirRef = useRef<string | undefined>(undefined);
  const debounceTimer = useRef<number | null>(null);
  const didInitialSelect = useRef(false);
  const lastFileCheckSummaryRef = useRef<string | null>(null);
  const scriptStdoutSubRef = useRef<null | (() => void)>(null);
  const scriptExitSubRef = useRef<null | (() => void)>(null);
  // Run status and manual mode
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastExitCode, setLastExitCode] = useState<number | null>(null);
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [manualFiles, setManualFiles] = useState<Record<string, string>>({});
  const [runProgress, setRunProgress] = useState<number>(0);
  const [runProgressLabel, setRunProgressLabel] = useState<string | null>(null);
  // Handler to open documentation modal
  const handleOpenDoc = async (doc: 'readme' | 'guide') => {
    let file = '';
    let title = '';
    
    if (doc === 'readme') {
      file = 'README.md';
      title = 'Script Manager - README';
    } else {
      // Determine which script guide to show based on selected script
      if (selectedLabel === 'DataDome Compare') {
        file = 'DataDome_Compare_Script_User_Guide.md';
        title = 'DataDome Compare Script - User Guide';
      } else {
        // Default to Snyk guide
        file = 'Snyk_Compare_Script_User_Guide.md';
        title = 'Snyk Compare Script - User Guide';
      }
    }
    
    try {
      if (isBrowserPreview) {
        // Load documentation using Vite glob in preview mode
        const docs = import.meta.glob('../Documents/**/*.md', { query: '?raw', import: 'default', eager: true });
        let content: string | undefined;
        if (doc === 'readme') {
          content = docs['../Documents/Main/README.md'] as string | undefined;
        } else if (selectedLabel === 'DataDome Compare') {
          content = docs['../Documents/DataDome Verified Bots Compare/DataDome_Compare_Script_User_Guide.md'] as string | undefined;
        } else {
          content = docs['../Documents/Snyk Report Compare/Snyk_Compare_Script_User_Guide.md'] as string | undefined;
        }
        setDocModal({ title, file, content: content ?? 'Failed to load documentation: not found' });
      } else {
        const content = await invoke<string>('read_documentation_file', {
          doc_path: file,
          docPath: file,
          args: { doc_path: file, docPath: file }
        });
        setDocModal({ title, file, content });
      }
    } catch (err) {
      setDocModal({ title, file, content: 'Failed to load documentation: ' + err });
    }
  };

  // First-run: create venv and install deps if needed, then check status
  useEffect(() => {
    if (setupRan.current) return;
    setupRan.current = true;
    const setup = async () => {
      let setupErrText: string | null = null;
      try {
        setOutput((p) => p + 'Setting up Python environment...\n');
        if (isBrowserPreview) {
          // Simulate successful env setup in preview
          const simulatedDeps: DepStatus[] = [
            { name: 'pandas', installed: true, version: '2.2.2' },
            { name: 'openpyxl', installed: true, version: '3.1.2' },
            { name: 'colorama', installed: true, version: '0.4.6' },
          ];
          setOutput((p) => p + 'Checking dependencies...\n');
          setDeps(simulatedDeps);
          setOutput((p) => p + 'All dependencies installed.\n');
          setEnvStatus({
            python_env_status: 'ok',
            python_env_message: 'Python environment ready',
            venv_status: 'ok',
            venv_message: 'Virtual environment ready',
          });
          setDepsChecked(true);
        } else {
          await invoke<string>('setup_python_env');
          setOutput((p) => p + 'Checking dependencies...\n');
          const statusesJson = await invoke<string>('check_python_deps');
          const statuses: DepStatus[] = JSON.parse(statusesJson);
          setDeps(statuses);
          const missingCount = statuses.filter(s => !s.installed).length;
          const okAll = missingCount === 0;
          setOutput((p) => p + (okAll ? 'All dependencies installed.\n' : 'Some dependencies are missing.\n'));
          setEnvStatus({
            python_env_status: 'ok',
            python_env_message: 'Python environment ready',
            venv_status: okAll ? 'ok' : 'warn',
            venv_message: okAll
              ? 'Virtual environment ready'
              : `Virtual environment ready; ${missingCount} dependenc${missingCount === 1 ? 'y' : 'ies'} missing`,
          });
          setDepsChecked(true);
        }
      } catch (err: any) {
        setupErrText = String(err);
        setOutput((p) => p + `Environment setup failed: ${setupErrText}\n`);
        setEnvStatus({
          python_env_status: 'error',
          python_env_message: `Setup failed: ${setupErrText}`,
          venv_status: 'error',
          venv_message: 'Virtual environment not ready',
        });
        setDepsChecked(true); // deps were attempted/checked even if failing
      }
    };
    setup();
  }, []);

  // When env status changes, merge it into existing metadata so the panel reflects it
  useEffect(() => {
    setScriptMetadata((prev) => (prev ? { ...prev, ...envStatus } : prev));
  }, [envStatus]);

  // Load script metadata when a script is selected
  useEffect(() => {
    if (selectedScript) {
      loadScriptMetadata(selectedScript);
    }
  }, [selectedScript]);

  const loadScriptMetadata = async (scriptPath: string) => {
    try {
      if (isBrowserPreview) {
        // Provide a minimal mock so the UI renders in browser mode
        const isSnyk = scriptPath.includes('snyk');
        const mockWd = isSnyk
          ? 'Snyk Report Compare'
          : scriptPath.includes('datadome')
            ? 'DataDome Verified Bots Compare'
            : '';
        const mockAbsScript = scriptPath;
        const mockDocs = isSnyk
          ? ['README.md', 'Snyk_Compare_Script_User_Guide.md']
          : ['README.md', 'DataDome_Compare_Script_User_Guide.md'];
        const mockReqs = isSnyk
          ? ['Snyk Report CAT YYYY-MM-DD.xlsx', 'Snyk Report CAT YYYY-MM-DD.xlsx', 'Snyk Vulnerability tracker.xlsx']
          : ['DataDome Bots - Block or Whitelist.xlsx', 'DataDome_Export_AI_agents_YYYY-MM-DD.xlsx', 'DataDome_Export_verified_bots_YYYY-MM-DD.xlsx'];
        const mock: ScriptMetadata = {
          script_name: isSnyk ? 'Snyk Report Compare' : 'DataDome Compare',
          file_status: 'Script file exists',
          paths: {
            script: mockAbsScript,
            // In browser preview, we cannot resolve absolute paths; show folder name
            working_dir: mockWd,
          },
          documentation: mockDocs,
          dependencies: ['pandas', 'openpyxl', 'colorama'],
          required_files: mockReqs,
        };
        setScriptMetadata({ ...mock, ...envStatus });
        return; // Skip watcher and backend calls in browser mode
      }

      const metadataJson = await invoke<string>('read_script_metadata', {
        script_path: scriptPath,
        scriptPath: scriptPath,
        args: { script_path: scriptPath, scriptPath }
      });
      const metadata = JSON.parse(metadataJson);
      setScriptMetadata({ ...metadata, ...envStatus });
      const wd = metadata?.paths?.working_dir as string | undefined;
      // Start watching this working directory for changes
      if (wd && wd !== watchDirRef.current) {
        // stop previous
        if (fileWatchUnsub.current) {
          try { fileWatchUnsub.current(); } catch {}
          fileWatchUnsub.current = null;
        }
        // reset last file check summary when directory changes
        lastFileCheckSummaryRef.current = null;
        watchDirRef.current = wd;
        try {
          await invoke<string>('start_file_watch', { dir: wd, dirPath: wd, directory: wd, args: { dir: wd } });
        } catch (e) {
          console.error('Failed to start watch:', e);
        }
        // subscribe to events once
        fileWatchUnsub.current = await listen('files-changed', async (_evt) => {
          // debounce rapid events
          if (debounceTimer.current) {
            window.clearTimeout(debounceTimer.current);
          }
          debounceTimer.current = window.setTimeout(async () => {
            // Use silent file check to avoid spamming output window
            await silentFileCheck(scriptPath, wd);
          }, FILE_WATCH_DEBOUNCE_MS);
        });
      }
    } catch (error) {
      console.error('Failed to load script metadata:', error);
      setOutput(prev => prev + `Error loading metadata: ${error}\n`);
    }
  };

  // Run auto-check only after dependencies have been checked
  useEffect(() => {
    if (!depsChecked || !selectedScript || !scriptMetadata) return;
    const wd = scriptMetadata?.paths?.working_dir as string | undefined;
    (async () => {
      // Use silent file check to avoid spamming output on startup
      await silentFileCheck(selectedScript, wd);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsChecked, selectedScript, scriptMetadata]);

  // Map dropdown labels to concrete script paths in App Way/scripts
  const resolveScriptPath = (label: string): string => {
    // Use a relative path so it works across machines; Tauri backend will receive absolute once resolved by the frontend runtime cwd
    switch (label) {
      case 'Snyk Report Compare':
        return 'scripts/snyk_compare.py';
      case 'DataDome Compare':
        return 'scripts/datadome_compare.py';
      default:
        return '';
    }
  };

  const handleScriptSelect = (label: string) => {
    // Clear output only after the first (initial) selection
    if (didInitialSelect.current) {
      setOutput('');
    } else {
      didInitialSelect.current = true;
    }
    // Reset run state and completion when switching scripts
    setIsRunning(false);
    setLastExitCode(null);
    setRunProgress(0);
    setRunProgressLabel(null);
    setSelectedLabel(label);
    const path = resolveScriptPath(label);
    setSelectedScript(path);
  };

  // Initialize default selection on load
  useEffect(() => {
    handleScriptSelect('Snyk Report Compare');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (fileWatchUnsub.current) {
        try { fileWatchUnsub.current(); } catch {}
        fileWatchUnsub.current = null;
      }
      if (!isBrowserPreview) {
        invoke<string>('stop_file_watch').catch(() => {});
      }
    };
  }, []);

  const handleRunScript = async () => {
    if (!selectedScript) {
      setOutput(prev => prev + 'No script selected\n');
      return;
    }

    try {
      setIsRunning(true);
      setLastExitCode(null);
      setRunProgress(0);
      setRunProgressLabel('Starting...');
      if (isBrowserPreview) {
        // Simulate a short run with output lines and success
        setOutput((p) => p + `Launching script: ${selectedLabel}\n`);
        const simPhases = [
          'Pre-flight Validation',
          'Step 1',
          'Step 2',
          'Step 3',
          'Step 4',
          'Step 5',
          'Step 6',
          'Step 7',
          'Step 8',
          'Complete'
        ];
        for (let i = 0; i < simPhases.length; i++) {
          const phase = simPhases[i];
          const pct = i / (simPhases.length - 1);
          setRunProgress(pct);
          setRunProgressLabel(phase);
          setOutput((p) => p + `${phase}...` + '\n');
        }
        setOutput((p) => p + 'Process exited with code 0\n');
        setLastExitCode(0);
        setRunProgress(1);
        setRunProgressLabel('Complete');
        setIsRunning(false);
      } else {
        const manualList = manualMode
          ? Object.values(manualFiles).filter(Boolean)
          : [];
        const result = await invoke<string>('launch_script', {
          script_path: selectedScript,
          scriptPath: selectedScript,
          args: { script_path: selectedScript, scriptPath: selectedScript, manual_files: manualList }
        });
        setOutput(prev => prev + `${result}\n`);
      }
    } catch (error) {
      setOutput(prev => prev + `Error: ${error}\n`);
      setIsRunning(false);
    }
  };

  const handleBrowseFile = async () => {
    try {
      if (isBrowserPreview) {
        // Toggle between known scripts for preview
        const next = selectedLabel === 'Snyk Report Compare' ? 'DataDome Compare' : 'Snyk Report Compare';
        handleScriptSelect(next);
        setOutput((p) => p + `Selected script: ${resolveScriptPath(next)}\n`);
      } else {
        const filePath = await invoke<string>('browse_file');
        setSelectedScript(filePath);
        setOutput(prev => prev + `Selected script: ${filePath}\n`);
      }
    } catch (error) {
      console.error('File selection cancelled or failed:', error);
    }
  };

  const handleClearOutput = () => {
    setOutput('');
  };

  const handleRepair = async () => {
    try {
      setOutput((p) => p + 'Repairing dependencies...\n');
      if (isBrowserPreview) {
        // Simulate repair success
        const simulatedDeps: DepStatus[] = [
          { name: 'pandas', installed: true, version: '2.2.2' },
          { name: 'openpyxl', installed: true, version: '3.1.2' },
          { name: 'colorama', installed: true, version: '0.4.6' },
        ];
        setDeps(simulatedDeps);
        setOutput((p) => p + 'All dependencies installed.\n');
        setEnvStatus({
          python_env_status: 'ok',
          python_env_message: 'Python environment ready',
          venv_status: 'ok',
          venv_message: 'Virtual environment ready',
        });
      } else {
        await invoke<string>('setup_python_env');
        const statusesJson = await invoke<string>('check_python_deps');
        const statuses: DepStatus[] = JSON.parse(statusesJson);
        setDeps(statuses);
        const missingCount = statuses.filter(s => !s.installed).length;
        const okAll = missingCount === 0;
        setOutput((p) => p + (okAll ? 'All dependencies installed.\n' : 'Some dependencies are missing.\n'));
        setEnvStatus({
          python_env_status: 'ok',
          python_env_message: 'Python environment ready',
          venv_status: okAll ? 'ok' : 'warn',
          venv_message: okAll
            ? 'Virtual environment ready'
            : `Virtual environment ready; ${missingCount} dependenc${missingCount === 1 ? 'y' : 'ies'} missing`,
        });
      }
    } catch (err: any) {
      setOutput((p) => p + `Repair failed: ${err}\n`);
      setEnvStatus({
        python_env_status: 'error',
        python_env_message: `Repair failed: ${String(err)}`,
        venv_status: 'error',
        venv_message: 'Virtual environment not ready',
      });
    }
  };

  // Shared: analyze required files and check their existence, update UI
  const analyzeAndCheckFiles = async (
    scriptPath: string,
    workingDir?: string,
    logPrefix?: string
  ): Promise<{ name: string; exists: boolean }[] | null> => {
    try {
      if (isBrowserPreview) {
        // Skip backend calls; provide a stable, positive state matching each script
        const isSnyk = scriptPath.toLowerCase().includes('snyk');
        const files = isSnyk
          ? [
              { name: 'Snyk Report CAT YYYY-MM-DD.xlsx', exists: true },
              { name: 'Snyk Report CAT YYYY-MM-DD.xlsx', exists: true },
              { name: 'Snyk Vulnerability tracker.xlsx', exists: true },
            ]
          : [
              { name: 'DataDome Bots - Block or Whitelist.xlsx', exists: true },
              { name: 'DataDome_Export_AI_agents_YYYY-MM-DD.xlsx', exists: true },
              { name: 'DataDome_Export_verified_bots_YYYY-MM-DD.xlsx', exists: true },
            ];
        setRequiredFilesStatus(files);
        return files;
      }
      let analyzedFiles: { name: string; path: string }[] = [];
      try {
        const analyzedJson = await invoke<string>('analyze_required_files', {
          script_path: scriptPath,
          scriptPath: scriptPath,
          working_dir: workingDir,
          workingDir: workingDir,
          args: { script_path: scriptPath, scriptPath, working_dir: workingDir, workingDir: workingDir }
        });
        analyzedFiles = JSON.parse(analyzedJson);
        if (analyzedFiles.length) {
          setScriptMetadata((prev) => prev ? { ...prev, required_files: analyzedFiles.map(f => f.name) } : prev);
        }
      } catch (_e) {
        // Ignore analyzer failure and fall back to metadata
      }

      const reqFiles = (analyzedFiles.length ? analyzedFiles.map(f => f.name) : (scriptMetadata?.required_files || []));
      if (!reqFiles.length) {
        setRequiredFilesStatus(null);
        return null;
      }
      const baseDir = workingDir || scriptMetadata?.paths?.working_dir || undefined;
      const filesJson = await invoke<string>('check_required_files', {
        base_dir: baseDir,
        baseDir: baseDir,
        files: reqFiles,
        args: { base_dir: baseDir, baseDir: baseDir, files: reqFiles }
      });
      const files: { name: string; exists: boolean }[] = JSON.parse(filesJson);
      setRequiredFilesStatus(files);
      const missing = files.filter(f => !f.exists);
      // Build a stable summary and only log on change to prevent spam
      const summary = missing.length
        ? `Missing files: ${missing.map(m => m.name).sort((a,b)=>a.localeCompare(b)).join(', ')}`
        : 'All required files found.';
      if (logPrefix && logPrefix !== undefined && lastFileCheckSummaryRef.current !== summary) {
        setOutput((p) => p + `${logPrefix}${summary}\n`);
        lastFileCheckSummaryRef.current = summary;
      } else if (logPrefix === undefined) {
        // Don't log or update lastFileCheckSummaryRef when called from manual check
      } else if (!logPrefix) {
        lastFileCheckSummaryRef.current = summary;
      }
      return files;
    } catch (err: any) {
      if (logPrefix) setOutput((p) => p + `${logPrefix}File check failed: ${String(err)}\n`);
      return null;
    }
  };

  // Silent file check for file watcher - only updates info panel, no output logging
  const silentFileCheck = async (
    scriptPath: string,
    workingDir?: string
  ): Promise<{ name: string; exists: boolean }[] | null> => {
    try {
      if (isBrowserPreview) {
        const isSnyk = scriptPath.toLowerCase().includes('snyk');
        const files = isSnyk
          ? [
              { name: 'Snyk Report CAT YYYY-MM-DD.xlsx', exists: true },
              { name: 'Snyk Report CAT YYYY-MM-DD.xlsx', exists: true },
              { name: 'Snyk Vulnerability tracker.xlsx', exists: true },
            ]
          : [
              { name: 'DataDome Bots - Block or Whitelist.xlsx', exists: true },
              { name: 'DataDome_Export_AI_agents_YYYY-MM-DD.xlsx', exists: true },
              { name: 'DataDome_Export_verified_bots_YYYY-MM-DD.xlsx', exists: true },
            ];
        setRequiredFilesStatus(files);
        return files;
      }
      let analyzedFiles: { name: string; path: string }[] = [];
      try {
        const analyzedJson = await invoke<string>('analyze_required_files', {
          script_path: scriptPath,
          scriptPath: scriptPath,
          working_dir: workingDir,
          workingDir: workingDir,
          args: { script_path: scriptPath, scriptPath, working_dir: workingDir, workingDir: workingDir }
        });
        analyzedFiles = JSON.parse(analyzedJson);
        if (analyzedFiles.length) {
          setScriptMetadata((prev) => prev ? { ...prev, required_files: analyzedFiles.map(f => f.name) } : prev);
        }
      } catch (_e) {
        // Ignore analyzer failure and fall back to metadata
      }

      const reqFiles = (analyzedFiles.length ? analyzedFiles.map(f => f.name) : (scriptMetadata?.required_files || []));
      if (!reqFiles.length) {
        setRequiredFilesStatus(null);
        return null;
      }
      const baseDir = workingDir || scriptMetadata?.paths?.working_dir || undefined;
      const filesJson = await invoke<string>('check_required_files', {
        base_dir: baseDir,
        baseDir: baseDir,
        files: reqFiles,
        args: { base_dir: baseDir, baseDir: baseDir, files: reqFiles }
      });
      const files: { name: string; exists: boolean }[] = JSON.parse(filesJson);
      setRequiredFilesStatus(files);
      return files;
    } catch (err: any) {
      // Silent failure - no output logging
      return null;
    }
  };

  // Subscribe to script output events once
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (!scriptStdoutSubRef.current) {
          scriptStdoutSubRef.current = await listen('script-output', (evt: any) => {
            if (!isMounted) return;
            try {
              const payload = evt.payload as { line?: string; source?: string };
              if (payload?.line) {
                const src = (payload.source || '').toLowerCase();
                const line = payload.line;
                if (src === 'stderr') {
                  // tag stderr so the viewer can color it differently
                  setOutput((p) => p + `[stderr] ${line}\n`);
                } else {
                  setOutput((p) => p + line + '\n');
                  // Progress parsing tied to Snyk script output step markers
                  try {
                    if (selectedLabel === 'Snyk Report Compare') {
                      const patterns: { label: string; re: RegExp }[] = [
                        { label: 'Pre-flight Validation', re: /Pre[-\s]?flight\s+Validation/i },
                        { label: 'Step 1', re: /-+\s*Step\s*1\s*:/i },
                        { label: 'Step 2', re: /-+\s*Step\s*2\s*:/i },
                        { label: 'Step 3', re: /-+\s*Step\s*3\s*:/i },
                        { label: 'Step 4', re: /-+\s*Step\s*4\s*:/i },
                        { label: 'Step 5', re: /-+\s*Step\s*5\s*:/i },
                        { label: 'Step 6', re: /-+\s*Step\s*6\s*:/i },
                        { label: 'Step 7', re: /-+\s*Step\s*7\s*:/i },
                        { label: 'Step 7b', re: /-+\s*Step\s*7\s*b\s*:/i },
                        { label: 'Step 8', re: /-+\s*Step\s*8\s*:/i },
                        { label: 'Complete', re: /PROCESS\s+COMPLETE/i },
                      ];
                      const idx = patterns.findIndex(p => p.re.test(line));
                      if (idx >= 0) {
                        const pct = idx / (patterns.length - 1);
                        setRunProgress((prev) => pct > prev ? pct : prev);
                        setRunProgressLabel(patterns[idx].label);
                      }
                    }
                  } catch { /* ignore progress parse errors */ }
                }
              }
            } catch { /* ignore */ }
          });
        }
        if (!scriptExitSubRef.current) {
          scriptExitSubRef.current = await listen('script-exit', (evt: any) => {
            if (!isMounted) return;
            try {
              const payload = evt.payload as { code?: number | null };
              const codeText = (payload && 'code' in payload) ? String(payload.code) : 'unknown';
              setOutput((p) => p + `Process exited with code ${codeText}\n`);
              const codeNum = payload && typeof payload.code === 'number' ? payload.code : null;
              setLastExitCode(codeNum);
              if (codeNum === 0) {
                setRunProgress(1);
                setRunProgressLabel('Complete');
              }
              setIsRunning(false);
            } catch {
              setOutput((p) => p + 'Process exited\n');
              setLastExitCode(null);
              setIsRunning(false);
            }
          });
        }
      } catch {
        // no-op
      }
    })();
    return () => {
      isMounted = false;
      if (scriptStdoutSubRef.current) { try { scriptStdoutSubRef.current(); } catch {} scriptStdoutSubRef.current = null; }
      if (scriptExitSubRef.current) { try { scriptExitSubRef.current(); } catch {} scriptExitSubRef.current = null; }
    };
  }, []);

  const handleCheckRequirements = async () => {
    // Prevent spam-clicking by ignoring if already checking
    if (isCheckingRequirements) return;
    
    try {
      setIsCheckingRequirements(true);
      setOutput('Checking requirements (files + dependencies)...\n');
      
      // Clear any pending file watch debounce to avoid interference
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      
      let statuses: DepStatus[];
      if (isBrowserPreview) {
        statuses = [
          { name: 'pandas', installed: true, version: '2.2.2' },
          { name: 'openpyxl', installed: true, version: '3.1.2' },
          { name: 'colorama', installed: true, version: '0.4.6' },
        ];
      } else {
        const statusesJson = await invoke<string>('check_python_deps');
        statuses = JSON.parse(statusesJson);
      }
      setDeps(statuses);
      const missingDeps = statuses.filter(s => !s.installed);
      
      // Analyze + check required files (shared) - suppress internal logging since we handle it manually
      const scriptPath = selectedScript || scriptMetadata?.paths?.script || '';
      const baseDir = scriptMetadata?.paths?.working_dir || undefined;
      const filesStatus = await analyzeAndCheckFiles(scriptPath, baseDir, undefined);
      const okAll = missingDeps.length === 0;
      setEnvStatus((prev) => ({
        python_env_status: prev.python_env_status ?? (okAll ? 'ok' : 'warn'),
        python_env_message: prev.python_env_message ?? 'Python environment ready',
        venv_status: okAll ? 'ok' : 'warn',
        venv_message: okAll
          ? 'Virtual environment ready'
          : `Virtual environment ready; ${missingDeps.length} dependenc${missingDeps.length === 1 ? 'y' : 'ies'} missing`,
      }));
      if (missingDeps.length === 0 && (!filesStatus || filesStatus.length === 0 || filesStatus.every(f => f.exists))) {
        setOutput((p) => p + 'All good: dependencies and required files are satisfied.\n');
      } else {
        if (missingDeps.length) {
          setOutput((p) => p + `Missing dependencies: ${missingDeps.map(d => d.name).join(', ')}\n`);
        }
        if (filesStatus) {
          const missingFiles = filesStatus.filter(f => !f.exists);
          if (missingFiles.length) {
            setOutput((p) => p + `Missing files: ${missingFiles.map(f => f.name).join(', ')}\n`);
          }
        }
      }
    } catch (err: any) {
      setOutput((p) => p + `Check failed: ${String(err)}\n`);
      setEnvStatus({
        python_env_status: 'error',
        python_env_message: `Check failed: ${String(err)}`,
        venv_status: 'error',
        venv_message: 'Virtual environment not ready',
      });
    } finally {
      setIsCheckingRequirements(false);
    }
  };

  // Manual mode handlers
  const handleToggleManualMode = (enabled: boolean) => {
    setManualMode(enabled);
    // Reset manual selections when toggled off
    if (!enabled) {
      setManualFiles({});
    }
  };

  const handleSelectInputFile = async (name: string) => {
    try {
      if (isBrowserPreview) {
        // Simulate a selected path
        const fakePath = `/path/to/${name.replace(/\s+/g, '_')}.xlsx`;
        setManualFiles((prev) => ({ ...prev, [name]: fakePath }));
        setOutput((p) => p + `Selected input for '${name}': ${fakePath}\n`);
      } else {
        const path = await invoke<string>('browse_input_file');
        setManualFiles((prev) => ({ ...prev, [name]: path }));
        setOutput((p) => p + `Selected input for '${name}': ${path}\n`);
      }
    } catch (e) {
      // user cancelled
    }
  };

  return (
    <div className="h-screen flex flex-col bg-app-dark text-app-text">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Script Details */}
        <div className="w-80 panel panel-border border-r">
          <ScriptDetailsPanel metadata={scriptMetadata} deps={deps || undefined} requiredFilesStatus={requiredFilesStatus || undefined} manualMode={manualMode} />
        </div>
        
        {/* Right Panel - Main Content */}
        <div className="flex-1 min-h-0 flex flex-col bg-app-darker">
          <ScriptControlPanel
            selectedScript={selectedScript}
            onScriptSelect={handleScriptSelect}
            onResetPanel={() => {
              // Reset to initial UI state for current script
              setOutput('');
              setIsRunning(false);
              setLastExitCode(null);
              setRunProgress(0);
              setRunProgressLabel(null);
              setManualMode(false);
              setManualFiles({});
              setRequiredFilesStatus(null);
              setDocModal(null);
            }}
            onRunScript={handleRunScript}
            onBrowseFile={handleBrowseFile}
            onRepair={handleRepair}
            onOpenReadme={() => handleOpenDoc('readme')}
            onOpenUserGuide={() => handleOpenDoc('guide')}
            onCheckRequirements={handleCheckRequirements}
            isCheckingRequirements={isCheckingRequirements}
            deps={deps}
            requiredFilesStatus={requiredFilesStatus}
            isRunning={isRunning}
            lastExitCode={lastExitCode ?? undefined}
            runProgress={runProgress}
            runProgressLabel={runProgressLabel}
            manualMode={manualMode}
            requiredFileNames={scriptMetadata?.required_files}
            manualFiles={manualFiles}
            onToggleManualMode={handleToggleManualMode}
            onSelectInputFile={handleSelectInputFile}
          />
          
          <ScriptOutputViewer
            output={output}
            onClearOutput={handleClearOutput}
          />
          {docModal && (
            <DocumentViewer
              title={docModal.title}
              content={docModal.content}
              fileName={docModal.file}
              onClose={() => setDocModal(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;