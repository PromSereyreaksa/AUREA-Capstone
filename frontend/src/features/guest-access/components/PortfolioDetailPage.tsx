import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../shared/components/Navbar";
import UserAvatar from "../../../shared/components/UserAvatar";
import { httpClient } from "../../../shared/api/client";

interface PublicPortfolioItem {
  portfolio_id: number;
  portfolio_url: string | null;
  portfolio_cover_url: string | null;
  is_public: boolean;
  user_id: number;
  first_name: string;
  last_name: string;
  profile_avatar: string | null;
  skills: string[];
  seniority_level: string | null;
  categories: { category_id: number; category_name: string }[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const PortfolioDetailPage = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState<PublicPortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!portfolioId) {
        setError("Invalid portfolio id");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await httpClient.get<ApiResponse<PublicPortfolioItem>>(
          `/portfolio/public/${portfolioId}`,
        );
        setPortfolio(response.data);
      } catch (err: any) {
        const message =
          err.message === "Request failed"
            ? "Portfolio not found or not public"
            : err.message;
        setError(message || "Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [portfolioId]);

  const handleBack = () => {
    navigate("/portfolios");
  };

  const handleViewPortfolio = () => {
    if (portfolio?.portfolio_url) {
      window.open(portfolio.portfolio_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <main className="page min-h-screen bg-white">
      <Navbar />
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <button
          className="mb-6 text-sm text-gray-600 hover:text-black"
          onClick={handleBack}
        >
          ← Back to designers
        </button>

        {loading && <div className="text-gray-600">Loading portfolio...</div>}

        {!loading && error && (
          <div className="text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && portfolio && (
          <div className="flex flex-col gap-8">
            <div className="border-2 border-black rounded-2xl overflow-hidden bg-gray-100 aspect-[16/7]">
              {portfolio.portfolio_cover_url ? (
                <img
                  src={portfolio.portfolio_cover_url}
                  alt="Portfolio cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  No cover image provided
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr,1.8fr] gap-10 items-start">
            <div className="flex flex-col items-center md:items-start gap-4">
              <UserAvatar
                name={`${portfolio.first_name} ${portfolio.last_name}`.trim() || "Designer"}
                imageUrl={portfolio.profile_avatar}
                seed={portfolio.user_id}
                className="h-32 w-32 rounded-full border-2 border-black"
                initialsClassName="text-2xl"
              />
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black text-black">
                  {`${portfolio.first_name} ${portfolio.last_name}`.trim() ||
                    "Designer"}
                </h1>
                {portfolio.seniority_level && (
                  <p className="mt-1 text-gray-600 capitalize">
                    {portfolio.seniority_level} designer
                  </p>
                )}
              </div>

              {portfolio.skills && portfolio.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                  {portfolio.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 text-xs rounded-full border border-black text-black bg-white"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {portfolio.categories && portfolio.categories.length > 0 && (
                <div className="mt-4 w-full">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">
                    Categories
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {portfolio.categories.map((category) => (
                      <span
                        key={category.category_id}
                        className="px-3 py-1 text-xs rounded-full bg-black text-white"
                      >
                        {category.category_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-2 border-black rounded-2xl p-6 bg-[#FFF6EB] flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-black mb-2">
                Portfolio
              </h2>
              <p className="text-gray-700 text-sm">
                View this designer&apos;s portfolio in a new tab.
              </p>
              <button
                onClick={handleViewPortfolio}
                disabled={!portfolio.portfolio_url}
                className="mt-2 inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#FB8500] text-white font-semibold transition-colors hover:bg-black disabled:bg-gray-300 disabled:text-gray-600"
              >
                View Portfolio
              </button>
              {!portfolio.portfolio_url && (
                <p className="mt-2 text-xs text-gray-600">
                  This designer has not uploaded a portfolio document yet.
                </p>
              )}
            </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

