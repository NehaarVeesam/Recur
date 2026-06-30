import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';
import { tagCountColorClass } from '../utils/themeColors';

export const TagsExplorer: React.FC = () => {
  const { problems, setSelectedTag, setCurrentView } = useData();

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    problems.forEach(p => {
      p.tags.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [problems]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setCurrentView('tags');
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Tags Explorer</h2>
        <p className="text-slate-400 mt-1">Browse problems grouped by specific data structures or algorithm patterns.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {tagCounts.map(([tag, count]) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-white/10 transition-colors text-left group"
          >
            <span className="text-slate-300 font-medium group-hover:text-indigo-400 transition-colors">{tag}</span>
            <span
              className={cn(
                'text-xs font-semibold font-mono min-w-[1.75rem] text-center px-2.5 py-1 rounded-full border transition-colors',
                tagCountColorClass(tag)
              )}
            >
              {count}
            </span>
          </button>
        ))}
      </div>
      {tagCounts.length === 0 && (
        <div className="text-slate-500 py-10">No tags found. Seed some problems to see tags.</div>
      )}
    </div>
  );
};
