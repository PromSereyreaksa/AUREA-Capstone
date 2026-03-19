import { useNavigate } from "react-router-dom";

const FeeEstimatorGrid = () => {
  const navigate = useNavigate();

  const estimationOptions = [
    {
      id: "base-rate",
      title: "Base Rate Estimation",
      description: "Calculate the hourly baseline that covers your costs and target income.",
      route: "/fee-estimator/base-rate",
      preview: (
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[3px_3px_0_#1a1a1a]">
          <div className="mb-3 inline-flex rounded-lg border-2 border-black bg-[#FB8500] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-white">
            Base Rate
          </div>
          <div className="space-y-2 text-xs font-semibold text-black">
            <div className="rounded-lg border-2 border-black bg-[#FFF3E8] px-3 py-2">
              Fixed costs + target income
            </div>
            <div className="rounded-lg border-2 border-black bg-white px-3 py-2">
              Billable hours + profit margin
            </div>
            <div className="rounded-lg border-2 border-black bg-[#FFE8DC] px-3 py-2">
              Result: sustainable hourly rate
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "portfolio-based",
      title: "Portfolio-Based Estimation",
      description: "Use your portfolio, PDF, or manual profile to get an AI-assisted rate recommendation.",
      route: "/fee-estimator/portfolio-based",
      preview: (
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[3px_3px_0_#1a1a1a]">
          <div className="mb-3 inline-flex rounded-lg border-2 border-black bg-[#FB8500] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-white">
            Portfolio Rate
          </div>
          <div className="grid gap-2 text-xs font-semibold text-black">
            <div className="rounded-lg border-2 border-black bg-[#FFF3E8] px-3 py-2">
              URL / PDF / text / manual input
            </div>
            <div className="rounded-lg border-2 border-black bg-white px-3 py-2">
              Skill and seniority analysis
            </div>
            <div className="rounded-lg border-2 border-black bg-[#FFE8DC] px-3 py-2">
              Recommended market-facing hourly rate
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "project-based",
      title: "Project-Based Estimation",
      description: "Estimate a real project using scope, time, complexity, and licensing.",
      route: "/fee-estimator/project-base",
      preview: (
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[3px_3px_0_#1a1a1a]">
          <div className="mb-3 inline-flex rounded-lg border-2 border-black bg-[#FB8500] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-white">
            Project Rate
          </div>
          <div className="space-y-2 text-xs font-semibold text-black">
            <div className="rounded-lg border-2 border-black bg-white px-3 py-2">
              Project info + deliverables
            </div>
            <div className="rounded-lg border-2 border-black bg-[#FFF3E8] px-3 py-2">
              Duration + client context + rights
            </div>
            <div className="rounded-lg border-2 border-black bg-[#FFE8DC] px-3 py-2">
              Total project estimate + invoice handoff
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 text-center sm:mb-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-black">
          Fee Estimator
        </p>
        <h2 className="text-xl font-black text-[#FB8500] sm:text-2xl">
          Pick the pricing workflow you need
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        {estimationOptions.map((option, index) => (
          <button
            key={option.id}
            onClick={() => navigate(option.route)}
            className="nb-pressable group flex h-full flex-col rounded-2xl border-[3px] border-black bg-white p-5 text-left shadow-[4px_4px_0_#1a1a1a] sm:p-6"
          >
            <div className="mb-4 nb-cut-in-up">
              {option.preview}
            </div>

            <div className="mt-auto">
              <h3 className="mb-2 text-lg font-black text-[#FB8500]">
                {option.title}
              </h3>
              <p className="text-sm font-medium leading-6 text-gray-700">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeeEstimatorGrid;
