import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/context/AuthContext";
import Sidebar from "../../../../shared/components/Sidebar";
import { pricingClient } from "../../../../shared/api/pricingClient";
import NeobrutalDropdown from "../../components/NeobrutalDropdown";
import "../../shared/styles/fee-estimator.css";

interface AnalysisResult {
  seniority_level: string;
  skill_areas: string[];
  specialization: string;
  portfolio_quality_tier: string;
  experience_indicators: {
    years_estimated: number;
    project_count: number;
    client_types: string[];
  };
  confidence: string;
}

interface RateCalculation {
  recommended_hourly_rate: number;
  rate_range: {
    min: number;
    max: number;
  };
  adjustments_applied: {
    base_rate: number;
    seniority_multiplier: number;
    portfolio_quality_bonus: number;
    client_region_factor: number;
  };
}

const mapAnalysisFromResponse = (payload: any): AnalysisResult | null => {
  if (payload?.analysis) {
    return payload.analysis as AnalysisResult;
  }

  if (payload?.portfolio_signals || payload?.confirmed_values) {
    const signals = payload.portfolio_signals || {};
    const confirmed = payload.confirmed_values || {};
    return {
      seniority_level:
        confirmed.seniority_level || signals.seniority_level || "mid",
      skill_areas: confirmed.skill_areas || signals.skill_areas || [],
      specialization:
        confirmed.specialization || signals.specialization || "General Design",
      portfolio_quality_tier:
        confirmed.portfolio_quality_tier ||
        signals.portfolio_quality_tier ||
        "standard",
      experience_indicators: {
        years_estimated: Math.max(
          1,
          Math.round((signals?.evidence?.length || 3) * 1.5),
        ),
        project_count: signals?.evidence?.length || 0,
        client_types: [],
      },
      confidence: confirmed.confidence || signals.confidence || "medium",
    };
  }

  return null;
};

const mapCalculationFromResponse = (payload: any): RateCalculation | null => {
  if (payload?.rate_calculation) {
    return payload.rate_calculation as RateCalculation;
  }

  const suggested = payload?.suggested_rate;
  if (suggested) {
    return {
      recommended_hourly_rate: suggested.hourly_rate || 0,
      rate_range: {
        min: suggested.rate_range?.low || suggested.hourly_rate || 0,
        max: suggested.rate_range?.high || suggested.hourly_rate || 0,
      },
      adjustments_applied: {
        base_rate: suggested.base_rate || suggested.hourly_rate || 0,
        seniority_multiplier: suggested.seniority_multiplier || 1,
        portfolio_quality_bonus: 1,
        client_region_factor: 1,
      },
    };
  }

  const aiRate = payload?.ai_recommended_rate;
  if (aiRate) {
    return {
      recommended_hourly_rate: aiRate.hourly_rate || 0,
      rate_range: {
        min: aiRate.rate_range?.low || aiRate.hourly_rate || 0,
        max: aiRate.rate_range?.high || aiRate.hourly_rate || 0,
      },
      adjustments_applied: {
        base_rate:
          payload?.ai_calculation_breakdown?.base_rate ||
          aiRate.hourly_rate ||
          0,
        seniority_multiplier:
          payload?.ai_calculation_breakdown?.seniority_multiplier || 1,
        portfolio_quality_bonus: 1,
        client_region_factor:
          payload?.ai_calculation_breakdown?.client_multiplier || 1,
      },
    };
  }

  return null;
};

const mapReasoningFromResponse = (payload: any): string => {
  return (
    payload?.reasoning ||
    payload?.explainability?.summary ||
    payload?.ai_recommended_rate?.reasoning ||
    payload?.suggested_rate?.note ||
    "Rate recommendation generated."
  );
};

const clientTypeOptions = [
  { value: "startup", label: "Startup" },
  { value: "sme", label: "Small/Medium Enterprises" },
  { value: "corporate", label: "Large Corporations" },
  { value: "ngo", label: "Non-governmental Organizations" },
  { value: "government", label: "Government Agencies" },
];

