interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: "chart" | "folder";
}

const ChartIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#FF6B35"
    strokeWidth="2"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const FolderIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#FF6B35"
    strokeWidth="2"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const StatCard = ({ title, value, unit, icon }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl p-5 border-[3px] border-black shadow-[2px_2px_0_#1a1a1a] transition-all duration-150 ">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-black">{title}</h3>
        <div className="w-8 h-8 flex items-center justify-center">
          {icon === "chart" ? <ChartIcon /> : <FolderIcon />}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-black tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-base font-semibold text-black">{unit}</span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
