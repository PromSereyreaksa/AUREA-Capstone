import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../../auth/context/AuthContext';
import Sidebar from '../../../../shared/components/Sidebar';
import { pricingClient } from '../../../../shared/api/pricingClient';

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

const PBEstimationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"input" | "analysis" | "result">("input");
  const [inputMode, setInputMode] = useState<"url" | "pdf" | "text" | "manual">("url");

  // Form states
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioText, setPortfolioText] = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [clientType, setClientType] = useState<string>("sme");
  const [clientRegion, setClientRegion] = useState<string>("cambodia");
  const [useAI, setUseAI] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Manual override states
  const [experienceYears, setExperienceYears] = useState("");
  const [skills, setSkills] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [overrideSeniority, setOverrideSeniority] = useState("");

  // Result states
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
    return "Designer";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPortfolioFile(e.target.files[0]);
      setValidationError(null);
    }
  };

  const validatePortfolioInput = (): boolean => {
    setValidationError(null);

    if (inputMode === "url" && !portfolioUrl.trim()) {
      setValidationError("Please enter a valid portfolio URL");
      return false;
    }
    if (inputMode === "pdf" && !portfolioFile) {
      setValidationError("Please select a PDF file");
      return false;
    }
    if (inputMode === "text" && !portfolioText.trim()) {
      setValidationError("Please describe your portfolio and work experience");
      return false;
    }
    if (inputMode === "manual") {
      if (!experienceYears || parseFloat(experienceYears) === 0) {
        setValidationError("Years of experience is required");
        return false;
      }
      if (!skills || !skills.trim()) {
        setValidationError("Please enter your skills");
        return false;
      }
    }

    return true;
  };

  const handleAnalyze = async () => {
    if (!user || !user.user_id) {
      setAnalysisError("User not authenticated");
      return;
    }

    // Validate input
    if (!validatePortfolioInput()) {
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      let requestData: any = {
        user_id: user.user_id,
        client_type: clientType,
        client_region: clientRegion,
        use_ai: useAI,
      };

      if (inputMode === "pdf" && portfolioFile) {
        // Handle PDF upload with FormData
        const formData = new FormData();
        formData.append("user_id", user.user_id.toString());
        formData.append("portfolio_pdf", portfolioFile);
        formData.append("client_type", clientType);
        formData.append("client_region", clientRegion);
        formData.append("use_ai", useAI.toString());

        const response = await pricingClient.portfolioAssist(formData);
        if (response.success) {
          setAnalysis(response.data.analysis);
          setCalculation(response.data.rate_calculation);
          setReasoning(response.data.reasoning);
          setStep("result");
        } else {
          setAnalysisError(response.error?.message || "Analysis failed");
        }
      } else {
        // Handle URL, text, or manual with JSON
        if (inputMode === "url") {
          requestData.portfolio_url = portfolioUrl;
        } else if (inputMode === "text") {
          requestData.portfolio_text = portfolioText;
        } else if (inputMode === "manual") {
          requestData.experience_years = parseInt(experienceYears);
          requestData.skills = skills;
          if (hoursPerWeek) {
            requestData.hours_per_week = parseInt(hoursPerWeek);
          }
          if (overrideSeniority) {
            requestData.overrides = { seniority_level: overrideSeniority };
          }
        }

        const response = await pricingClient.portfolioAssist(requestData);
        if (response.success) {
          setAnalysis(response.data.analysis);
          setCalculation(response.data.rate_calculation);
          setReasoning(response.data.reasoning);
          setStep("result");
        } else {
          setAnalysisError(response.error?.message || "Analysis failed");
        }
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Failed to analyze portfolio");
      console.error("Portfolio analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptRate = async () => {
    if (!user || !user.user_id || !calculation) {
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
        desired_monthly_income: (calculation.recommended_hourly_rate * 160), // Assuming 160 billable hours per month
        billable_hours_per_month: 160,
        profit_margin: 0.15,
      });

      if (response.success) {
        // Show success and redirect
        setTimeout(() => {
          navigate("/fee-estimator");
        }, 1500);
      }
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : "Failed to accept rate");
      console.error("Accept rate error:", err);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FB8500] p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 md:gap-6">
      <Sidebar userName={getUserName()} />

      <main className="flex-1 bg-white rounded-2xl overflow-hidden border-[3px] border-black shadow-[2px_2px_0_#1a1a1a] flex flex-col lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#FB8500] p-4 sm:p-6 border-b-[3px] border-black animate-[slideDown_0.5s_ease-out]">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {step === "input" ? "Portfolio Analysis" : step === "analysis" ? "Analyzing..." : "Portfolio Rate Recommendation"}
            </h1>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
            {step === "input" ? (
              <div className="max-w-2xl space-y-6 animate-[fadeIn_0.4s_ease-out]">
                {/* Input Mode Selection */}
                <section className="animate-[slideUp_0.5s_ease-out]">
                  <h2 className="text-lg sm:text-xl font-bold text-[#FB8500] mb-4">
                    How would you like to provide your portfolio?
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: "url", label: "Portfolio URL", icon: "🔗" },
                      { id: "pdf", label: "PDF Upload", icon: "📄" },
                      { id: "text", label: "Describe Your Work", icon: "✍️" },
                      { id: "manual", label: "Manual Entry", icon: "📋" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setInputMode(mode.id as any)}
                        className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                          inputMode === mode.id
                            ? "border-[#FB8500] bg-[#FFE8DC] text-[#FB8500]"
                            : "border-black bg-white text-gray-700 hover:border-[#FB8500]"
                        }`}
                      >
                        <span className="text-2xl mr-2">{mode.icon}</span>
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Input Section */}
                <section className="space-y-4 animate-[slideUp_0.5s_ease-out_0.1s] opacity-0 [animation-fill-mode:forwards]">
                  {inputMode === "url" && (
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Portfolio URL
                      </label>
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://example.com/portfolio"
                        className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
                      />
                    </div>
                  )}

                  {inputMode === "pdf" && (
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Upload Portfolio PDF (Max 20MB)
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-medium"
                      />
                      {portfolioFile && (
                        <p className="text-sm text-green-600 mt-2">✓ {portfolioFile.name}</p>
                      )}
                    </div>
                  )}

                  {inputMode === "text" && (
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Describe Your Portfolio & Work Experience
                      </label>
                      <textarea
                        value={portfolioText}
                        onChange={(e) => setPortfolioText(e.target.value)}
                        placeholder="Describe your best projects, skills, experience level, and the types of clients you've worked with..."
                        rows={6}
                        className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500] resize-none"
                      />
                    </div>
                  )}

                  {inputMode === "manual" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(e.target.value)}
                          placeholder="e.g., 5"
                          className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Skills (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="e.g., UI Design, Branding, Illustration"
                          className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Hours Per Week
                        </label>
                        <input
                          type="number"
                          value={hoursPerWeek}
                          onChange={(e) => setHoursPerWeek(e.target.value)}
                          placeholder="e.g., 35"
                          className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Override Seniority Level (optional)
                        </label>
                        <select
                          value={overrideSeniority}
                          onChange={(e) => setOverrideSeniority(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
                        >
                          <option value="">Let AI determine</option>
                          <option value="junior">Junior</option>
                          <option value="mid">Mid-level</option>
                          <option value="senior">Senior</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                    </div>
                  )}
                </section>

                {/* Client & Region Selection */}
                <section className="space-y-4 animate-[slideUp_0.5s_ease-out_0.2s] opacity-0 [animation-fill-mode:forwards]">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Primary Client Type
                    </label>
                    <select
                      value={clientType}
                      onChange={(e) => setClientType(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
                    >
                      {clientTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Client Region / Market
                    </label>
                    <select
                      value={clientRegion}
                      onChange={(e) => setClientRegion(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
                    >
                      {regionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useAI}
                      onChange={(e) => setUseAI(e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-black"
                    />
                    <span className="text-sm font-semibold text-black">
                      Use AI to analyze and recommend rate
                    </span>
                  </label>
                </section>

                {/* Validation Error */}
                {validationError && (
                  <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 text-red-700 animate-[slideUp_0.5s_ease-out_0.2s] opacity-0 [animation-fill-mode:forwards]">
                    {validationError}
                  </div>
                )}

                {/* Error Message */}
                {analysisError && (
                  <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 text-red-700 animate-[slideUp_0.5s_ease-out_0.3s] opacity-0 [animation-fill-mode:forwards]">
                    {analysisError}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 animate-[slideUp_0.5s_ease-out_0.3s] opacity-0 [animation-fill-mode:forwards]">
                  <button
                    onClick={() => navigate("/fee-estimator")}
                    disabled={isAnalyzing}
                    className="px-6 py-3 border-2 border-black rounded-lg text-sm font-bold hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1a1a1a] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    BACK
                  </button>
                  {user && user.user_id ? (
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="px-6 py-3 bg-[#FB8500] text-white border-2 border-black rounded-lg text-sm font-bold hover:bg-[#E67700] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1a1a1a] transition-all duration-150 shadow-[2px_2px_0_#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a10 10 0 0110 10" />
                          </svg>
                          ANALYZING...
                        </>
                      ) : (
                        "ANALYZE & GET RATE"
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center px-4 py-3 bg-red-50 text-red-700 border-2 border-red-400 rounded-lg text-sm font-bold shadow-[2px_2px_0_#1a1a1a]">
                      Login required to analyze
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Result View
              <div className="max-w-2xl space-y-6 animate-[fadeIn_0.4s_ease-out]">
                {/* Analysis Results */}
                {analysis && (
                  <>
                    <section className="bg-[#FFE8DC] border-2 border-black rounded-xl p-6 animate-[slideUp_0.5s_ease-out]">
                      <h2 className="text-lg font-bold text-[#FB8500] mb-4">Portfolio Analysis</h2>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-700">Seniority Level:</span>
                          <span className="font-bold text-[#FB8500] capitalize">{analysis.seniority_level}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-700">Specialization:</span>
                          <span className="font-semibold">{analysis.specialization}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-700">Portfolio Quality:</span>
                          <span className="font-semibold capitalize">{analysis.portfolio_quality_tier}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-700">Estimated Experience:</span>
                          <span className="font-semibold">{analysis.experience_indicators.years_estimated} years</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-700">Key Skills:</span>
                          <span className="font-semibold text-right">{analysis.skill_areas.join(", ")}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-700">Confidence:</span>
                          <span className="font-semibold capitalize">{analysis.confidence}</span>
                        </div>
                      </div>
                    </section>

                    {/* Rate Calculation */}
                    {calculation && (
                      <section className="space-y-4 animate-[slideUp_0.5s_ease-out_0.1s] opacity-0 [animation-fill-mode:forwards]">
                        <h2 className="text-lg font-bold text-[#FB8500]">Rate Calculation</h2>

                        <div className="bg-linear-to-r from-[#FFE8DC] to-white p-6 rounded-xl border-2 border-black">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold text-[#FB8500]">RECOMMENDED RATE</span>
                            <span className="text-3xl font-black text-[#FB8500]">
                              ${calculation.recommended_hourly_rate.toFixed(2)}/Hr
                            </span>
                          </div>

                          <div className="bg-white rounded p-3 border border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Range</p>
                            <div className="flex justify-between">
                              <span className="font-semibold">${calculation.rate_range.min.toFixed(2)}</span>
                              <span className="text-gray-500">—</span>
                              <span className="font-semibold">${calculation.rate_range.max.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-2 border-black rounded-lg p-4 space-y-2 text-sm">
                          <h3 className="font-bold text-[#FB8500] mb-3">Adjustments Applied</h3>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Base Rate</span>
                            <span className="font-semibold">${calculation.adjustments_applied.base_rate.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Seniority Multiplier</span>
                            <span className="font-semibold">{calculation.adjustments_applied.seniority_multiplier.toFixed(2)}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Portfolio Quality Bonus</span>
                            <span className="font-semibold">{calculation.adjustments_applied.portfolio_quality_bonus.toFixed(2)}x</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="text-gray-700">Regional Factor</span>
                            <span className="font-semibold">{calculation.adjustments_applied.client_region_factor.toFixed(2)}x</span>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Reasoning */}
                    <section className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 animate-[slideUp_0.5s_ease-out_0.2s] opacity-0 [animation-fill-mode:forwards]">
                      <h3 className="font-bold text-blue-900 mb-2">Analysis Reasoning</h3>
                      <p className="text-sm text-blue-800">{reasoning}</p>
                    </section>
                  </>
                )}

                {/* Error Message */}
                {acceptError && (
                  <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 text-red-700">
                    {acceptError}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 animate-[slideUp_0.5s_ease-out_0.3s] opacity-0 [animation-fill-mode:forwards]">
                  <button
                    onClick={() => setStep("input")}
                    disabled={isAccepting}
                    className="px-6 py-3 border-2 border-black rounded-lg text-sm font-bold hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1a1a1a] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ADJUST
                  </button>
                  {user && user.user_id ? (
                    <button
                      onClick={handleAcceptRate}
                      disabled={isAccepting}
                      className="px-6 py-3 bg-[#FB8500] text-white border-2 border-black rounded-lg text-sm font-bold hover:bg-[#E67700] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1a1a1a] transition-all duration-150 shadow-[2px_2px_0_#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isAccepting ? (
                        <>
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a10 10 0 0110 10" />
                          </svg>
                          SAVING...
                        </>
                      ) : (
                        "ACCEPT & SAVE RATE"
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center px-4 py-3 bg-red-50 text-red-700 border-2 border-red-400 rounded-lg text-sm font-bold shadow-[2px_2px_0_#1a1a1a]">
                      Login required to save rate
                    </div>
                  )}
                </div>
              </div>
            )}
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
            {[
              { id: 1, label: "Portfolio Input", active: step === "input", subSteps: ["Select Input Mode", "Provide Portfolio Data", "Select Client Type"] },
              { id: 2, label: "AI Analysis", active: step === "analysis", subSteps: ["Analyze Experience", "Check Portfolio Quality", "Calculate Rate"] },
              { id: 3, label: "Review & Accept", active: step === "result", subSteps: ["Review Results", "Accept Rate"] },
            ].map((stepItem, index) => (
              <div key={stepItem.id} className="relative animate-[slideRight_0.5s_ease-out] opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: `${index * 0.1}s` }}>
                {index < 2 && <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-[#FB8500]" />}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      stepItem.active ? "bg-[#FB8500] border-[#FB8500]" : "bg-white border-[#FB8500]"
                    }`}
                  >
                    <span className={`text-xs font-bold ${stepItem.active ? "text-white" : "text-[#FB8500]"}`}>
                      {stepItem.id}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold mb-2 ${stepItem.active ? "text-[#FB8500]" : "text-gray-600"}`}>
                      {stepItem.label}
                    </h3>
                    <ul className="space-y-1">
                      {stepItem.subSteps.map((subStep, idx) => (
                        <li key={idx} className={`text-xs ${stepItem.active ? "text-[#FB8500]" : "text-gray-500"}`}>
                          {subStep}
                        </li>
                      ))}
                    </ul>
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
