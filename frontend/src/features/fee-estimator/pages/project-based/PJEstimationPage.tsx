import React, { useEffect } from 'react';
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
import { PricingClient } from '../../../../shared/api/pricingClient';
import '../../shared/styles/fee-estimator.css';

const pricingClient = new PricingClient();

const isMissingPricingProfileError = (message: string): boolean => {
  const text = message.toLowerCase();
  return (
    text.includes("pricing profile not found") ||
    text.includes("no pricing profile") ||
    text.includes("complete onboarding")
  );
};

const PJEstimationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileCheckError, setProfileCheckError] = React.useState<string | null>(null);
  const [showBaseRateRequiredModal, setShowBaseRateRequiredModal] = React.useState(false);
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
    if (user?.email) return user.email.split('@')[0];
    return "Designer";
  };

  // Check that user has a pricing profile; redirect to base-rate setup if not
  useEffect(() => {
    if (!user?.user_id) return;
    setProfileCheckError(null);
    pricingClient.getPricingProfile(user.user_id).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to load pricing profile";
      if (isMissingPricingProfileError(message)) {
        setShowBaseRateRequiredModal(true);
        return;
      }
      setProfileCheckError(message);
    });
  }, [user?.user_id, navigate]);

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
            onApplyExtraction={(projectInfo, deliverables, timeComplexity) => {
              updateProjectInfo(projectInfo);
              updateDeliverables(deliverables);
              updateTimeComplexity(timeComplexity);
            }}
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
            userId={user?.user_id ?? 0}
            onEdit={(step: number) => {
              goToStep(step);
            }}
            onComplete={() => {
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
            onApplyExtraction={(projectInfo, deliverables, timeComplexity) => {
              updateProjectInfo(projectInfo);
              updateDeliverables(deliverables);
              updateTimeComplexity(timeComplexity);
            }}
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
    <>
      <div
        className="flex min-h-screen flex-col gap-3 bg-[#FB8500] p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6 lg:flex-row"
        style={{ fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif" }}
      >
        <Sidebar userName={getUserName()} />

        <main className="flex flex-1 flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-[2px_2px_0_#1a1a1a] lg:flex-row">
          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden bg-[#FFFEF9]">
            {profileCheckError && (
              <div className="mx-4 mt-4 estimator-alert estimator-alert-error">
                Unable to verify your pricing profile: {profileCheckError}
              </div>
            )}
            {renderCurrentStep()}
          </div>

          {/* Progress Sidebar */}
          <aside className="w-full border-t-[3px] border-black bg-[#FFFEF9] p-4 sm:p-6 lg:w-72 lg:border-l-[3px] lg:border-t-0">
            <div className="mb-6">
              <p className="estimator-eyebrow">Progress</p>
              <h2 className="text-lg font-black uppercase tracking-[0.04em] text-[#FB8500]">
                Project rate flow
              </h2>
            </div>

            <div className="estimator-progress-nav">
              {progressSteps.map((stepItem, index) => (
                <div key={stepItem.id} className="estimator-progress-item">
                  {/* Connector Line */}
                  {index < progressSteps.length - 1 && (
                    <div className="estimator-progress-divider" />
                  )}

                  {/* Step */}
                  <div className={`estimator-progress-step ${stepItem.active ? "is-active" : ""}`}>
                    <div className="estimator-step-number">{stepItem.id}</div>

                    <div>
                      <h3 className="estimator-step-title">{stepItem.label}</h3>
                      {stepItem.subSteps.length > 0 && (
                        <ul className="estimator-step-sublist">
                          {stepItem.subSteps.map((subStep, idx) => (
                            <li key={idx} className="estimator-step-subtext">
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

      {showBaseRateRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="estimator-modal-shell">
            <div className="border-b-[3px] border-black bg-[#FB8500] p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-black">
                Project Based Estimator
              </p>
              <h3 className="text-xl font-black text-white">Base Rate Required</h3>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-black mb-5">
              Please set up your base rate first before using Project-Based Estimation.
              </p>
              <button
                onClick={() => {
                  setShowBaseRateRequiredModal(false);
                  navigate('/fee-estimator/base-rate');
                }}
                className="btn btn-primary nb-pressable w-full"
              >
                Go to base rate setup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PJEstimationPage;