const regionOptions = [
  { value: "cambodia", label: "Cambodia" },
  { value: "southeast_asia", label: "Southeast Asia" },
  { value: "global", label: "Global" },
];

const inputModes = [
  { id: "url", label: "Portfolio URL" },
  { id: "pdf", label: "PDF Upload" },
  { id: "text", label: "Describe Your Work" },
  { id: "manual", label: "Manual Entry" },
] as const;

const PBEstimationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasBackendAuth = Boolean(localStorage.getItem("auth_token"));
  const [step, setStep] = useState<"input" | "result">("input");
  const [inputMode, setInputMode] =
    useState<"url" | "pdf" | "text" | "manual">("url");

  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioText, setPortfolioText] = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [clientType, setClientType] = useState<string>("sme");
  const [clientRegion, setClientRegion] = useState<string>("cambodia");
  const [useAI, setUseAI] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [experienceYears, setExperienceYears] = useState("");
  const [skills, setSkills] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [overrideSeniority, setOverrideSeniority] = useState("");

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [calculation, setCalculation] = useState<RateCalculation | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const getUserName = () => {
    if (user?.first_name) return user.first_name;
    if (user?.last_name) return user.last_name;
    if (user?.email) return user.email.split("@")[0];
    return "Designer";
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setPortfolioFile(e.target.files[0]);
      setValidationError(null);
    }
  };

  const validatePortfolioInput = (): boolean => {
    setValidationError(null);

    if (inputMode === "url" && !portfolioUrl.trim()) {
      setValidationError("Please enter a valid portfolio URL.");
      return false;
    }
    if (inputMode === "pdf" && !portfolioFile) {
      setValidationError("Please select a PDF file.");
      return false;
    }
    if (inputMode === "text" && !portfolioText.trim()) {
      setValidationError("Please describe your portfolio and work experience.");
      return false;
    }
    if (inputMode === "manual") {
      if (!experienceYears || parseFloat(experienceYears) === 0) {
        setValidationError("Years of experience is required.");
        return false;
      }
      if (!skills.trim()) {
        setValidationError("Please enter your skills.");
        return false;
      }
    }

    return true;
  };

  const handleAnalyze = async () => {
    if (!hasBackendAuth) {
      setAnalysisError("User not authenticated");
      return;
    }

    if (!validatePortfolioInput()) {
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      setAcceptError(null);

      const requestData: any = {
        user_id: user?.user_id || 1,
        client_type: clientType,
        client_region: clientRegion,
        use_ai: useAI,
      };

      if (inputMode === "pdf" && portfolioFile) {
        const formData = new FormData();
        formData.append("user_id", String(user?.user_id || 1));
        formData.append("portfolio_pdf", portfolioFile);
        formData.append("client_type", clientType);
        formData.append("client_region", clientRegion);
        formData.append("use_ai", useAI.toString());

        const response = await pricingClient.portfolioAssist(formData);
        if (!response.success) {
          setAnalysisError(response.error?.message || "Analysis failed");
          return;
        }

        setAnalysis(mapAnalysisFromResponse(response.data));
        setCalculation(mapCalculationFromResponse(response.data));
        setReasoning(mapReasoningFromResponse(response.data));
        setStep("result");
        return;
      }

      if (inputMode === "url") {
        requestData.portfolio_url = portfolioUrl;
      } else if (inputMode === "text") {
        requestData.portfolio_text = portfolioText;
      } else if (inputMode === "manual") {
        requestData.experience_years = parseInt(experienceYears, 10);
        requestData.skills = skills;
        if (hoursPerWeek) {
          requestData.hours_per_week = parseInt(hoursPerWeek, 10);
        }
        if (overrideSeniority) {
          requestData.overrides = { seniority_level: overrideSeniority };
        }
      }

      const response = await pricingClient.portfolioAssist(requestData);
      if (!response.success) {
        setAnalysisError(response.error?.message || "Analysis failed");
        return;
      }

      setAnalysis(mapAnalysisFromResponse(response.data));
      setCalculation(mapCalculationFromResponse(response.data));
      setReasoning(mapReasoningFromResponse(response.data));
      setStep("result");
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : "Failed to analyze portfolio",
      );
      console.error("Portfolio analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptRate = async () => {
    if (!hasBackendAuth || !calculation) {
      setAcceptError("User not authenticated or rate not calculated");
      return;
    }

    try {
      setIsAccepting(true);
      setAcceptError(null);

      const response = await pricingClient.acceptPortfolioRate({
        hourly_rate: calculation.recommended_hourly_rate,
        seniority_level: analysis?.seniority_level,
        experience_years: analysis?.experience_indicators.years_estimated,
        skill_categories: [],
        desired_monthly_income: calculation.recommended_hourly_rate * 160,
        billable_hours_per_month: 160,
        profit_margin: 0.15,
      });

      if (response.success) {
        setTimeout(() => {
          navigate("/fee-estimator");
        }, 1500);
      }
    } catch (err) {
      setAcceptError(
        err instanceof Error ? err.message : "Failed to accept rate",
      );
      console.error("Accept rate error:", err);
    } finally {
      setIsAccepting(false);
    }
  };

  const progressSteps = [
    {
      id: 1,
      label: "Portfolio Input",
      active: step === "input",
      subSteps: ["Pick input mode", "Add your work", "Choose market"],
    },
    {
      id: 2,
      label: "AI Result",
      active: step === "result",
      subSteps: ["Analysis", "Rate recommendation", "Save profile"],
    },
    {
      id: 3,
      label: "Complete",
      active: false,
      subSteps: [],
    },
  ];

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
                  {step === "input"
                    ? "Portfolio Analysis"
                    : "Portfolio Rate Recommendation"}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {step === "input" ? (
              <div className="mx-auto flex max-w-4xl flex-col gap-6 nb-cut-in-up">
                <section className="estimator-panel">
                  <p className="estimator-eyebrow">Input Mode</p>
                  <h2 className="estimator-kicker">
                    How do you want to provide your portfolio?
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {inputModes.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() =>
                          setInputMode(
                            mode.id as "url" | "pdf" | "text" | "manual",
                          )
                        }
                        className={`rounded-xl border-[2px] px-4 py-4 text-left text-sm font-black uppercase tracking-[0.04em] transition-[transform,box-shadow,background-color,border-color,color] duration-150 ${
                          inputMode === mode.id
                            ? "border-black bg-[#FFE8DC] text-[#FB8500] shadow-[4px_4px_0_#1a1a1a]"
                            : "border-black bg-white text-black shadow-[2px_2px_0_#1a1a1a]"
                        } nb-pressable`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="estimator-panel estimator-panel-muted">
                  <p className="estimator-eyebrow">Portfolio Data</p>
                  <h3 className="estimator-kicker">Tell the system about your work</h3>

                  <div className="mt-4 estimator-stack">
                    {inputMode === "url" && (
                      <div className="form-group">
                        <label className="form-label">Portfolio URL</label>
                        <input
                          type="url"
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          placeholder="https://example.com/portfolio"
                          className="form-input"
                        />
                      </div>
                    )}

                    {inputMode === "pdf" && (
                      <div className="form-group">
                        <label className="form-label">
                          Upload Portfolio PDF
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="form-input"
                        />
                        {portfolioFile && (
                          <div
                            className="estimator-alert estimator-alert-note"
                            style={{ marginTop: "0.75rem" }}
                          >
                            Selected: {portfolioFile.name}
                          </div>
                        )}
                      </div>
                    )}

                    {inputMode === "text" && (
                      <div className="form-group">
                        <label className="form-label">
                          Describe your portfolio and work experience
                        </label>
                        <textarea
                          value={portfolioText}
                          onChange={(e) => setPortfolioText(e.target.value)}
                          placeholder="Describe your best projects, skills, experience level, and the kinds of clients you work with..."
                          rows={6}
                          className="form-textarea"
                        />
                      </div>
                    )}

                    {inputMode === "manual" && (
                      <div className="estimator-grid-two">
                        <div className="form-group">
                          <label className="form-label">Years of experience</label>
                          <input
                            type="number"
                            value={experienceYears}
                            onChange={(e) => setExperienceYears(e.target.value)}
                            placeholder="e.g. 5"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Hours per week</label>
                          <input
                            type="number"
                            value={hoursPerWeek}
                            onChange={(e) => setHoursPerWeek(e.target.value)}
                            placeholder="e.g. 35"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Skills</label>
                          <input
                            type="text"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="UI Design, Branding, Illustration"
                            className="form-input"
                          />
                        </div>
                        <NeobrutalDropdown
                          label="Override seniority"
                          value={overrideSeniority}
                          onChange={setOverrideSeniority}
                          placeholder="Let AI determine"
                          options={[
                            { value: "", label: "Let AI determine" },
                            { value: "junior", label: "Junior" },
                            { value: "mid", label: "Mid-level" },
                            { value: "senior", label: "Senior" },
                            { value: "expert", label: "Expert" },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                </section>

                <section className="estimator-panel">
                  <p className="estimator-eyebrow">Market Context</p>
                  <h3 className="estimator-kicker">Choose who this rate is for</h3>

                  <div className="mt-4 estimator-grid-two">
                    <NeobrutalDropdown
                      label="Primary client type"
                      value={clientType}
                      onChange={setClientType}
                      options={clientTypeOptions}
                    />

                    <NeobrutalDropdown
                      label="Client region / market"
                      value={clientRegion}
                      onChange={setClientRegion}
                      options={regionOptions}
                    />
                  </div>

                  <label className="estimator-toggle-row mt-2">
                    <input
                      type="checkbox"
                      checked={useAI}
                      onChange={(e) => setUseAI(e.target.checked)}
                      className="estimator-toggle-input"
                    />
                    <span className="estimator-toggle-copy">
                      Use AI to analyze and recommend a rate
                    </span>
                  </label>
                </section>

                {validationError && (
                  <div className="estimator-alert estimator-alert-error">
                    {validationError}
                  </div>
                )}

                {analysisError && (
                  <div className="estimator-alert estimator-alert-error">
                    {analysisError}
                  </div>
                )}

                <div className="estimator-mobile-actions">
                  <button
                    onClick={() => navigate("/fee-estimator")}
                    disabled={isAnalyzing}
                    className="btn btn-secondary nb-pressable"
                  >
                    Back
                  </button>
                  {hasBackendAuth ? (
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="btn btn-primary nb-pressable"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze & get rate"}
                    </button>
                  ) : (
                    <div className="estimator-alert estimator-alert-error">
                      Login required to analyze.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex max-w-4xl flex-col gap-6 nb-cut-in-up">
                {analysis && (
                  <section className="estimator-panel estimator-panel-muted">
                    <div className="estimator-panel-header-wrap">
                      <div>
                        <p className="estimator-eyebrow">Analysis</p>
                        <h2 className="estimator-kicker">Portfolio readout</h2>
                      </div>
                      <span className="estimator-badge">{analysis.confidence} confidence</span>
                    </div>

                    <div className="estimator-kpi-grid" style={{ marginTop: "1rem" }}>
                      <div className="estimator-kpi">
                        <p className="estimator-kpi-label">Seniority</p>
                        <p className="estimator-kpi-number capitalize">
                          {analysis.seniority_level}
                        </p>
                      </div>
                      <div className="estimator-kpi">
                        <p className="estimator-kpi-label">Specialization</p>
                        <p className="estimator-kpi-number" style={{ fontSize: "1rem" }}>
                          {analysis.specialization}
                        </p>
                      </div>
                      <div className="estimator-kpi">
                        <p className="estimator-kpi-label">Portfolio quality</p>
                        <p className="estimator-kpi-number capitalize">
                          {analysis.portfolio_quality_tier}
                        </p>
                      </div>
                      <div className="estimator-kpi">
                        <p className="estimator-kpi-label">Estimated experience</p>
                        <p className="estimator-kpi-number">
                          {analysis.experience_indicators.years_estimated} years
                        </p>
                      </div>
                    </div>

                    {analysis.skill_areas.length > 0 && (
                      <div style={{ marginTop: "1rem" }}>
                        <p className="estimator-eyebrow">Skill Areas</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.skill_areas.map((skill) => (
                            <span key={skill} className="estimator-pill">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {calculation && (
                  <section className="estimator-panel estimator-panel-strong">
                    <div className="estimator-panel-header-wrap">
                      <div>
                        <p className="estimator-eyebrow">Recommendation</p>
                        <h2 className="estimator-kicker">Portfolio-based rate</h2>
                      </div>
                      <span className="estimator-value estimator-value-lg">
                        ${calculation.recommended_hourly_rate.toFixed(2)}/hr
                      </span>
                    </div>

                    <div className="estimator-grid-two" style={{ marginTop: "1rem" }}>
                      <div className="estimator-kpi">
                        <p className="estimator-kpi-label">Rate floor</p>
                        <p className="estimator-kpi-number">
                          ${calculation.rate_range.min.toFixed(2)}
                        </p>
                      </div>
                      <div className="estimator-kpi">
                        <p className="estimator-kpi-label">Rate ceiling</p>
                        <p className="estimator-kpi-number">
                          ${calculation.rate_range.max.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {calculation && (
                  <section className="estimator-panel">
                    <p className="estimator-eyebrow">Adjustments Applied</p>
                    <h3 className="estimator-kicker">How the recommendation shifted</h3>
                    <div className="estimator-stat-list" style={{ marginTop: "1rem" }}>
                      <div className="estimator-stat-row">
                        <span>Base rate</span>
                        <strong>
                          ${calculation.adjustments_applied.base_rate.toFixed(2)}
                        </strong>
                      </div>
                      <div className="estimator-stat-row">
                        <span>Seniority multiplier</span>
                        <strong>
                          {calculation.adjustments_applied.seniority_multiplier.toFixed(
                            2,
                          )}
                          x
                        </strong>
                      </div>
                      <div className="estimator-stat-row">
                        <span>Portfolio quality bonus</span>
                        <strong>
                          {calculation.adjustments_applied.portfolio_quality_bonus.toFixed(
                            2,
                          )}
                          x
                        </strong>
                      </div>
                      <div className="estimator-stat-row estimator-stat-row-accent">
                        <span>Regional factor</span>
                        <strong>
                          {calculation.adjustments_applied.client_region_factor.toFixed(
                            2,
                          )}
                          x
                        </strong>
                      </div>
                    </div>
                  </section>
                )}

                <section className="estimator-note-card">
                  <p className="estimator-eyebrow">Reasoning</p>
                  <h3 className="estimator-kicker">Why this rate fits</h3>
                  <p className="estimator-body-copy" style={{ marginTop: "0.75rem" }}>
                    {reasoning}
                  </p>
                </section>

                {acceptError && (
                  <div className="estimator-alert estimator-alert-error">
                    {acceptError}
                  </div>
                )}

                <div className="estimator-mobile-actions">
                  <button
                    onClick={() => setStep("input")}
                    disabled={isAccepting}
                    className="btn btn-secondary nb-pressable"
                  >
                    Adjust
                  </button>
                  {hasBackendAuth ? (
                    <button
                      onClick={handleAcceptRate}
                      disabled={isAccepting}
                      className="btn btn-primary nb-pressable"
                    >
                      {isAccepting ? "Saving..." : "Accept & save rate"}
                    </button>
                  ) : (
                    <div className="estimator-alert estimator-alert-error">
                      Login required to save rate.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="w-full border-t-[3px] border-black bg-[#FFFEF9] p-4 sm:p-6 lg:w-72 lg:border-l-[3px] lg:border-t-0">
          <div className="mb-6">
            <p className="estimator-eyebrow">Progress</p>
            <h2 className="text-lg font-black uppercase tracking-[0.04em] text-[#FB8500]">
              Portfolio rate flow
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
    </div>
  );
};

export default PBEstimationPage;
