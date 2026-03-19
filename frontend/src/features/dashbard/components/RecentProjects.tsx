import type { RecentProject } from "../services";
import HistoryItemCard from "./HistoryItemCard";

interface RecentProjectsProps {
  projects: RecentProject[];
  onViewAll?: () => void;
}

const RecentProjects = ({ projects, onViewAll }: RecentProjectsProps) => {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border-[3px] border-black shadow-[2px_2px_0_#1a1a1a] h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-black">History</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="nb-pressable inline-flex min-h-11 items-center rounded-lg px-2 text-xs sm:text-sm font-bold text-[#FB8500] underline underline-offset-2 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            View All
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-black font-semibold">
            <p>No history yet</p>
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Recent history">
            {projects.map((project) => (
              <li key={project.id}>
                <HistoryItemCard
                  item={project}
                  compact
                  showTimestamp={Boolean(project.created_at)}
                  variant="preview"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecentProjects;
