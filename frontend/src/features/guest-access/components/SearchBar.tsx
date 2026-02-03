import { Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchBar = ({ searchTerm, setSearchTerm }: SearchBarProps) => {
  return (
    <div className="max-w-2xl mx-auto mb-12">
      <div className="relative border-2 border-black rounded-full py-4 px-6 bg-white flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-600" />
        <input
          type="text"
          placeholder="Search designer"
          className="flex-1 bg-transparent outline-none placeholder-gray-400 text-black"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};
