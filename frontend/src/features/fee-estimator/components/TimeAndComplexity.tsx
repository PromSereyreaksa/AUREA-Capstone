import React from 'react';
import type { TimeComplexity as TimeComplexityType } from '../shared/types';

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
  { value: 'complex', label: 'Complex', multiplier: 2.5 },
] as const;

const commercialRightsOptions = [
  { value: 'personal', label: 'Personal Use' },
  { value: 'small-business', label: 'Small Business' },
  { value: 'large-corporation', label: 'Large Corporation' },
  { value: 'full-commercial', label: 'Full Commercial Right' },
  { value: 'other', label: 'Other' },
] as const;

const projectLicensingOptions = [
  { value: 'one-time', label: 'One-Time Used' },
  { value: 'limited', label: 'Limited Used' },
  { value: 'exclusive', label: 'Exclusive License' },
] as const;

const clientTypeOptions = [
  { value: 'startup', label: 'Startup' },
  { value: 'sme', label: 'SME' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'ngo', label: 'NGO / Non-Profit' },
  { value: 'government', label: 'Government' },
] as const;

const clientRegionOptions = [
  { value: 'cambodia', label: 'Cambodia' },
  { value: 'southeast_asia', label: 'Southeast Asia' },
  { value: 'global', label: 'Global' },
] as const;

