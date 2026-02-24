import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/context/AuthContext';
import Sidebar from '../../../../shared/components/Sidebar';
import {
  ProjectInformation as ProjectInformationForm,
  ScopeAndDeliverable,
  TimeAndComplexity,
  ProjectSummary,
} from '../../components';
import { useFeeEstimator } from '../../shared/hooks/useFeeEstimator';
import '../../shared/styles/fee-estimator.css';

const PJEstimationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    state,
    nextStep,
    previousStep,
    updateProjectInfo,
    updateDeliverables,
    updateTimeComplexity,
    reset,
    goToStep,
  } = useFeeEstimator();

  const getUserName = () => {
    if (user?.first_name) return user.first_name;
    if (user?.last_name) return user.last_name;
    return "Designer";
  };

  // Map internal steps: we start at step 2 (project info) since mode is already "project-based"
  // Step 1 = Project Information (internal step 2)
  // Step 2 = Scope & Deliverables (internal step 3)
  // Step 3 = Time & Complexity (internal step 4)
  // Step 4 = Project Summary (internal step 5)
  const currentStep = state.step;

  const handleBack = () => {
    if (currentStep <= 2) {
      navigate('/fee-estimator');
    } else {
      previousStep();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
      case 2:
        return (
          <ProjectInformationForm
            projectInfo={state.projectInfo}
            onUpdate={updateProjectInfo}
            onNext={nextStep}
            onBack={handleBack}
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
              goToStep(step);
            }}
            onComplete={() => {
              // TODO: Submit to backend for price calculation
              reset();
              navigate('/fee-estimator');
            }}
          />
        );
      default:
        return (
          <ProjectInformationForm
            projectInfo={state.projectInfo}
            onUpdate={updateProjectInfo}
            onNext={nextStep}
            onBack={handleBack}
          />
        );
    }
  };

  // Progress steps for the sidebar
  const progressSteps = [
    {
      id: 1,
      label: "Project Info",
      active: currentStep <= 2,
      subSteps: ["Upload PDF or Manual", "Name & Description"],
    },
    {
      id: 2,
      label: "Scope & Deliverables",
      active: currentStep === 3,
      subSteps: ["Define Deliverables", "Set Quantities"],
    },
    {
      id: 3,
      label: "Time & Complexity",
      active: currentStep === 4,
      subSteps: ["Duration", "Difficulty", "Licensing"],
    },
    {
      id: 4,
      label: "Summary",
      active: currentStep === 5,
      subSteps: ["Review Details", "Get Estimate"],
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FB8500] p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 md:gap-6">
      <Sidebar userName={getUserName()} />

      <main className="flex-1 bg-white rounded-2xl overflow-hidden border-[3px] border-black shadow-[2px_2px_0_#1a1a1a] flex flex-col lg:flex-row">
        {/* Main Content */}
        <div className="fee-estimator-content flex-1 flex flex-col overflow-hidden">
          {renderCurrentStep()}
        </div>

        {/* Progress Sidebar */}
        <aside className="w-full lg:w-64 bg-[#FFFEF9] border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-black p-4 sm:p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-6 animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-lg font-extrabold text-[#FB8500]">Progress</h2>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FB8500"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <div className="space-y-6">
            {progressSteps.map((stepItem, index) => (
              <div
                key={stepItem.id}
                className="relative animate-[slideRight_0.5s_ease-out] opacity-0 [animation-fill-mode:forwards]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Connector Line */}
                {index < progressSteps.length - 1 && (
                  <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-[#FB8500]" />
                )}

                {/* Step */}
                <div
                  className="flex items-start gap-3 p-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: stepItem.active ? '#FFE8DC' : 'transparent',
                  }}
                >
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      stepItem.active
                        ? "bg-[#FB8500] border-[#FB8500]"
                        : "bg-white border-[#FB8500]"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        stepItem.active ? "text-white" : "text-[#FB8500]"
                      }`}
                    >
                      {stepItem.id}
                    </span>
                  </div>

                  <div>
                    <h3
                      className={`text-sm font-bold mb-2 transition-colors ${
                        stepItem.active ? "text-[#FB8500]" : "text-gray-600"
                      }`}
                    >
                      {stepItem.label}
                    </h3>
                    {stepItem.subSteps.length > 0 && (
                      <ul className="space-y-1">
                        {stepItem.subSteps.map((subStep, idx) => (
                          <li
                            key={idx}
                            className={`text-xs transition-colors ${
                              stepItem.active ? "text-[#FB8500]" : "text-gray-500"
                            }`}
                          >
                            {subStep}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default PJEstimationPage;
