import React from 'react';
import type { ProgressStep } from '../types';

interface ProgressIndicatorProps {
  currentStep: number;
}

// Icon components for each step
const ProjectInfoIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
);

const ScopeIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-5"/>
    <path d="M7 7V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
  </svg>
);

const TimeIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const SummaryIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,11 12,14 22,4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  const steps: ProgressStep[] = [
    {
      id: 1,
      title: 'Project Base Information',
      subtitle: 'Project Information',
      completed: currentStep > 2,
      active: currentStep === 2
    },
    {
      id: 2,
      title: 'Scope and Deliverable',
      subtitle: 'Scope and Deliverable',
      completed: currentStep > 3,
      active: currentStep === 3
    },
    {
      id: 3,
      title: 'Time and Complexity',
      subtitle: 'Time and Complexity',
      completed: currentStep > 4,
      active: currentStep === 4
    },
    {
      id: 4,
      title: 'License and Usage Right',
      subtitle: 'License and Usage Right',
      completed: currentStep > 5,
      active: currentStep === 5
    },
    {
      id: 5,
      title: 'Project Base Summary',
      subtitle: 'Project Summary',
      completed: currentStep > 6,
      active: currentStep === 5
    },
    {
      id: 6,
      title: 'Complete',
      subtitle: 'Complete',
      completed: false,
      active: false
    }
  ];

  const getStepIcon = (stepId: number) => {
    switch (stepId) {
      case 1:
        return <ProjectInfoIcon />;
      case 2:
        return <ScopeIcon />;
      case 3:
      case 4:
        return <TimeIcon />;
      case 5:
      case 6:
        return <SummaryIcon />;
      default:
        return <ProjectInfoIcon />;
    }
  };

  return (
    <div className="progress-container" style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', border: '3px solid #000000', boxShadow: '2px 2px 0 #1a1a1a', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#FB8500', fontWeight: 'bold', fontSize: '1.125rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
        Progress
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {steps.map((step, index) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Step indicator */}
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              border: '2px solid #000000',
              background: step.completed ? '#FB8500' : step.active ? '#FFE8DC' : 'white',
              color: step.completed ? 'white' : '#FB8500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {step.completed ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              ) : (
                getStepIcon(step.id)
              )}
            </div>

            {/* Step content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: step.active ? '#FB8500' : step.completed ? '#000000' : '#666666',
                marginBottom: '0.125rem',
                textTransform: 'uppercase',
                letterSpacing: '0.3px'
              }}>
                {step.title}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#666666'
              }}>
                {step.subtitle}
              </div>
            </div>

            {/* Connection line to next step */}
            {index < steps.length - 1 && (
              <div style={{
                position: 'absolute',
                left: '1.25rem',
                width: '2px',
                height: '1rem',
                background: step.completed ? '#FB8500' : '#E5E5E5',
                marginTop: '2.5rem',
                zIndex: 1
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};