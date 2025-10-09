import React, { useState } from 'react';

interface RequiredFileStatus {
  name: string;
  exists: boolean;
}

interface Dependency {
  name: string;
  installed: boolean;
}

interface ScriptControlPanelProps {
  selectedScript: string;
  onScriptSelect: (script: string) => void;
  onRunScript: () => void;
  onBrowseFile: () => void;
  onRepair?: () => void; // new optional repair action
  onOpenReadme?: () => void;
  onOpenUserGuide?: () => void;
  onCheckRequirements?: () => void;
  isCheckingRequirements?: boolean;
  deps: Dependency[] | null;
  requiredFilesStatus: RequiredFileStatus[] | null;
  // New props for banners and manual mode
  isRunning?: boolean;
  lastExitCode?: number;
  manualMode?: boolean;
  requiredFileNames?: string[] | undefined;
  manualFiles?: Record<string, string>;
  onToggleManualMode?: (enabled: boolean) => void;
  onSelectInputFile?: (name: string) => void;
}

const ScriptControlPanel: React.FC<ScriptControlPanelProps> = ({
  selectedScript,
  onScriptSelect,
  onRunScript,
  onBrowseFile,
  onRepair,
  onOpenReadme,
  onOpenUserGuide,
  onCheckRequirements,
  isCheckingRequirements = false,
  deps,
  requiredFilesStatus,
  isRunning = false,
  lastExitCode,
  manualMode = false,
  requiredFileNames,
  manualFiles = {},
  onToggleManualMode,
  onSelectInputFile
}) => {
  const [dropdownValue, setDropdownValue] = useState('Snyk Report Compare');

  // Check if all requirements are met
  const allRequirementsMet = () => {
    if (!deps || !requiredFilesStatus) return false;
    
    // Check if all dependencies are installed
    const allDepsInstalled = deps.every(dep => dep.installed);
    
    // Check if all required files exist
    const allFilesExist = requiredFilesStatus.every(file => file.exists);
    
    return allDepsInstalled && allFilesExist;
  };

  const requirementsMet = allRequirementsMet();

  // Manual mode gating: require selections for each required file name
  const manualSelectionsComplete = manualMode
    ? (requiredFileNames && requiredFileNames.length > 0
        ? requiredFileNames.every((n) => manualFiles && !!manualFiles[n])
        : true)
    : true;

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDropdownValue(value);
    onScriptSelect(value);
  };

  const handleRefresh = () => {
    // Placeholder for refresh functionality
    console.log('Refresh clicked');
  };

  return (
    <div className="topbar">
      {/* Status Banners */}
      {isRunning && (
        <div className="mb-4 p-3 rounded-md border border-blue-600 bg-blue-900 text-blue-100 flex items-center space-x-2">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="font-medium">Running...</span>
        </div>
      )}
      {!isRunning && typeof lastExitCode !== 'undefined' && lastExitCode === 0 && (
        <div className="mb-4 p-3 rounded-md border border-green-600 bg-green-900 text-green-100 flex items-center space-x-2">
          <span>✅ Completed successfully</span>
        </div>
      )}
      {!isRunning && typeof lastExitCode !== 'undefined' && lastExitCode !== null && lastExitCode !== 0 && (
        <div className="mb-4 p-3 rounded-md border border-red-600 bg-red-900 text-red-100 flex items-center space-x-2">
          <span>❌ Exited with code {lastExitCode}</span>
        </div>
      )}

      {/* Script Selector Section */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-app-text">Script:</label>
          <div className="flex-1 flex items-center space-x-3">
            <select 
              value={dropdownValue}
              onChange={handleDropdownChange}
              className="flex-1 select-field"
            >
              <option value="Snyk Report Compare">Snyk Report Compare</option>
              <option value="DataDome Compare">DataDome Compare</option>
            </select>
            <button
              onClick={onBrowseFile}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              title="Select a Python script from your filesystem"
            >
              📁 Browse
            </button>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              title="Reload the selection and refresh panel data"
            >
              🔄 Refresh
            </button>
            {onRepair && (
              <button
                onClick={onRepair}
                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                title="Fix Python environment issues by recreating .venv and reinstalling dependencies"
              >
                🛠️ Repair
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-app-text">Actions</span>
        </div>
        <div className="space-y-3">
          <button
            onClick={onRunScript}
            disabled={isRunning || (!requirementsMet && !manualMode) || !manualSelectionsComplete}
            className={`w-full text-lg py-3 flex items-center justify-center space-x-2 disabled:cursor-not-allowed transition-colors duration-200 rounded-md font-medium ${
              isRunning
                ? 'bg-blue-700 text-white opacity-80'
                : (!requirementsMet && !manualMode
                    ? 'bg-red-600 text-white opacity-75'
                    : 'button-primary hover:bg-blue-700')
            }`}
            title={
              isRunning
                ? 'Script is currently running'
                : (!requirementsMet && !manualMode
                    ? 'Requirements not met - please check dependencies and required files'
                    : (manualMode && !manualSelectionsComplete
                        ? 'Please select all required input files'
                        : 'Run the selected script using the managed Python environment'))
            }
          >
            {isRunning ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span>Running...</span>
              </>
            ) : (!requirementsMet && !manualMode) ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Requirements Not Met</span>
              </>
            ) : (manualMode && !manualSelectionsComplete) ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 9h6v2H7V9z" clipRule="evenodd" />
                </svg>
                <span>Select All Inputs</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Run Script</span>
              </>
            )}
          </button>
          <div className="grid grid-cols-3 gap-3">
            <button className="button-secondary text-sm py-2 px-3" onClick={onOpenReadme} title="Open the README in a quick viewer">📄 README</button>
            <button className="button-secondary text-sm py-2 px-3" onClick={onOpenUserGuide} title="Open the User Guide in a quick viewer">📚 User Guide</button>
            <button 
              className={`button-secondary text-sm py-2 px-3 ${isCheckingRequirements ? 'opacity-50 cursor-not-allowed' : ''}`} 
              title="Check for required input files and dependencies" 
              onClick={onCheckRequirements}
              disabled={isCheckingRequirements}
            >
              {isCheckingRequirements ? '🔄 Checking...' : '🔍 Check Requirements'}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Mode Section */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium text-app-text">Manual Mode</span>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600"
              checked={manualMode}
              onChange={(e) => onToggleManualMode && onToggleManualMode(e.target.checked)}
            />
            <span className="ml-2 text-xs text-app-muted">Select required input files manually before running</span>
          </label>
        </div>
        {manualMode && requiredFileNames && requiredFileNames.length > 0 && (
          <div className="space-y-2">
            {requiredFileNames.map((name) => {
              const selected = manualFiles && manualFiles[name];
              return (
                <div key={name} className="flex items-center justify-between bg-app-darker p-2 rounded-md border border-app-border">
                  <div className="flex-1">
                    <div className="text-xs text-app-muted">Required:</div>
                    <div className="text-sm text-app-text truncate" title={name}>{name}</div>
                    {selected && (
                      <div className="text-xs text-green-300 truncate" title={selected}>Selected: {selected}</div>
                    )}
                  </div>
                  <div>
                    <button
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                      onClick={() => onSelectInputFile && onSelectInputFile(name)}
                      title={`Choose file for ${name}`}
                    >
                      📁 Choose File
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Removed Selected Script panel for cleaner UI */}
    </div>
  );
};

export default ScriptControlPanel;