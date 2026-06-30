import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';

interface SidebarToggleProps {
  className?: string;
  /** 'toggle' switches open/closed; 'open' only shows when collapsed; 'close' only shows when expanded */
  mode?: 'toggle' | 'open' | 'close';
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({ className, mode = 'toggle' }) => {
  const { isSidebarOpen, toggleSidebar, setIsSidebarOpen } = useData();

  if (mode === 'open' && isSidebarOpen) return null;
  if (mode === 'close' && !isSidebarOpen) return null;

  const handleClick = () => {
    if (mode === 'open') setIsSidebarOpen(true);
    else if (mode === 'close') setIsSidebarOpen(false);
    else toggleSidebar();
  };

  const showCloseIcon = mode === 'close' || (mode === 'toggle' && isSidebarOpen);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex h-10 w-10 items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0',
        className
      )}
      aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      aria-expanded={isSidebarOpen}
    >
      {showCloseIcon ? (
        <PanelLeftClose className="w-5 h-5" />
      ) : (
        <PanelLeftOpen className="w-5 h-5" />
      )}
    </button>
  );
};
