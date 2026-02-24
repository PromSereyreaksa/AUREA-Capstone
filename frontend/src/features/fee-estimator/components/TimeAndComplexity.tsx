import React from 'react';
import type { TimeComplexity as TimeComplexityType } from '../types';

interface TimeAndComplexityProps {
  timeComplexity: TimeComplexityType;
  onUpdate: (timeComplexity: Partial<TimeComplexityType>) => void;
  onNext: () => void;
  onBack: () => void;
}

const difficultyOptions = [
  { value: 'easy', label: 'Easy', multiplier: 1 },
  { value: 'medium', label: 'Medium', multiplier: 1.5 },
  { value: 'hard', label: 'Hard', multiplier: 2 },
  { value: 'complex', label: 'Complex', multiplier: 2.5 }
] as const;

const commercialRightsOptions = [
  { value: 'personal', label: 'Personal Use' },
  { value: 'small-business', label: 'Small Business' },
  { value: 'large-corporation', label: 'Large Corporation' },
  { value: 'full-commercial', label: 'Full Commercial Right' },
  { value: 'other', label: 'Other' }
] as const;

const projectLicensingOptions = [
  { value: 'one-time', label: 'One-Time Used' },
  { value: 'limited', label: 'Limited Used' },
  { value: 'exclusive', label: 'Exclusive License' }
] as const;

export const TimeAndComplexity: React.FC<TimeAndComplexityProps> = ({
  timeComplexity,
  onUpdate,
  onNext,
  onBack
}) => {
  const handleDurationChange = (duration: number) => {
    onUpdate({ duration });
  };

  const handleDifficultyChange = (difficulty: typeof difficultyOptions[number]['value']) => {
    const difficultyOption = difficultyOptions.find(opt => opt.value === difficulty);
    onUpdate({ 
      difficulty, 
      difficultyMultiplier: difficultyOption?.multiplier || 1 
    });
  };

  const handleCommercialRightsChange = (commercialRights: typeof commercialRightsOptions[number]['value']) => {
    onUpdate({
      licensing: {
        ...timeComplexity.licensing,
        commercialRights
      }
    });
  };

  const handleProjectLicensingChange = (projectLicensing: typeof projectLicensingOptions[number]['value']) => {
    onUpdate({
      licensing: {
        ...timeComplexity.licensing,
        projectLicensing
      }
    });
  };

  const handleCustomLicensingChange = (customLicensing: string) => {
    onUpdate({
      licensing: {
        ...timeComplexity.licensing,
        customLicensing
      }
    });
  };

  const canProceed = timeComplexity.duration > 0 && timeComplexity.difficulty !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="fee-estimator-header">
        <h1 className="fee-estimator-title">Project Based Estimator</h1>
      </div>

      <div className="fee-estimator-body">
      {/* Time and Complexity Section */}
      <div className="form-section">
        <h2 className="form-section-title">Time and Complexity</h2>

        {/* Project Duration */}
        <div className="form-group">
          <label className="form-label">Project Duration Estimation</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', minWidth: '1rem' }}>0</span>
            <input
              type="range"
              min="0"
              max="999"
              value={timeComplexity.duration}
              onChange={(e) => handleDurationChange(parseInt(e.target.value))}
              className="deliverable-slider"
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: '600', minWidth: '2rem' }}>10+</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                min="0"
                value={timeComplexity.duration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                className="quantity-input"
                style={{ width: '5rem' }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666666', textTransform: 'uppercase' }}>
                hours
              </span>
            </div>
          </div>
        </div>

        {/* Project Difficulty */}
        <div className="form-group">
          <label className="form-label">Project Difficulty</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <select
              value={timeComplexity.difficulty || ''}
              onChange={(e) => handleDifficultyChange(e.target.value as any)}
              className="form-input"
              style={{ 
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="">Select Difficulty</option>
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#666666' }}>Multiplier:</span>
            <div style={{
              padding: '0.25rem 0.75rem',
              background: '#FFE8DC',
              border: '2px solid #000000',
              borderRadius: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#FB8500'
            }}>
              x{timeComplexity.difficultyMultiplier}
            </div>
          </div>
        </div>
      </div>

      {/* License and Usage Rights Section */}
      <div className="form-section">
        <h2 className="form-section-title">License and Usage Rights</h2>

        {/* Commercial Usage Rights */}
        <div className="form-group">
          <label className="form-label">Commercial Usage Rights</label>
          <div className="radio-group horizontal">
            {commercialRightsOptions.map((option) => (
              <div
                key={option.value}
                className={`radio-option ${timeComplexity.licensing.commercialRights === option.value ? 'selected' : ''}`}
                onClick={() => handleCommercialRightsChange(option.value)}
              >
                <div className={`radio-button ${timeComplexity.licensing.commercialRights === option.value ? 'selected' : ''}`} />
                <span className="radio-label">{option.label}</span>
              </div>
            ))}
          </div>

          {/* Custom licensing input for "Other" option */}
          {timeComplexity.licensing.commercialRights === 'other' && (
            <div style={{ marginTop: '1rem' }}>
              <input
                type="text"
                placeholder="Specify custom licensing terms"
                value={timeComplexity.licensing.customLicensing || ''}
                onChange={(e) => handleCustomLicensingChange(e.target.value)}
                className="form-input"
              />
            </div>
          )}
        </div>

        {/* Project Licensing */}
        <div className="form-group">
          <label className="form-label">Project Licensing</label>
          <div className="radio-group horizontal">
            {projectLicensingOptions.map((option) => (
              <div
                key={option.value}
                className={`radio-option ${timeComplexity.licensing.projectLicensing === option.value ? 'selected' : ''}`}
                onClick={() => handleProjectLicensingChange(option.value)}
              >
                <div className={`radio-button ${timeComplexity.licensing.projectLicensing === option.value ? 'selected' : ''}`} />
                <span className="radio-label">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="button-container">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button 
          className={`btn btn-primary ${!canProceed ? 'disabled' : ''}`}
          onClick={onNext}
          disabled={!canProceed}
        >
          Next
        </button>
      </div>
      </div>
    </div>
  );
};