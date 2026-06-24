import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';

export const AnalyticsDashboard: React.FC = () => {
  const { problems } = useData();

  const stats = useMemo(() => {
    let easy = 0, medium = 0, hard = 0;
    let needRev = 0, revised = 0, mastered = 0;
    const tagsCount: Record<string, number> = {};

    problems.forEach(p => {
      if (p.difficulty === 'Easy') easy++;
      if (p.difficulty === 'Medium') medium++;
      if (p.difficulty === 'Hard') hard++;

      if (p.status === 'Need Revision') needRev++;
      if (p.status === 'Revised') revised++;
      if (p.status === 'Mastered') mastered++;

      p.tags.forEach(t => {
        tagsCount[t] = (tagsCount[t] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return { total: problems.length, easy, medium, hard, needRev, revised, mastered, topTags };
  }, [problems]);

  return (
    <div className="p-4 sm:p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        <p className="text-slate-400 mt-1">Track your DSA progress and insights over time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 border border-white/5 rounded-xl p-5">
           <p className="text-[10px] tracking-wider uppercase text-slate-500 font-bold mb-1">Total Solved</p>
           <p className="text-4xl font-mono text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-t-2 border-t-emerald-500 border-white/5 rounded-xl p-5">
           <p className="text-[10px] tracking-wider uppercase text-slate-500 font-bold mb-1">Easy</p>
           <p className="text-4xl font-mono text-emerald-400">{stats.easy}</p>
        </div>
        <div className="bg-white/5 border border-t-2 border-t-amber-500 border-white/5 rounded-xl p-5">
           <p className="text-[10px] tracking-wider uppercase text-slate-500 font-bold mb-1">Medium</p>
           <p className="text-4xl font-mono text-amber-400">{stats.medium}</p>
        </div>
        <div className="bg-white/5 border border-t-2 border-t-rose-500 border-white/5 rounded-xl p-5">
           <p className="text-[10px] tracking-wider uppercase text-slate-500 font-bold mb-1">Hard</p>
           <p className="text-4xl font-mono text-rose-500">{stats.hard}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/5 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-widest">Revision Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Mastered</span>
                <span className="text-emerald-400 font-mono">{stats.mastered}</span>
              </div>
              <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${stats.total ? (stats.mastered/stats.total)*100 : 0}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Revised</span>
                <span className="text-blue-400 font-mono">{stats.revised}</span>
              </div>
              <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${stats.total ? (stats.revised/stats.total)*100 : 0}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Need Revision</span>
                <span className="text-amber-400 font-mono">{stats.needRev}</span>
              </div>
              <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${stats.total ? (stats.needRev/stats.total)*100 : 0}%`}}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-widest">Top Practiced Topics</h3>
          <div className="space-y-3">
             {stats.topTags.map(([tag, count]) => (
               <div key={tag} className="flex items-center justify-between">
                 <span className="text-sm text-slate-400">{tag}</span>
                 <div className="flex items-center gap-2">
                   <div className="h-1.5 w-32 bg-black/50 rounded-full">
                     <div className="h-full bg-slate-500 rounded-full" style={{ width: `${(count/stats.topTags[0][1])*100}%`}}></div>
                   </div>
                   <span className="text-xs text-slate-500 font-mono w-4 text-right">{count}</span>
                 </div>
               </div>
             ))}
             {stats.topTags.length === 0 && <p className="text-xs text-slate-600 italic">No topics logged yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
