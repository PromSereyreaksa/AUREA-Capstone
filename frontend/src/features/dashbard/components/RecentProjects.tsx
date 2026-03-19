interface Project {
  id: string;
  name: string;
  clientName: string;
  type?: 'project' | 'base-rate';
}

interface RecentProjectsProps {
  projects: Project[];
  onViewAll?: () => void;
}

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF6B35" stroke="none">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const RateIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2">
    <path d="M12 1v22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const RecentProjects = ({ projects, onViewAll }: RecentProjectsProps) => {
  return (
    <div className="bg-white rounded-xl p-6 border-[3px] border-black shadow-[2px_2px_0_#1a1a1a] h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold text-black">History</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs sm:text-sm font-bold text-[#FB8500] underline underline-offset-2"
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
          projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-lg border-2 border-black cursor-pointer transition-all duration-150 hover:bg-[#FFE8DC] hover:shadow-[2px_2px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 flex items-center justify-center bg-[#FFE8DC] rounded-md border-2 border-black">
                {project.type === 'base-rate' ? <RateIcon /> : <FolderIcon />}
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-bold text-black">{project.name}</h4>
                <p className="text-xs font-medium text-black">
                  {project.clientName}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentProjects;
