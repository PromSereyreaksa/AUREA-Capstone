import React from 'react';

interface ModeSelectionProps {
  selectedMode: 'project-based' | 'hourly' | null;
  onModeSelect: (mode: 'project-based' | 'hourly') => void;
}

// Calculator Icon for Base Rate estimation
const BaseRateIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FB8500" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <path d="M9 12h6"/>
  </svg>
);

// Project Icon for Project-based estimation
const ProjectIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FB8500" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

export const ModeSelection: React.FC<ModeSelectionProps> = ({
  selectedMode,
  onModeSelect
}) => {
  const handleModeClick = (mode: 'project-based' | 'hourly') => {
    // Automatically proceed when any mode is selected
    onModeSelect(mode);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="fee-estimator-header">
        <h1 className="fee-estimator-title">Fee Estimation Options</h1>
        <p className="fee-estimator-subtitle">
          Please select one option of the estimation
        </p>
      </div>

      <div className="fee-estimator-body">
      <div className="mode-selection-container">
        {/* Base Rate Estimation Card */}
        <div 
          className={`mode-card ${selectedMode === 'hourly' ? 'selected' : ''}`}
          onClick={() => handleModeClick('hourly')}
        >
          <div className="mode-card-header">
            <h3 className="mode-card-title">Base Rate Calculation</h3>
          </div>
          <div className="mode-card-content">
            <div className="mode-card-icon">
              <BaseRateIcon />
            </div>
            <p className="mode-card-description">
              Calculate your hourly rate.
            </p>
          </div>
        </div>

        {/* Project Based Estimation Card */}
        <div 
          className={`mode-card ${selectedMode === 'project-based' ? 'selected' : ''}`}
          onClick={() => handleModeClick('project-based')}
        >
          <div className="mode-card-header">
            <h3 className="mode-card-title">Project Based Calculator</h3>
          </div>
          <div className="mode-card-content">
            <div className="mode-card-icon">
              <ProjectIcon />
            </div>
            <p className="mode-card-description">
              Calculate the project's cost.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};