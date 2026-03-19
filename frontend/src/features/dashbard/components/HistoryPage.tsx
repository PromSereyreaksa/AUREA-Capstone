import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import Sidebar from "../../../shared/components/Sidebar";
import { dashboardService } from "../services";
import type { RecentProject } from "../services";

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
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Calculation History
          </h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-[#FFE8DC] border-2 border-black rounded-lg text-xs sm:text-sm font-bold"
          >
            Back
          </button>
        </div>

        {loading && <p className="font-semibold text-black">Loading history...</p>}
        {error && <p className="font-semibold text-red-700">{error}</p>}

        {!loading && !error && (
          <>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 bg-white rounded-lg border-2 border-black"
                >
                  <div>
                    <h4 className="text-sm font-bold text-black">{item.name}</h4>
                    <p className="text-xs font-medium text-black">{item.clientName}</p>
                  </div>
                  <div className="text-xs font-semibold text-gray-700">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-5">
              <p className="text-xs sm:text-sm font-semibold text-black">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 bg-[#FFE8DC] border-2 border-black rounded-lg text-xs sm:text-sm font-bold disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 bg-[#FB8500] text-white border-2 border-black rounded-lg text-xs sm:text-sm font-bold disabled:opacity-50"
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
