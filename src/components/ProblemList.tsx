import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ProblemCard } from './ProblemCard';

export const ProblemList: React.FC = () => {
  const { 
    problems, loading, error, refresh,
    currentView, selectedTag, 
    searchQuery, sortBy, filterDifficulty,
    navigateToProblem, setSelectedTag
  } = useData();

  const filteredProblems = useMemo(() => {
    let result = [...problems];

    // 1. View Filter
    if (currentView === 'favorites') {
      result = result.filter(p => p.favorite);
    } else if (currentView === 'revision') {
      result = result.filter(p => p.status === 'Need Revision');
    } else if (currentView === 'recent') {
      // Just showing newest first, or we could limit array length
      // Let's rely on sorting for 'recent' logic but limit to last 20
      result = result.sort((a,b) => {
        const d1 = new Date(`${a.date} ${a.time || '12:00 AM'}`).getTime();
        const d2 = new Date(`${b.date} ${b.time || '12:00 AM'}`).getTime();
        return (isNaN(d2) ? 0 : d2) - (isNaN(d1) ? 0 : d1);
      });
      result = result.slice(0, 20);
    } else if (currentView === 'tags' && selectedTag) {
      result = result.filter(p => p.tags.includes(selectedTag));
    }

    // 2. Global Filter (Difficulty)
    if (filterDifficulty) {
      result = result.filter(p => p.difficulty === filterDifficulty);
    }

    // 3. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title?.toLowerCase().includes(q) ||
        p.statement?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.learning?.toLowerCase().includes(q) ||
        p.mistakes?.toLowerCase().includes(q) ||
        p.approaches?.some(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q))
      );
    }

    // 4. Sort
    if (currentView !== 'recent') {
      result.sort((a, b) => {
        if (sortBy === 'a-z') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'z-a') return (b.title || '').localeCompare(a.title || '');
        if (sortBy === 'difficulty') {
          const w = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          return (w[a.difficulty as keyof typeof w] || 0) - (w[b.difficulty as keyof typeof w] || 0);
        }
        
        // default to date-based
        const t1 = new Date(`${a.date || '1970-01-01'} ${a.time || '00:00 AM'}`).getTime();
        const t2 = new Date(`${b.date || '1970-01-01'} ${b.time || '00:00 AM'}`).getTime();
        
        if (sortBy === 'newest') return (isNaN(t2) ? 0 : t2) - (isNaN(t1) ? 0 : t1);
        if (sortBy === 'oldest') return (isNaN(t1) ? 0 : t1) - (isNaN(t2) ? 0 : t2);
        
        return 0;
      });
    }

    return result;
  }, [problems, currentView, selectedTag, searchQuery, sortBy, filterDifficulty]);

  if (loading && problems.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <p>Loading problems...</p>
      </div>
    );
  }

  if (error && problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
        <p>{error}</p>
        <button onClick={refresh} className="px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-slate-300">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs text-slate-500 hover:text-slate-300 shrink-0"
            >
              ← All Tags
            </button>
          )}
          <h2 className="text-2xl font-bold text-white capitalize truncate">
            {selectedTag ? `Tag: ${selectedTag}` : currentView.replace('-', ' ')}
          </h2>
        </div>
        <span className="text-slate-500 font-mono text-xs font-semibold uppercase tracking-widest">{filteredProblems.length} problems</span>
      </div>

      {filteredProblems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <p>No problems found matching criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProblems.map(p => (
            <ProblemCard key={p.filename} problem={p} onClick={() => navigateToProblem(p)} />
          ))}
        </div>
      )}
    </div>
  );
};
