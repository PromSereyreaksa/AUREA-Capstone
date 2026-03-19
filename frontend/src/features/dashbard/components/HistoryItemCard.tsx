import type { RecentProject } from "../services";

interface HistoryItemCardProps {
  item: RecentProject;
  compact?: boolean;
  showTimestamp?: boolean;
  variant?: "preview" | "full";
}

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF6B35" stroke="none" aria-hidden="true">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const RateIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#FF6B35"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M12 1v22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const formatTimestamp = (value?: string, compact?: boolean) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return compact
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(parsed)
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(parsed);
};

const formatTypeLabel = (type?: RecentProject["type"]) => {
  return type === "base-rate" ? "Base Rate" : "Project";
};

const HistoryItemCard = ({
  item,
  compact = false,
  showTimestamp = true,
  variant = "preview",
}: HistoryItemCardProps) => {
  const isBaseRate = item.type === "base-rate";
  const timestamp = formatTimestamp(item.created_at, compact);
  const iconBoxClasses = isBaseRate
    ? "bg-[#FFF2E8]"
    : "bg-[#FFE8DC]";
  const cardClasses =
    variant === "full"
      ? "rounded-xl border-2 border-black bg-white px-4 py-4 shadow-[2px_2px_0_#1a1a1a] sm:px-5"
      : "rounded-xl border-2 border-black bg-[#FFF9F4] px-3 py-3 sm:px-4";

  return (
    <article className={cardClasses}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-black ${iconBoxClasses}`}
        >
          {isBaseRate ? <RateIcon /> : <FolderIcon />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border-2 border-black bg-[#FFE8DC] px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-black">
              {formatTypeLabel(item.type)}
            </span>
            {showTimestamp && timestamp && (
              <time
                dateTime={item.created_at}
                className="text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-600"
              >
                {timestamp}
              </time>
            )}
          </div>

          <h3
            className={`mt-2 break-words font-black tracking-tight text-black ${
              compact ? "text-sm sm:text-base" : "text-base sm:text-lg"
            }`}
          >
            {item.name}
          </h3>

          <p
            className={`mt-1 break-words font-medium leading-relaxed text-neutral-700 ${
              compact ? "text-xs sm:text-sm" : "text-sm"
            }`}
          >
            {item.clientName}
          </p>
        </div>
      </div>
    </article>
  );
};

export default HistoryItemCard;
