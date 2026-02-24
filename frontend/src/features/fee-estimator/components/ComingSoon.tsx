import React from 'react';

interface ComingSoonProps {
  onBack: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onBack }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="fee-estimator-header">
        <h1 className="fee-estimator-title">Base Rate Calculator</h1>
      </div>

      <div className="fee-estimator-body">
        <div className="coming-soon-container">
          <div className="coming-soon-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#FB8500" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 className="coming-soon-title">Coming Soon</h2>
          <p className="coming-soon-description">
            The Base Rate Calculator is currently under development. 
            This feature will help you calculate your optimal hourly rate based on your experience, 
            skills, and market conditions.
          </p>
          <p className="coming-soon-description">
            Stay tuned for updates!
          </p>
          <button 
            onClick={onBack}
            className="button-secondary"
            style={{ marginTop: '2rem' }}
          >
            Back to Mode Selection
          </button>
        </div>
      </div>
    </div>
  );
};
