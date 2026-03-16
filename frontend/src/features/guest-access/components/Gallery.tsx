"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PortfolioHeader } from "./PortfolioHeader";
import { SearchBar } from "./SearchBar";
import { GalleryGrid } from "./GalleryGrid";
import { Pagination } from "./Pagination";
import { httpClient } from "../../../shared/api/client";
import type { GalleryItem } from "./GalleryGrid";

interface PublicPortfolioItem {
  portfolio_id: number;
  portfolio_url: string;
  is_public: boolean;
  user_id: number;
  first_name: string;
  last_name: string;
  profile_avatar: string | null;
  skills: string[];
  seniority_level: string | null;
  categories: { category_id: number; category_name: string }[];
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export default function Gallery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPortfolios = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "9");
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      try {
        const response = await httpClient.get<PaginatedResponse<PublicPortfolioItem>>(
          `/portfolio/public?${params.toString()}`,
        );

        const mappedItems: GalleryItem[] = response.data.map((item) => ({
          id: item.portfolio_id,
          name: `${item.first_name} ${item.last_name}`.trim() || "Unnamed Designer",
          title:
            item.categories[0]?.category_name ||
            (item.seniority_level
              ? `${item.seniority_level} designer`
              : "Designer Portfolio"),
          image: item.profile_avatar || "/placeholder.svg",
        }));

        setItems(mappedItems);
        setTotalPages(response.pagination.totalPages || 1);
      } catch (err: any) {
        setError(err.message || "Failed to load portfolios");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolios();
  }, [page, searchTerm]);

  const handleItemClick = (item: GalleryItem) => {
    navigate(`/portfolio/${item.id}`);
  };

  return (
    <section className="px-6 py-12">
      <PortfolioHeader />
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      {error && (
        <div className="text-center text-red-600 mb-4">
          {error}
        </div>
      )}
      {loading && items.length === 0 ? (
        <div className="text-center text-gray-600">Loading portfolios...</div>
      ) : (
        <GalleryGrid items={items} onItemClick={handleItemClick} />
      )}
      <div className="mt-8">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </section>
  );
}
