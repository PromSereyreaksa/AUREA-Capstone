import React from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import Sidebar from '../../../shared/components/Sidebar';
import {
  ModeSelection,
  ProjectInformation as ProjectInformationForm,
  ScopeAndDeliverable,
  TimeAndComplexity,
  ProjectSummary,
  ProgressIndicator,
  ComingSoon,
} from './index';
import { useFeeEstimator } from '../hooks/useFeeEstimator';
import '../styles/fee-estimator.css';

export const FeeEstimatorPage: React.FC = () => {
  const { user } = useAuth();
  const {
    state,
    setMode,
    nextStep,
    previousStep,
    updateProjectInfo,
    updateDeliverables,
    updateTimeComplexity,
    reset
  } = useFeeEstimator();

  const getUserName = () => {
    if (user?.email) {
      const emailPrefix = user.email.split("@")[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return "User";
  };

  const handleModeSelect = (mode: 'project-based' | 'hourly') => {
    setMode(mode);
    // Auto-advance to next step for both modes
    nextStep();
  };

  const renderCurrentStep = () => {
    switch (state.step) {
      case 1:
        return (
          <ModeSelection
            selectedMode={state.mode}
            onModeSelect={handleModeSelect}
          />
        );
      case 2:
        // Show Coming Soon for hourly mode
        if (state.mode === 'hourly') {
          return <ComingSoon onBack={previousStep} />;
        }
        return (
          <ProjectInformationForm
            projectInfo={state.projectInfo}
            onUpdate={updateProjectInfo}
            onNext={nextStep}
            onBack={previousStep}
          />
        );
      case 3:
        return (
          <ScopeAndDeliverable
            deliverables={state.deliverables}
            onUpdate={updateDeliverables}
            onNext={nextStep}
            onBack={previousStep}
          />
        );
      case 4:
        return (
          <TimeAndComplexity
            timeComplexity={state.timeComplexity}
            onUpdate={updateTimeComplexity}
            onNext={nextStep}
            onBack={previousStep}
          />
        );
      case 5:
        return (
          <ProjectSummary
            projectInfo={state.projectInfo}
            deliverables={state.deliverables}
            timeComplexity={state.timeComplexity}
            onEdit={(step: number) => {
              // Navigate to specific step for editing
              if (step === 2) previousStep();
              else if (step === 3) previousStep(); 
              else if (step === 4) previousStep();
            }}
            onComplete={() => {
              // TODO: Show coming soon for calculation
              reset();
            }}
          />
        );
      default:
        return (
          <ModeSelection
            selectedMode={state.mode}
            onModeSelect={handleModeSelect}
          />
        );
    }
  };

  return (
    <div className="fee-estimator-container">
      <div className="fee-estimator-layout">
        <Sidebar userName={getUserName()} />
        
        <div className="fee-estimator-content">
          {renderCurrentStep()}
        </div>

        {state.step > 1 && (
          <div className="fee-estimator-progress-sidebar">
            <ProgressIndicator currentStep={state.step} />
          </div>
        )}
      </div>
    </div>
  );
};