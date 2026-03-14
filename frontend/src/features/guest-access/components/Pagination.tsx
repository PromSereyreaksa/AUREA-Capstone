interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const clampedPage = Math.min(Math.max(page, 1), totalPages);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    onPageChange(nextPage);
  };

  const pages: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    pages.push(p);
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        className="font-md w-8 h-8 hover:bg-black hover:text-white transition text-black disabled:text-gray-400 disabled:hover:bg-transparent"
        onClick={() => goToPage(clampedPage - 1)}
        disabled={clampedPage === 1}
      >
        &lt;
      </button>
      {pages.map((num) => (
        <button
          key={num}
          className={`font-md w-8 h-8 rounded flex items-center justify-center transition ${
            num === clampedPage
              ? "bg-[#FB8500] text-white"
              : "text-black hover:bg-black hover:text-white"
          }`}
          onClick={() => goToPage(num)}
        >
          {num}
        </button>
      ))}
      <button
        className="font-md w-8 h-8 hover:bg-black hover:text-white transition text-black disabled:text-gray-400 disabled:hover:bg-transparent"
        onClick={() => goToPage(clampedPage + 1)}
        disabled={clampedPage === totalPages}
      >
        &gt;
      </button>
    </div>
  );
};
