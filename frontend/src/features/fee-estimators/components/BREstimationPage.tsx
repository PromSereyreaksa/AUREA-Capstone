import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import Sidebar from "../../../shared/components/Sidebar";
import { pricingClient } from "../../../shared/api/pricingClient";
import BenchmarkModal from "./BenchmarkModal";

const BREstimationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"onboarding" | "result">("onboarding");
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Onboarding state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  const ONBOARDING_QUESTIONS = [
    { key: 'fixed_costs_rent', question: "Let's calculate your sustainable hourly rate! First, what's your monthly rent or workspace cost in USD?", type: 'number' },
    { key: 'fixed_costs_equipment', question: 'How much do you spend monthly on equipment, software, and tools (e.g., Adobe subscription, laptop maintenance)?', type: 'number' },
    { key: 'fixed_costs_utilities_insurance_taxes', question: 'What about insurance, utilities, and taxes per month? (Combined amount)', type: 'number' },
    { key: 'variable_costs_materials', question: 'How much do you spend monthly on materials like stock photos, fonts, or plugins?', type: 'number' },
    { key: 'desired_income', question: "What's your desired monthly take-home income (after all costs)?", type: 'number' },
    { key: 'billable_hours', question: 'How many hours per month can you realistically bill to clients? (Most freelancers bill 80-120 hours/month)', type: 'number' },
    { key: 'profit_margin', question: 'What profit margin do you want? (e.g., 0.15 for 15% sustainability)', type: 'number' },
    { key: 'experience_years', question: 'How many years of experience do you have in graphic design?', type: 'number' },
    { key: 'skills', question: 'What services do you offer? (e.g., logo design, branding, web design - comma separated)', type: 'string' },
    { key: 'seniority_level', question: 'Finally, how would you describe your skill level: junior, mid, senior, or expert?', type: 'string' }
  ];

  // Result state from AI
  const [aiCalculation, setAiCalculation] = useState<any>(null);

  const getUserName = () => {
    if (user?.first_name) return user.first_name;
    if (user?.last_name) return user.last_name;
    return "Designer";
  };

  const handleStartOnboarding = () => {
    setStep("onboarding");
    setCurrentQuestionIndex(0);
    setOnboardingData({});
    setQuestionAnswer("");
    setOnboardingError(null);
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionAnswer.trim() || isSubmittingAnswer) return;

    const currentQ = ONBOARDING_QUESTIONS[currentQuestionIndex];
    let val: any = questionAnswer.trim();
    
    if (currentQ.type === 'number') {
      val = parseFloat(val);
      if (isNaN(val)) {
        setOnboardingError("Please enter a valid number");
        return;
      }
    }

    const newOnboardingData = { ...onboardingData, [currentQ.key]: val };
    setOnboardingData(newOnboardingData);
    setOnboardingError(null);

    if (currentQuestionIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionAnswer("");
    } else {
      // Finished all questions, submit to backend
      setIsSubmittingAnswer(true);
      try {
        if (!user?.user_id) throw new Error("No user ID found");
        const rateResponse = await pricingClient.calculateBaseRate({
          user_id: user.user_id,
          onboarding_data: newOnboardingData
        });
        
        if (rateResponse.success) {
          setAiCalculation(rateResponse.data);
          setStep("result");
        } else {
          throw new Error("Failed to calculate base rate");
        }
      } catch (calcErr) {
        setOnboardingError(calcErr instanceof Error ? calcErr.message : "Failed to calculate final rate");
      } finally {
        setIsSubmittingAnswer(false);
      }
    }
  };

  const handleSaveRate = async () => {
    if (!user || !user.user_id) {
      setSaveError("User not authenticated");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const billableHoursPerMonth = aiCalculation.breakdown.billable_hours;
      const profitMarginDecimal = aiCalculation.breakdown.profit_margin_percentage;

      // Update pricing profile with the calculated values
      const response = await pricingClient.updatePricingProfile(user.user_id, {
        user_id: user.user_id,
        base_hourly_rate: aiCalculation.base_hourly_rate,
        desired_monthly_income: aiCalculation.breakdown.desired_income,
        billable_hours_per_month: billableHoursPerMonth,
        profit_margin: profitMarginDecimal,
        fixed_costs: {
          equipment: onboardingData.fixed_costs_equipment || 0,
          workspace: onboardingData.fixed_costs_rent || 0,
          labor: 0,
        },
      });

      if (response.success) {
        setSaveSuccess(true);
        // Show success message for 2 seconds then navigate
        setTimeout(() => {
          navigate("/fee-estimator");
        }, 2000);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save rate");
      console.error("Save rate error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const progressSteps = [
    {
      id: 1,
      label: "AI Survey",
      active: step === "onboarding",
      subSteps: ["Answer AI questions"],
    },
    {
      id: 2,
      label: "Base Rate Summary",
      active: step === "result",
      subSteps: ["Cost Breakdown", "Base Rate Result", "Save Base Rate"],
    },
    {
      id: 3,
      label: "Complete",
      active: false,
      subSteps: [],
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FB8500] p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 md:gap-6">
      <Sidebar userName={getUserName()} />

      <main className="flex-1 bg-white rounded-2xl overflow-hidden border-[3px] border-black shadow-[2px_2px_0_#1a1a1a] flex flex-col lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#FB8500] p-4 sm:p-6 border-b-[3px] border-black animate-[slideDown_0.5s_ease-out]">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {step === "onboarding" ? "AI Evaluation Survey" : "Based Rate Estimator"}
            </h1>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
            {step === "onboarding" ? (
              <div className="max-w-2xl space-y-6 animate-[fadeIn_0.4s_ease-out]">
                <section className="bg-white border-[3px] border-black rounded-xl p-6 shadow-[2px_2px_0_#1a1a1a]">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-[#FB8500]">Progress</span>
                      <span className="text-sm font-bold text-gray-600">
                        {Math.round((currentQuestionIndex / ONBOARDING_QUESTIONS.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-[#FB8500] h-2.5 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${(currentQuestionIndex / ONBOARDING_QUESTIONS.length) * 100}%` 
                        }}>
                      </div>
                    </div>
                  </div>

                  {ONBOARDING_QUESTIONS[currentQuestionIndex] ? (
                    <form onSubmit={submitAnswer} className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">{ONBOARDING_QUESTIONS[currentQuestionIndex].question}</h3>
                      
                      {onboardingError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                          {onboardingError}
                        </div>
                      )}

                      <div className="relative">
                        <input
                          type={ONBOARDING_QUESTIONS[currentQuestionIndex].type === 'number' ? 'number' : 'text'}
                          step={ONBOARDING_QUESTIONS[currentQuestionIndex].type === 'number' ? 'any' : undefined}
                          value={questionAnswer}
                          onChange={(e) => setQuestionAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
                          required
                          autoFocus
                          disabled={isSubmittingAnswer}
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={isSubmittingAnswer || !questionAnswer.trim()}
                          className="px-6 py-3 bg-[#FB8500] text-white border-2 border-black rounded-lg text-sm font-bold hover:bg-[#E67700] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1a1a1a] transition-all duration-150 shadow-[2px_2px_0_#1a1a1a] disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSubmittingAnswer ? 'SUBMITTING...' : 'CONTINUE'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <svg className="animate-spin h-8 w-8 text-[#FB8500] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-600 font-medium">Loading question...</p>
                    </div>
                  )}
                </section>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => navigate("/fee-estimator")}
                    className="px-6 py-3 border-2 border-black rounded-lg text-sm font-bold hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1a1a1a] transition-all duration-150"
                  >
                    BACK TO ESTIMATOR
                  </button>
                </div>
              </div>
            ) : aiCalculation ? (
              <div className="max-w-2xl space-y-6 animate-[fadeIn_0.4s_ease-out]">
                {/* Cost Breakdown Section */}
                <section className="animate-[slideUp_0.5s_ease-out]">
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#FB8500] mb-4">
                    Cost Breakdown
                  </h2>

                  <div className="bg-white border-[3px] border-black rounded-xl p-6 shadow-[2px_2px_0_#1a1a1a] space-y-4 animate-[fadeIn_0.6s_ease-out_0.2s] opacity-0 [animation-fill-mode:forwards]">
                    <h3 className="text-base font-bold text-[#FB8500] pb-3 border-b-2 border-gray-300">
                      Annual Expense Breakdown
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-[#FFFEF9] rounded-lg border-2 border-gray-200">
                        <span className="text-gray-700 font-semibold">Annual Equipment Costs</span>
                        <span className="font-bold text-[#FB8500]">
                          ${(parseFloat(onboardingData.fixed_costs_equipment || "0") * 12).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#FFFEF9] rounded-lg border-2 border-gray-200">
                        <span className="text-gray-700 font-semibold">Annual Rent/Workspace</span>
                        <span className="font-bold text-[#FB8500]">
                          ${(parseFloat(onboardingData.fixed_costs_rent || "0") * 12).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#FFFEF9] rounded-lg border-2 border-gray-200">
                        <span className="text-gray-700 font-semibold">Annual Labor Costs</span>
                        <span className="font-bold text-[#FB8500]">
                          $0.00
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-[#FFE8DC] rounded-lg border-2 border-[#FB8500]">
                      <span className="text-base font-extrabold text-[#FB8500]">
                        TOTAL EXPENSES
                      </span>
                      <span className="text-xl font-black text-[#FB8500]">
                        ${(aiCalculation.breakdown.total_monthly_costs).toFixed(2)}/mo
                      </span>
                    </div>
                  </div>
                </section>

                {/* Calculation Process Section */}
                <section className="animate-[slideUp_0.5s_ease-out_0.1s] opacity-0 [animation-fill-mode:forwards]">
                  <h3 className="text-base font-bold text-[#FB8500] mb-4">
                    Calculation Process
                  </h3>

                  <div className="bg-white border-[3px] border-black rounded-xl p-6 shadow-[2px_2px_0_#1a1a1a] space-y-3 text-sm animate-[fadeIn_0.6s_ease-out_0.3s] opacity-0 [animation-fill-mode:forwards]">
                    <div className="flex justify-between items-center p-3 bg-[#FFFEF9] rounded-lg border-2 border-gray-200">
                      <span className="text-gray-700">Total Expenses</span>
                      <span className="font-semibold text-[#FB8500]">
                        ${aiCalculation.breakdown.total_monthly_costs.toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#FFFEF9] rounded-lg border-2 border-gray-200">
                      <span className="text-gray-700">Expected Income</span>
                      <span className="font-semibold text-[#FB8500]">
                        ${aiCalculation.breakdown.desired_income.toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#FFFEF9] rounded-lg border-2 border-gray-200">
                      <span className="text-gray-700">Total Price</span>
                      <span className="font-semibold text-[#FB8500]">${(aiCalculation.breakdown.total_monthly_costs + aiCalculation.breakdown.desired_income).toFixed(2)}/mo</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#FFFEF9] rounded-lg border-2 border-gray-200">
                      <span className="text-gray-700">
                        Profit Margin ({(aiCalculation.breakdown.profit_margin_percentage).toFixed(0)}%)
                      </span>
                      <span className="font-semibold text-[#FB8500]">
                        ${(aiCalculation.breakdown.profit_amount).toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#FFE8DC] rounded-lg border-2 border-[#FB8500]">
                      <span className="text-gray-700 font-bold">
                        Target Revenue
                      </span>
                      <span className="font-bold text-[#FB8500]">
                        ${(aiCalculation.breakdown.total_required).toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#FFFEF9] rounded-lg border-2 border-gray-200">
                      <span className="text-gray-700">Billable Hours Per Month</span>
                      <span className="font-semibold text-[#FB8500]">
                        {aiCalculation.breakdown.billable_hours.toFixed(0)} hrs
                      </span>
                    </div>
                  </div>
                </section>

                {/* Base Rate Result */}
                <section className="bg-gradient-to-r from-[#FFE8DC] to-white p-6 rounded-xl border-2 border-black animate-[scaleIn_0.5s_ease-out_0.4s] opacity-0 [animation-fill-mode:forwards]">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-extrabold text-[#FB8500]">
                      BASE RATE
                    </span>
                    <span className="text-2xl font-black text-[#FB8500]">
                      ${aiCalculation.base_hourly_rate.toFixed(1)}/Hr
                    </span>
                  </div>
                </section>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 animate-[slideUp_0.5s_ease-out_0.5s] opacity-0 [animation-fill-mode:forwards]">
                  {saveSuccess && (
                    <div className="w-full bg-green-50 border-2 border-green-400 rounded-lg p-4 text-green-700 font-semibold">
                      ✓ Rate saved successfully! Redirecting...
                    </div>
                  )}
                  {saveError && (
                    <div className="w-full bg-red-50 border-2 border-red-400 rounded-lg p-4 text-red-700">
                      {saveError}
                    </div>
                  )}
                  <button
                    onClick={handleStartOnboarding}
                    disabled={isSaving}
                    className="px-6 py-3 border-2 border-black rounded-lg text-sm font-bold hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1a1a1a] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    START OVER
                  </button>
                  <button
                    onClick={() => setShowBenchmark(true)}
                    disabled={isSaving}
                    className="px-6 py-3 border-2 border-black rounded-lg text-sm font-bold hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1a1a1a] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    VIEW BENCHMARK
                  </button>
                  {user && user.user_id ? (
                    <button
                      onClick={handleSaveRate}
                      disabled={isSaving}
                      className="px-6 py-3 bg-[#FB8500] text-white border-2 border-black rounded-lg text-sm font-bold hover:bg-[#E67700] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1a1a1a] transition-all duration-150 shadow-[2px_2px_0_#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a10 10 0 0110 10" />
                          </svg>
                          SAVING...
                        </>
                      ) : (
                        "SAVE RATE"
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center px-4 py-3 bg-red-50 text-red-700 border-2 border-red-400 rounded-lg text-sm font-bold shadow-[2px_2px_0_#1a1a1a]">
                      Login required to save rate
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
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

                {/* Step Circle */}
                <div className="flex items-start gap-3 p-3 rounded-lg transition-all" 
                  style={{
                    backgroundColor: stepItem.active ? '#FFE8DC' : 'transparent'
                  }}>
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      stepItem.active
                        ? "bg-[#FB8500] border-[#FB8500]"
                        : "bg-white border-[#FB8500]"
                    }`}
                  >
                    {stepItem.id === 3 ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className={stepItem.active ? "text-white" : "text-[#FB8500]"}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span
                        className={`text-xs font-bold ${
                          stepItem.active ? "text-white" : "text-[#FB8500]"
                        }`}
                      >
                        {stepItem.id}
                      </span>
                    )}
                  </div>

                  {/* Step Content */}
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

      <BenchmarkModal
        isOpen={showBenchmark}
        onClose={() => setShowBenchmark(false)}
        userId={user?.user_id || 0}
      />
    </div>
  );
};

export default BREstimationPage;
