import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import Sidebar from "../../../shared/components/Sidebar";
import { dashboardService } from "../services";
import type { RecentProject } from "../services";
import HistoryItemCard from "./HistoryItemCard";

const HistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const getUserName = () => {
    if (user?.first_name) return user.first_name;
    if (user?.last_name) return user.last_name;
    if (user?.email) return user.email.split("@")[0];
    return "Designer";
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getHistory(page, limit);
        setItems(data.items);
        setTotal(data.total);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FB8500] p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 md:gap-6">
      <Sidebar userName={getUserName()} />

      <main className="flex-1 bg-[#FFFEF9] rounded-2xl p-4 sm:p-6 md:p-8 border-[3px] border-black shadow-[2px_2px_0_#1a1a1a] overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Calculation History
          </h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="nb-pressable w-full sm:w-auto px-4 py-2 bg-[#FFE8DC] border-2 border-black rounded-lg text-xs sm:text-sm font-bold hover:bg-[#FFD8C2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            Back
          </button>
        </div>

        {loading && <p className="font-semibold text-black">Loading history...</p>}
        {error && <p className="font-semibold text-red-700">{error}</p>}

        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-black bg-[#FFF9F4] px-4 py-10 text-center shadow-[2px_2px_0_#1a1a1a]">
                <p className="text-base font-black text-black">No history yet</p>
                <p className="mt-2 text-sm font-medium text-neutral-700">
                  Your saved base-rate updates and project calculations will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" aria-label="Calculation history">
                {items.map((item) => (
                  <li key={item.id}>
                    <HistoryItemCard
                      item={item}
                      showTimestamp={Boolean(item.created_at)}
                      variant="full"
                    />
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5">
              <p className="text-xs sm:text-sm font-semibold text-black">
                Page {page} of {totalPages}
              </p>
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="nb-pressable px-4 py-2 bg-[#FFE8DC] border-2 border-black rounded-lg text-xs sm:text-sm font-bold hover:bg-[#FFD8C2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:bg-[#FFE8DC]"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="nb-pressable px-4 py-2 bg-[#FB8500] text-white border-2 border-black rounded-lg text-xs sm:text-sm font-bold hover:bg-[#D97000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:bg-[#FB8500]"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
