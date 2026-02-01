interface Project {
  id: number;
  name: string;
  clientName: string;
}

interface RecentProjectsProps {
  projects: Project[];
}

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF6B35" stroke="none">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const RecentProjects = ({ projects }: RecentProjectsProps) => {
  return (
    <div className="bg-white rounded-xl p-6 border-[3px] border-black shadow-[2px_2px_0_#1a1a1a] h-full">
      <h2 className="text-xl font-extrabold text-black mb-4">Recent Project</h2>
      <div className="flex flex-col gap-2">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-black font-semibold">
            <p>No recent projects yet</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-lg border-2 border-black cursor-pointer transition-all duration-150 hover:bg-[#FFE8DC] hover:shadow-[2px_2px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 flex items-center justify-center bg-[#FFE8DC] rounded-md border-2 border-black">
                <FolderIcon />
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-bold text-black">{project.name}</h4>
                <p className="text-xs font-medium text-black">
                  Client: {project.clientName}
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
