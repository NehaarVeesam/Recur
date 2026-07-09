import React from 'react';
import { useData } from '../context/DataContext';
import { SearchIcon, SlidersHorizontal, ArrowUpDown, PlusIcon } from 'lucide-react';
import { SidebarToggle } from './SidebarToggle';

export const TopNav: React.FC = () => {
  const { 
    searchQuery, setSearchQuery, 
    sortBy, setSortBy, 
    filterDifficulty, setFilterDifficulty,
    createNewProblem,
  } = useData();

  return (
    <div className="flex flex-col md:flex-row md:h-16 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md md:items-center justify-between px-4 md:px-6 sticky top-0 z-10 gap-3 safe-area-top py-3 md:py-0">
      <div className="flex items-center gap-3 w-full md:w-auto flex-1 min-h-10">
        <SidebarToggle mode="open" />
        <div className="flex-1 flex items-center max-w-xl relative">
          <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3" />
          <input 
            type="text" 
            placeholder="Search titles, code, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-600 h-9 md:h-auto"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto shrink-0 pb-1 md:pb-0">
        <button
          onClick={createNewProblem}
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 text-sm text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 rounded-md hover:bg-indigo-500/20 transition-colors"
          title="Create New Problem (Ctrl+N)"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">New Problem</span>
        </button>
        <div className="flex items-center gap-2 relative shrink-0">
          <ArrowUpDown className="w-4 h-4 text-slate-500 absolute left-2 pointer-events-none" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none bg-[#050505] border border-white/10 text-slate-300 text-sm rounded-md pl-8 pr-8 py-1.5 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer hover:border-white/20 transition-colors h-9"
          >
            <option value="newest" className="bg-[#0A0A0A]">Newest First</option>
            <option value="oldest" className="bg-[#0A0A0A]">Oldest First</option>
            <option value="a-z" className="bg-[#0A0A0A]">A-Z</option>
            <option value="z-a" className="bg-[#0A0A0A]">Z-A</option>
            <option value="difficulty" className="bg-[#0A0A0A]">Difficulty</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-2 relative shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-slate-500 absolute left-2 pointer-events-none" />
          <select 
            value={filterDifficulty || ''} 
            onChange={(e) => setFilterDifficulty(e.target.value || null)}
            className="appearance-none bg-[#050505] border border-white/10 text-slate-300 text-sm rounded-md pl-8 pr-8 py-1.5 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer hover:border-white/20 transition-colors h-9"
          >
            <option value="" className="bg-[#0A0A0A]">All Difficulties</option>
            <option value="Easy" className="bg-[#0A0A0A]">Easy</option>
            <option value="Medium" className="bg-[#0A0A0A]">Medium</option>
            <option value="Hard" className="bg-[#0A0A0A]">Hard</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
