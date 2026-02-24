import { useState, useEffect } from 'react';
import type { BenchmarkResponse } from '../../../../shared/api/pricingClient';
import { pricingClient } from '../../../../shared/api/pricingClient';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  skillCategories?: string;
  seniorityLevel?: 'junior' | 'mid' | 'senior' | 'expert';
}

const BenchmarkModal = ({ isOpen, onClose, userId, skillCategories, seniorityLevel }: BenchmarkModalProps) => {
  const [benchmarks, setBenchmarks] = useState<BenchmarkResponse['data']['benchmarks']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchBenchmarks();
    }
  }, [isOpen, userId, skillCategories, seniorityLevel]);

  const fetchBenchmarks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pricingClient.getBenchmarks({
        user_id: userId,
        skill_categories: skillCategories,
        seniority_level: seniorityLevel,
      });
      setBenchmarks(response.data.benchmarks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load benchmarks');
      console.error('Benchmark fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border-[3px] border-black shadow-[4px_4px_0_#1a1a1a] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#FB8500] p-4 sm:p-6 border-b-[3px] border-black flex justify-between items-center sticky top-0">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Market Benchmarks
          </h2>
          <button
            onClick={onClose}
            className="text-white text-2xl font-bold hover:opacity-80 transition-opacity"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FB8500" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0110 10" />
                </svg>
              </div>
              <span className="ml-3 text-gray-600">Loading benchmarks...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : benchmarks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No benchmark data available for your selection.
            </div>
          ) : (
            <div className="space-y-4">
              {benchmarks.map((benchmark) => (
                <div
                  key={`${benchmark.category_id}-${benchmark.seniority_level}`}
                  className="border-2 border-black rounded-lg p-4 hover:shadow-[2px_2px_0_#FB8500] transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#FB8500]">
                        {benchmark.category_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Level: <span className="font-semibold">{benchmark.seniority_level}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-[#FB8500]">
                        ${benchmark.average_rate.toFixed(2)}/Hr
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Average</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-[#FFFEF9] rounded p-3 border border-gray-200">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Minimum</p>
                      <p className="text-lg font-bold text-[#FB8500]">
                        ${benchmark.hourly_rate_min.toFixed(2)}/Hr
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Maximum</p>
                      <p className="text-lg font-bold text-[#FB8500]">
                        ${benchmark.hourly_rate_max.toFixed(2)}/Hr
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Market Context */}
              <div className="mt-6 pt-6 border-t-2 border-gray-300">
                <h4 className="font-bold text-[#FB8500] mb-3">Market Context</h4>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-sm text-gray-700">
                  <p>
                    These benchmarks represent the Cambodia market rates for freelancers and professionals.
                    Rates may vary based on your experience, portfolio quality, and client type.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-[3px] border-black p-4 sm:p-6 flex justify-end gap-3 sticky bottom-0 bg-[#FFFEF9]">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-black rounded-lg text-sm font-bold hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1a1a1a] transition-all duration-150"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkModal;
