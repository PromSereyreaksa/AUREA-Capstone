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

const BenchmarkModal = ({
  isOpen,
  onClose,
  userId,
  skillCategories,
  seniorityLevel,
}: BenchmarkModalProps) => {
  const [benchmarks, setBenchmarks] = useState<
    BenchmarkResponse['data']['benchmarks']
  >([]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="estimator-modal-shell">
        <div className="sticky top-0 border-b-[3px] border-black bg-[#FB8500] p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-black">
                Benchmark Data
              </p>
              <h2 className="text-xl font-black text-white sm:text-2xl">
                Market Benchmarks
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-black uppercase tracking-[0.06em] text-black shadow-[2px_2px_0_#1a1a1a] nb-pressable"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          {loading ? (
            <div className="estimator-note-card text-center">
              <p className="estimator-kicker">Loading benchmarks</p>
              <p className="estimator-microcopy">
                Pulling current market comparison data...
              </p>
            </div>
          ) : error ? (
            <div className="estimator-alert estimator-alert-error">{error}</div>
          ) : benchmarks.length === 0 ? (
            <div className="estimator-note-card text-center">
              <p className="estimator-kicker">No benchmark data yet</p>
              <p className="estimator-microcopy">
                No benchmark data is available for the current selection.
              </p>
            </div>
          ) : (
            <div className="estimator-stack">
              {benchmarks.map((benchmark) => (
                <div
                  key={`${benchmark.category_id}-${benchmark.seniority_level}`}
                  className="estimator-panel"
                >
                  <div className="estimator-panel-header-wrap">
                    <div>
                      <p className="estimator-eyebrow">
                        {benchmark.seniority_level} level
                      </p>
                      <h3 className="estimator-kicker">
                        {benchmark.category_name}
                      </h3>
                    </div>
                    <span className="estimator-value">
                      ${benchmark.average_rate.toFixed(2)}/hr
                    </span>
                  </div>

                  <div className="estimator-grid-two">
                    <div className="estimator-kpi">
                      <p className="estimator-kpi-label">Minimum</p>
                      <p className="estimator-kpi-number">
                        ${benchmark.hourly_rate_min.toFixed(2)}/hr
                      </p>
                    </div>
                    <div className="estimator-kpi">
                      <p className="estimator-kpi-label">Maximum</p>
                      <p className="estimator-kpi-number">
                        ${benchmark.hourly_rate_max.toFixed(2)}/hr
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="estimator-note-card">
                <p className="estimator-eyebrow">Market Context</p>
                <h4 className="estimator-kicker">Cambodia benchmark note</h4>
                <p className="estimator-body-copy" style={{ marginTop: '0.75rem' }}>
                  These benchmarks reflect Cambodia freelance market patterns.
                  Final rates still depend on your experience, portfolio quality,
                  and client type.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t-[3px] border-black bg-[#FFFEF9] p-4 sm:p-6">
          <div className="flex justify-end">
            <button onClick={onClose} className="btn btn-secondary nb-pressable">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkModal;