export const TimeAndComplexity: React.FC<TimeAndComplexityProps> = ({
  timeComplexity,
  onUpdate,
  onNext,
  onBack,
}) => {
  const handleDurationChange = (duration: number) => {
    onUpdate({ duration });
  };

  const handleDifficultyChange = (
    difficulty: (typeof difficultyOptions)[number]['value'],
  ) => {
    const difficultyOption = difficultyOptions.find(
      (option) => option.value === difficulty,
    );
    onUpdate({
      difficulty,
      difficultyMultiplier: difficultyOption?.multiplier || 1,
    });
  };

  const handleCommercialRightsChange = (
    commercialRights: (typeof commercialRightsOptions)[number]['value'],
  ) => {
    onUpdate({
      licensing: {
        ...timeComplexity.licensing,
        commercialRights,
      },
    });
  };

  const handleProjectLicensingChange = (
    projectLicensing: (typeof projectLicensingOptions)[number]['value'],
  ) => {
    onUpdate({
      licensing: {
        ...timeComplexity.licensing,
        projectLicensing,
      },
    });
  };

  const handleClientTypeChange = (
    client_type: (typeof clientTypeOptions)[number]['value'],
  ) => {
    onUpdate({ client_type });
  };

  const handleClientRegionChange = (
    client_region: (typeof clientRegionOptions)[number]['value'],
  ) => {
    onUpdate({ client_region });
  };

  const handleCustomLicensingChange = (customLicensing: string) => {
    onUpdate({
      licensing: {
        ...timeComplexity.licensing,
        customLicensing,
      },
    });
  };

  const canProceed =
    timeComplexity.duration > 0 &&
    timeComplexity.difficulty !== null &&
    timeComplexity.client_type !== null &&
    timeComplexity.client_region !== null;

  return (
    <div className="estimator-shell">
      <div className="fee-estimator-header">
        <h1 className="fee-estimator-title">Project Based Estimator</h1>
      </div>

      <div className="fee-estimator-body">
        <div className="form-section nb-cut-in-up">
          <h2 className="form-section-title">Time and Complexity</h2>

          <div className="estimator-stack">
            <div className="estimator-panel estimator-panel-muted">
              <label className="form-label">Project Duration Estimation</label>
              <div className="estimator-range-row">
                <span className="estimator-range-label">0</span>
                <input
                  type="range"
                  min="0"
                  max="999"
                  value={timeComplexity.duration}
                  onChange={(e) =>
                    handleDurationChange(parseInt(e.target.value, 10))
                  }
                  className="deliverable-slider"
                  style={{ flex: 1 }}
                />
                <span className="estimator-range-label">999</span>

                <div className="estimator-range-side">
                  <input
                    type="number"
                    min="0"
                    value={timeComplexity.duration}
                    onChange={(e) =>
                      handleDurationChange(parseInt(e.target.value, 10) || 0)
                    }
                    className="quantity-input"
                    style={{ width: '5rem' }}
                  />
                  <span className="estimator-badge">Hours</span>
                </div>
              </div>
            </div>

            <div className="estimator-grid-two">
              <div className="estimator-panel">
                <label className="form-label">Project Difficulty</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <select
                    value={timeComplexity.difficulty || ''}
                    onChange={(e) =>
                      handleDifficultyChange(
                        e.target.value as (typeof difficultyOptions)[number]['value'],
                      )
                    }
                    className="form-input"
                    style={{
                      appearance: 'none',
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.8' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.25rem 1.25rem',
                      paddingRight: '2.75rem',
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
                <div style={{ marginTop: '0.75rem' }}>
                  <span className="estimator-pill">
                    x{timeComplexity.difficultyMultiplier} multiplier
                  </span>
                </div>
              </div>

              <div className="estimator-panel">
                <label className="form-label">Client Type</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <select
                    value={timeComplexity.client_type || ''}
                    onChange={(e) =>
                      handleClientTypeChange(
                        e.target.value as (typeof clientTypeOptions)[number]['value'],
                      )
                    }
                    className="form-input"
                    style={{
                      appearance: 'none',
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.8' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.25rem 1.25rem',
                      paddingRight: '2.75rem',
                    }}
                  >
                    <option value="">Select Client Type</option>
                    {clientTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section nb-cut-in-up">
          <h2 className="form-section-title">Client Context</h2>

          <div className="estimator-panel">
            <label className="form-label">Client Region</label>
            <div className="radio-group horizontal">
              {clientRegionOptions.map((option) => (
                <div
                  key={option.value}
                  className={`radio-option ${
                    timeComplexity.client_region === option.value ? 'selected' : ''
                  }`}
                  onClick={() => handleClientRegionChange(option.value)}
                >
                  <div
                    className={`radio-button ${
                      timeComplexity.client_region === option.value ? 'selected' : ''
                    }`}
                  />
                  <span className="radio-label">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section nb-cut-in-up">
          <h2 className="form-section-title">License and Usage Rights</h2>

          <div className="estimator-stack">
            <div className="estimator-panel">
              <label className="form-label">Commercial Usage Rights</label>
              <div className="radio-group horizontal">
                {commercialRightsOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`radio-option ${
                      timeComplexity.licensing.commercialRights === option.value
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() => handleCommercialRightsChange(option.value)}
                  >
                    <div
                      className={`radio-button ${
                        timeComplexity.licensing.commercialRights === option.value
                          ? 'selected'
                          : ''
                      }`}
                    />
                    <span className="radio-label">{option.label}</span>
                  </div>
                ))}
              </div>

              {timeComplexity.licensing.commercialRights === 'other' && (
                <div style={{ marginTop: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Specify custom licensing terms"
                    value={timeComplexity.licensing.customLicensing || ''}
                    onChange={(e) =>
                      handleCustomLicensingChange(e.target.value)
                    }
                    className="form-input"
                  />
                </div>
              )}
            </div>

            <div className="estimator-panel estimator-panel-muted">
              <label className="form-label">Project Licensing</label>
              <div className="radio-group horizontal">
                {projectLicensingOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`radio-option ${
                      timeComplexity.licensing.projectLicensing === option.value
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() => handleProjectLicensingChange(option.value)}
                  >
                    <div
                      className={`radio-button ${
                        timeComplexity.licensing.projectLicensing === option.value
                          ? 'selected'
                          : ''
                      }`}
                    />
                    <span className="radio-label">{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="button-container">
          <button className="btn btn-secondary nb-pressable" onClick={onBack}>
            Back
          </button>
          <button
            className={`btn btn-primary nb-pressable ${!canProceed ? 'disabled' : ''}`}
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
