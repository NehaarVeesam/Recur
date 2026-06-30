import React from 'react';
import { useData } from '../context/DataContext';
import { 
  FolderIcon, 
  RepeatIcon,
  StarIcon, 
  ClockIcon, 
  RotateCcwIcon, 
  HashIcon,
  BarChart2Icon,
  PlusIcon
} from 'lucide-react';
import { cn } from '../utils/cn';
import { SidebarToggle } from './SidebarToggle';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, setSelectedTag, setIsSidebarOpen, navigateToProblem, createNewProblem } = useData();

  const navItems = [
    { id: 'all', label: 'All Problems', icon: FolderIcon },
    { id: 'favorites', label: 'Favorites', icon: StarIcon },
    { id: 'recent', label: 'Recent', icon: ClockIcon },
    { id: 'revision', label: 'Revision Queue', icon: RotateCcwIcon },
    { id: 'tags', label: 'Tags Explorer', icon: HashIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart2Icon },
  ] as const;

  return (
    <div className="w-64 bg-[#080808] border-r border-white/5 h-full min-h-dvh flex flex-col">
      <div className="flex h-16 items-center gap-2 px-4 border-b border-white/5 safe-area-top shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40 shrink-0">
          <RepeatIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <span className="font-bold text-white tracking-tight flex-1 truncate min-w-0">Recur</span>

        <button 
          onClick={() => {
            createNewProblem();
            setIsSidebarOpen(false);
          }}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 text-slate-400 border border-white/5 flex items-center justify-center transition-colors shrink-0"
          title="Create New Problem (Ctrl+N)"
        >
          <PlusIcon className="w-4 h-4" />
        </button>

        <SidebarToggle mode="close" className="h-8 w-8 -mr-1" />
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 ml-2">Core</div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentView(item.id);
              setSelectedTag(null);
              navigateToProblem(null);
              setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              currentView === item.id 
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium" 
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-1">
        <p className="text-[10px] text-slate-500 tracking-wide">Made by Nehaar • AI-assisted</p>
        <p className="text-[9px] font-mono text-slate-700">© {new Date().getFullYear()} Recur</p>
      </div>
    </div>
  );
};
