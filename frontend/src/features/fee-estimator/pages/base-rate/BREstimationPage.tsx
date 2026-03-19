import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/context/AuthContext";
import Sidebar from "../../../../shared/components/Sidebar";
import { pricingClient } from "../../../../shared/api/pricingClient";
import BenchmarkModal from "./BenchmarkModal";
import "../../shared/styles/fee-estimator.css";

type OnboardingQuestion = {
  key: string;
  question: string;
  type: "number" | "string";
};

type NumberQuestionConfig = {
  min?: number;
  max?: number;
  step: number;
  unitLabel: string;
  placeholder: string;
  showRange?: boolean;
};

const NUMBER_QUESTION_CONFIG: Record<string, NumberQuestionConfig> = {
  fixed_costs_rent: {
    min: 0,
    step: 25,
    unitLabel: "USD / month",
    placeholder: "e.g. 250",
  },
  fixed_costs_equipment: {
    min: 0,
    step: 10,
    unitLabel: "USD / month",
    placeholder: "e.g. 80",
  },
  fixed_costs_utilities_insurance_taxes: {
    min: 0,
    step: 10,
    unitLabel: "USD / month",
    placeholder: "e.g. 120",
  },
  variable_costs_materials: {
    min: 0,
    step: 10,
    unitLabel: "USD / month",
    placeholder: "e.g. 35",
  },
  desired_income: {
    min: 0,
    step: 50,
    unitLabel: "USD / month",
    placeholder: "e.g. 1500",
  },
  billable_hours: {
    min: 40,
    max: 200,
    step: 1,
    unitLabel: "Hours / month",
    placeholder: "40-200",
    showRange: true,
  },
  profit_margin: {
    min: 0.05,
    max: 0.5,
    step: 0.01,
    unitLabel: "Decimal margin",
    placeholder: "0.15 = 15%",
    showRange: true,
  },
  experience_years: {
    min: 0,
    max: 40,
    step: 1,
    unitLabel: "Years",
    placeholder: "e.g. 5",
    showRange: true,
  },
};

const formatNumberValue = (value: number, step: number) => {
  if (step >= 1) {
    return String(Math.round(value));
  }

  return value
    .toFixed(2)
    .replace(/\.?0+$/, "");
};

const getInlineUnitLabel = (unitLabel: string) => {
  return unitLabel.includes("/") ? unitLabel.toUpperCase() : null;
};

const BREstimationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"onboarding" | "result">("onboarding");
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
    {
      key: "fixed_costs_rent",
      question:
        "Let's calculate your sustainable hourly rate! First, what's your monthly rent or workspace cost in USD?",
      type: "number",
    },
    {
      key: "fixed_costs_equipment",
      question:
        "How much do you spend monthly on equipment, software, and tools (e.g., Adobe subscription, laptop maintenance)?",
      type: "number",
    },
    {
      key: "fixed_costs_utilities_insurance_taxes",
      question:
        "What about insurance, utilities, and taxes per month? (Combined amount)",
      type: "number",
    },
    {
      key: "variable_costs_materials",
      question:
        "How much do you spend monthly on materials like stock photos, fonts, or plugins?",
      type: "number",
    },
    {
      key: "desired_income",
      question:
        "What's your desired monthly take-home income (after all costs)?",
      type: "number",
    },
    {
      key: "billable_hours",
      question:
        "How many hours per month can you realistically bill to clients? (Must be 40-200 hours/month)",
      type: "number",
    },
    {
      key: "profit_margin",
      question:
        "What profit margin do you want? (Enter 0.05 for 5% to 0.50 for 50%. Example: 0.15 for 15% sustainability)",
      type: "number",
    },
    {
      key: "experience_years",
      question: "How many years of experience do you have in graphic design?",
      type: "number",
    },
    {
      key: "skills",
      question:
        "What services do you offer? (e.g., logo design, branding, web design - comma separated)",
      type: "string",
    },
    {
      key: "seniority_level",
      question:
        "Finally, how would you describe your skill level: junior, mid, senior, or expert?",
      type: "string",
    },
  ];

  const [aiCalculation, setAiCalculation] = useState<any>(null);

  const getUserName = () => {
    if (user?.first_name) return user.first_name;
    if (user?.last_name) return user.last_name;
    if (user?.email) return user.email.split("@")[0];
    return "Designer";
  };

  const handleStartOnboarding = () => {
    setStep("onboarding");
    setCurrentQuestionIndex(0);
    setOnboardingData({});
    setQuestionAnswer("");
    setOnboardingError(null);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const submitAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!questionAnswer.trim() || isSubmittingAnswer) return;

    const currentQ = ONBOARDING_QUESTIONS[currentQuestionIndex];
    let val: any = questionAnswer.trim();

    if (currentQ.type === "number") {
      val = parseFloat(val);
      if (isNaN(val)) {
        setOnboardingError("Please enter a valid number.");
        return;
      }

      if (currentQ.key === "profit_margin" && (val < 0.05 || val > 0.5)) {
        setOnboardingError(
          "Profit margin must be between 0.05 and 0.5. Example: 0.15 for 15%.",
        );
        return;
      }

      if (currentQ.key === "billable_hours" && (val < 40 || val > 200)) {
        setOnboardingError(
          "Billable hours must be between 40 and 200 hours per month.",
        );
        return;
      }
    }

    const newOnboardingData = { ...onboardingData, [currentQ.key]: val };
    setOnboardingData(newOnboardingData);
    setOnboardingError(null);

    if (currentQuestionIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionAnswer("");
      return;
    }

    setIsSubmittingAnswer(true);
    try {
      if (!user?.user_id) throw new Error("No user ID found");

      const rateResponse = await pricingClient.calculateBaseRate({
        user_id: user.user_id,
        onboarding_data: newOnboardingData,
      });

      if (!rateResponse.success) {
        throw new Error("Failed to calculate base rate");
      }

      setAiCalculation(rateResponse.data);
      setStep("result");
    } catch (calcErr) {
      setOnboardingError(
        calcErr instanceof Error
          ? calcErr.message
          : "Failed to calculate final rate",
      );
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleSaveRate = async () => {
    if (!user?.user_id) {
      setSaveError("User not authenticated");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const billableHoursPerMonth = aiCalculation.breakdown.billable_hours;
      const rawProfitMargin = Number(
        aiCalculation.breakdown.profit_margin_percentage,
      );
      const profitMarginDecimal =
        rawProfitMargin > 1 ? rawProfitMargin / 100 : rawProfitMargin;

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
      subSteps: ["Cost breakdown", "Base rate", "Save profile"],
    },
    {
      id: 3,
      label: "Complete",
      active: false,
      subSteps: [],
    },
  ];

  const progressValue = Math.round(
    (currentQuestionIndex / ONBOARDING_QUESTIONS.length) * 100,
  );
  const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex];
  const isNumberQuestion = currentQuestion?.type === "number";
  const currentNumberConfig = currentQuestion
    ? NUMBER_QUESTION_CONFIG[currentQuestion.key]
    : undefined;
  const currentInlineUnitLabel = currentNumberConfig
    ? getInlineUnitLabel(currentNumberConfig.unitLabel)
    : null;

  const adjustNumericAnswer = (direction: -1 | 1) => {
    if (!currentQuestion || currentQuestion.type !== "number") return;

    const config = NUMBER_QUESTION_CONFIG[currentQuestion.key];
    if (!config) return;

    const fallbackBase =
      typeof config.min === "number" ? config.min : 0;
    const currentValue =
      questionAnswer.trim() === "" ? fallbackBase : parseFloat(questionAnswer);
    const safeCurrent = Number.isNaN(currentValue) ? fallbackBase : currentValue;
    let nextValue = safeCurrent + direction * config.step;

    if (typeof config.min === "number") {
      nextValue = Math.max(config.min, nextValue);
    }

    if (typeof config.max === "number") {
      nextValue = Math.min(config.max, nextValue);
    }

    setQuestionAnswer(formatNumberValue(nextValue, config.step));
    setOnboardingError(null);
  };

  return (
    <div
      className="flex min-h-screen flex-col gap-3 bg-[#FB8500] p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6 lg:flex-row"
      style={{ fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif" }}
    >
      <Sidebar userName={getUserName()} />

      <main className="flex flex-1 flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-[2px_2px_0_#1a1a1a] lg:flex-row">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b-[3px] border-black bg-[#FB8500] p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-black">
                  Fee Estimator
                </p>
                <h1 className="text-xl font-black text-white sm:text-2xl">
                  {step === "onboarding"
                    ? "AI Evaluation Survey"
                    : "Base Rate Estimator"}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {step === "onboarding" ? (
              <div className="mx-auto flex max-w-3xl flex-col gap-6 nb-cut-in-up">
                <section className="estimator-panel estimator-panel-muted">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="estimator-eyebrow">Question {currentQuestionIndex + 1}</p>
                      <h2 className="estimator-kicker">
                        Sustainable rate setup
                      </h2>
                    </div>
                    <span className="estimator-badge estimator-badge-accent">
                      {progressValue}%
                    </span>
                  </div>

                  <div className="mb-6 h-4 rounded-full border-2 border-black bg-white p-[2px]">
                    <div
                      className="h-full rounded-full bg-[#FB8500]"
                      style={{
                        width: `${(currentQuestionIndex / ONBOARDING_QUESTIONS.length) * 100}%`,
                      }}
                    />
                  </div>

                  {currentQuestion ? (
                    <form onSubmit={submitAnswer} className="space-y-4">
                      <h3 className="text-xl font-black text-black">
                        {currentQuestion.question}
                      </h3>

                      {onboardingError && (
                        <div className="estimator-alert estimator-alert-error">
                          {onboardingError}
                        </div>
                      )}

                      {isNumberQuestion && currentNumberConfig ? (
                        <div className="estimator-stack">
                          <div className="estimator-panel bg-white">
                            <div className="estimator-number-stepper">
                              <button
                                type="button"
                                onClick={() => adjustNumericAnswer(-1)}
                                disabled={isSubmittingAnswer}
                                className="btn btn-secondary nb-pressable estimator-stepper-btn"
                              >
                                -
                              </button>

                              <div className="estimator-input-shell">
                                {currentInlineUnitLabel && (
                                  <span className="estimator-input-suffix">
                                    {currentInlineUnitLabel}
                                  </span>
                                )}

                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min={currentNumberConfig.min}
                                  max={currentNumberConfig.max}
                                  step={currentNumberConfig.step}
                                  value={questionAnswer}
                                  onChange={(e) => {
                                    setQuestionAnswer(e.target.value);
                                    setOnboardingError(null);
                                  }}
                                  placeholder={currentNumberConfig.placeholder}
                                  className={`form-input text-lg font-black ${
                                    currentInlineUnitLabel
                                      ? "estimator-suffixed-input"
                                      : "text-center"
                                  }`}
                                  required
                                  autoFocus
                                  disabled={isSubmittingAnswer}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => adjustNumericAnswer(1)}
                                disabled={isSubmittingAnswer}
                                className="btn btn-primary nb-pressable estimator-stepper-btn"
                              >
                                +
                              </button>
                            </div>

                            {typeof currentNumberConfig.min === "number" &&
                              typeof currentNumberConfig.max === "number" && (
                                <div className="mt-3 flex justify-start">
                                  <span className="estimator-microcopy">
                                    Range: {currentNumberConfig.min} to{" "}
                                    {currentNumberConfig.max}
                                  </span>
                                </div>
                              )}
                          </div>

                          {currentNumberConfig.showRange && (
                            <div className="estimator-panel estimator-panel-muted">
                              <p className="estimator-eyebrow">Quick Adjust</p>
                              <div className="estimator-range-row">
                                <span className="estimator-range-label">
                                  {currentNumberConfig.min}
                                </span>
                                <input
                                  type="range"
                                  min={currentNumberConfig.min}
                                  max={currentNumberConfig.max}
                                  step={currentNumberConfig.step}
                                  value={
                                    questionAnswer.trim() === ""
                                      ? currentNumberConfig.min
                                      : questionAnswer
                                  }
                                  onChange={(e) => {
                                    setQuestionAnswer(e.target.value);
                                    setOnboardingError(null);
                                  }}
                                  className="deliverable-slider"
                                  disabled={isSubmittingAnswer}
                                  style={{ flex: 1 }}
                                />
                                <span className="estimator-range-label">
                                  {currentNumberConfig.max}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={questionAnswer}
                          onChange={(e) => setQuestionAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          className="form-input"
                          required
                          autoFocus
                          disabled={isSubmittingAnswer}
                        />
                      )}

                      <div className="estimator-mobile-actions justify-end">
                        <button
                          type="submit"
                          disabled={isSubmittingAnswer || !questionAnswer.trim()}
                          className="btn btn-primary nb-pressable"
                        >
                          {isSubmittingAnswer ? "Submitting..." : "Continue"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="estimator-note-card text-center">
                      <p className="estimator-kicker">Preparing next step</p>
                      <p className="estimator-microcopy">
                        Loading question...
                      </p>
                    </div>
                  )}
                </section>

                <div className="estimator-mobile-actions">
                  <button
                    onClick={() => navigate("/fee-estimator")}
                    className="btn btn-secondary nb-pressable"
                  >
                    Back to estimator
                  </button>
                </div>
              </div>
            ) : aiCalculation ? (
              <div className="mx-auto flex max-w-4xl flex-col gap-6 nb-cut-in-up">
                <section className="estimator-panel">
                  <div className="estimator-panel-header-wrap">
                    <div>
                      <p className="estimator-eyebrow">Cost Breakdown</p>
                      <h2 className="estimator-kicker">
                        Annual expense view
                      </h2>
                    </div>
                    <span className="estimator-badge">$ costs x 12 months</span>
                  </div>

                  <div className="estimator-stat-list">
                    <div className="estimator-stat-row">
                      <span>Annual equipment costs</span>
                      <span className="estimator-value">
                        $
                        {(
                          parseFloat(onboardingData.fixed_costs_equipment || "0") *
                          12
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="estimator-stat-row">
                      <span>Annual rent or workspace</span>
                      <span className="estimator-value">
                        $
                        {(
                          parseFloat(onboardingData.fixed_costs_rent || "0") * 12
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="estimator-stat-row">
                      <span>Annual labor costs</span>
                      <span className="estimator-value">$0.00</span>
                    </div>
                    <div className="estimator-stat-row estimator-stat-row-accent">
                      <span>Total monthly expenses</span>
                      <span className="estimator-value">
                        ${aiCalculation.breakdown.total_monthly_costs.toFixed(2)}/mo
                      </span>
                    </div>
                  </div>
                </section>

                <section className="estimator-panel estimator-panel-muted">
                  <p className="estimator-eyebrow">Calculation Process</p>
                  <h3 className="estimator-kicker">How the rate is built</h3>
                  <div className="estimator-stat-list" style={{ marginTop: "1rem" }}>
                    <div className="estimator-stat-row">
                      <span>Total expenses</span>
                      <strong>
                        ${aiCalculation.breakdown.total_monthly_costs.toFixed(2)}/mo
                      </strong>
                    </div>
                    <div className="estimator-stat-row">
                      <span>Expected income</span>
                      <strong>
                        ${aiCalculation.breakdown.desired_income.toFixed(2)}/mo
                      </strong>
                    </div>
                    <div className="estimator-stat-row">
                      <span>Total price</span>
                      <strong>
                        $
                        {(
                          aiCalculation.breakdown.total_monthly_costs +
                          aiCalculation.breakdown.desired_income
                        ).toFixed(2)}
                        /mo
                      </strong>
                    </div>
                    <div className="estimator-stat-row">
                      <span>
                        Profit margin (
                        {aiCalculation.breakdown.profit_margin_percentage.toFixed(
                          0,
                        )}
                        %)
                      </span>
                      <strong>
                        ${aiCalculation.breakdown.profit_amount.toFixed(2)}/mo
                      </strong>
                    </div>
                    <div className="estimator-stat-row estimator-stat-row-accent">
                      <span>Target revenue</span>
                      <strong>
                        ${aiCalculation.breakdown.total_required.toFixed(2)}/mo
                      </strong>
                    </div>
                    <div className="estimator-stat-row">
                      <span>Billable hours per month</span>
                      <strong>
                        {aiCalculation.breakdown.billable_hours.toFixed(0)} hrs
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="estimator-panel estimator-panel-strong">
                  <div className="estimator-panel-header-wrap">
                    <div>
                      <p className="estimator-eyebrow">Result</p>
                      <h3 className="estimator-kicker">Base rate</h3>
                    </div>
                    <span className="estimator-value estimator-value-lg">
                      ${aiCalculation.base_hourly_rate.toFixed(1)}/hr
                    </span>
                  </div>
                  <p className="estimator-body-copy">
                    This gives you a baseline hourly rate that covers your costs,
                    target income, and chosen profit margin.
                  </p>
                </section>

                {saveSuccess && (
                  <div className="estimator-alert estimator-alert-success">
                    Rate saved successfully. Redirecting...
                  </div>
                )}

                {saveError && (
                  <div className="estimator-alert estimator-alert-error">
                    {saveError}
                  </div>
                )}

                <div className="estimator-mobile-actions">
                  <button
                    onClick={handleStartOnboarding}
                    disabled={isSaving}
                    className="btn btn-secondary nb-pressable"
                  >
                    Start over
                  </button>
                  <button
                    onClick={() => setShowBenchmark(true)}
                    disabled={isSaving}
                    className="btn btn-secondary nb-pressable"
                  >
                    View benchmark
                  </button>
                  {user?.user_id ? (
                    <button
                      onClick={handleSaveRate}
                      disabled={isSaving}
                      className="btn btn-primary nb-pressable"
                    >
                      {isSaving ? "Saving..." : "Save rate"}
                    </button>
                  ) : (
                    <div className="estimator-alert estimator-alert-error">
                      Login required to save rate.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="w-full border-t-[3px] border-black bg-[#FFFEF9] p-4 sm:p-6 lg:w-72 lg:border-l-[3px] lg:border-t-0">
          <div className="mb-6">
            <p className="estimator-eyebrow">Progress</p>
            <h2 className="text-lg font-black uppercase tracking-[0.04em] text-[#FB8500]">
              Build your rate
            </h2>
          </div>

          <div className="estimator-progress-nav">
            {progressSteps.map((stepItem, index) => (
              <div key={stepItem.id} className="estimator-progress-item">
                {index < progressSteps.length - 1 && (
                  <div className="estimator-progress-divider" />
                )}
                <div
                  className={`estimator-progress-step ${
                    stepItem.active ? "is-active" : ""
                  }`}
                >
                  <div className="estimator-step-number">{stepItem.id}</div>
                  <div>
                    <h3 className="estimator-step-title">{stepItem.label}</h3>
                    <div className="estimator-step-sublist">
                      {stepItem.subSteps.map((subStep) => (
                        <span key={subStep} className="estimator-step-subtext">
                          {subStep}
                        </span>
                      ))}
                    </div>
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
