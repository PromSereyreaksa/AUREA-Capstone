import { useNavigate } from "react-router-dom";

const FeeEstimatorGrid = () => {
  const navigate = useNavigate();

  const estimationOptions = [
    {
      id: "base-rate",
      title: "Base Rate Estimation",
      description: "Calculate your hourly rate.",
      route: "/fee-estimator/base-rate",
      preview: (
        <div className="bg-white rounded-lg p-4 border-2 border-black">
          <div className="bg-[#FB8500] text-white text-xs font-bold px-3 py-1 rounded mb-3">
            Base(Hour) Rate Calculation
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <div className="font-semibold mb-1">Freelance Experience</div>
              <div className="bg-gray-100 rounded px-2 py-1 border border-gray-300">
                Beginner (1-2 years)
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">
                Annual Work/Freelance Rate
              </div>
              <div className="bg-gray-100 rounded px-2 py-1 border border-gray-300">
                ៛ 3000
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">
                Annual Work/Freelance Days
              </div>
              <div className="bg-gray-100 rounded px-2 py-1 border border-gray-300">
                220 (Recommend: 200-240 days)
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">Annual Labor Costs</div>
              <div className="bg-gray-100 rounded px-2 py-1 border border-gray-300">
                ៛ 1000
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "project-base",
      title: "Portfolio-Based Estimation",
      description: "Analyze your portfolio to calculate your rate.",
      route: "/fee-estimator/portfolio-based",
      preview: (
        <div className="bg-white rounded-lg p-4 border-2 border-black">
          <div className="bg-[#FB8500] text-white text-xs font-bold px-3 py-1 rounded mb-3">
            Portfolio Based Calculation
          </div>
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <div className="w-12 h-12 border-2 border-dashed border-gray-400 rounded flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#999"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="text-xs text-center text-gray-600">
              <div className="font-semibold mb-1">
                Share your portfolio
              </div>
              <div className="text-[10px] text-gray-500">
                Upload URL, PDF, or describe your work
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs">
            <div className="font-semibold mb-2">AI-Powered Analysis</div>
            <div className="bg-gray-100 rounded px-2 py-1 border border-gray-300 text-gray-400">
              Get instant rate recommendation
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-lg sm:text-xl font-bold text-[#FB8500] text-center mb-6 sm:mb-8">
        Please select one option of the estimation
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {estimationOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => navigate(option.route)}
            className="group bg-white rounded-2xl p-6 border-[3px] border-black shadow-[4px_4px_0_#1a1a1a] hover:shadow-[6px_6px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 text-left"
          >
            {/* Preview */}
            <div className="mb-4 transform group-hover:scale-[1.02] transition-transform duration-150">
              {option.preview}
            </div>

            {/* Title */}
            <h3 className="text-lg font-extrabold text-[#FB8500] mb-2">
              {option.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-700 font-medium">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeeEstimatorGrid;
