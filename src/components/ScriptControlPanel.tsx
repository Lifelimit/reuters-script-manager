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
  requiredFilesStatus
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
    <div className="p-6 bg-app-darker border-b border-app-border">
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
            disabled={!selectedScript && dropdownValue === 'Snyk Report Compare' || !requirementsMet}
            className={`w-full text-lg py-3 flex items-center justify-center space-x-2 disabled:cursor-not-allowed transition-colors duration-200 rounded-md font-medium ${
              !requirementsMet 
                ? 'bg-red-600 text-white opacity-75' 
                : 'button-primary hover:bg-blue-700'
            }`}
            title={!requirementsMet ? "Requirements not met - please check dependencies and required files" : "Run the selected script using the managed Python environment"}
          >
            {!requirementsMet ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Requirements Not Met</span>
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

      {/* Removed Selected Script panel for cleaner UI */}
    </div>
  );
};

export default ScriptControlPanel;