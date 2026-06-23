import React from 'react';
import { Problem } from '../utils/parser';
import { StarIcon } from 'lucide-react';
import { cn } from '../utils/cn';

interface ProblemCardProps {
  problem: Problem;
  onClick: () => void;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem, onClick }) => {
  const diffColors = {
    'Easy': 'text-emerald-400',
    'Medium': 'text-amber-400',
    'Hard': 'text-rose-500',
  };

  const difficultyClass = diffColors[problem.difficulty as keyof typeof diffColors] || 'text-slate-500';

  return (
    <div 
      onClick={onClick}
      className="group bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-4 cursor-pointer transition-all hover:bg-white/[0.07] overflow-hidden relative flex flex-col min-h-[160px]"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", difficultyClass)}>
          {problem.difficulty || 'Unknown'}
        </span>
        <div className="flex items-center gap-2">
          {problem.favorite && <StarIcon className="w-4 h-4 fill-amber-400 text-amber-400" />}
        </div>
      </div>
      
      <h3 className="text-slate-200 font-medium mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
        {problem.title || problem.filename.replace('.txt', '')}
      </h3>

      <div className="flex-1">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {problem.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] uppercase tracking-tighter text-slate-300">
              {tag}
            </span>
          ))}
          {problem.tags.length > 3 && (
            <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] uppercase tracking-tighter text-slate-400">
              +{problem.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-auto pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span>Solved: {problem.date || 'No date'}</span>
        </div>
        {problem.status && (
          <span className={cn(
            problem.status === 'Need Revision' ? "text-amber-400" : 
            problem.status === 'Mastered' ? "text-emerald-400" : "text-slate-400"
          )}>
            {problem.status}
          </span>
        )}
      </div>
    </div>
  );
};
