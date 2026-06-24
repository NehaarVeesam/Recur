import React, { useState, useEffect } from 'react';
import { Approach } from '../utils/parser';
import { useData } from '../context/DataContext';
import {
  ArrowLeftIcon, ClockIcon, CalendarIcon, TagIcon, StarIcon, LayoutIcon, CodeIcon,
  BookOpenIcon, AlertTriangleIcon, Edit3Icon, Trash2Icon, Maximize2Icon, CopyIcon,
  SaveIcon, XIcon, PlusIcon, Wand2Icon, MenuIcon,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { CODE_LANGUAGE, PYTHON_EDITOR_OPTIONS } from '../utils/codeEditor';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';

type TabId = 'overview' | 'approach' | 'learning' | 'mistakes' | 'code' | 'revision';
type EditableTab = Exclude<TabId, 'revision'>;

interface OverviewDraft {
  title: string;
  statement: string;
  tagsInput: string;
  difficulty: string;
  platform: string;
  date: string;
}

const inputClass =
  'w-full bg-[#010101] border border-white/10 text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500/50';
const textareaClass =
  'w-full bg-[#010101] border border-white/10 text-sm text-slate-300 rounded-lg p-3 min-h-[160px] resize-y focus:outline-none focus:border-indigo-500/50 leading-relaxed';

const TabEditBar: React.FC<{
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ isEditing, onEdit, onSave, onCancel }) => (
  <div className="flex justify-end gap-2 mb-4">
    {isEditing ? (
      <>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
        >
          <XIcon className="w-3.5 h-3.5" /> Cancel
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-400 border border-indigo-500/50 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors"
        >
          <SaveIcon className="w-3.5 h-3.5" /> Save
        </button>
      </>
    ) : (
      <button
        onClick={onEdit}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 hover:text-slate-200 transition-colors"
      >
        <Edit3Icon className="w-3.5 h-3.5" /> Edit
      </button>
    )}
  </div>
);

export const ProblemDetailView: React.FC = () => {
  const { selectedProblemInfo, setSelectedProblemInfo, saveProblem, deleteProblem, setIsSidebarOpen } = useData();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [editingTab, setEditingTab] = useState<EditableTab | null>(null);
  const [isFullscreenCode, setIsFullscreenCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const [overviewDraft, setOverviewDraft] = useState<OverviewDraft | null>(null);
  const [approachesDraft, setApproachesDraft] = useState<Approach[] | null>(null);
  const [learningDraft, setLearningDraft] = useState<string | null>(null);
  const [mistakesDraft, setMistakesDraft] = useState<string | null>(null);
  const [codeDraft, setCodeDraft] = useState<string | null>(null);
  const [formatting, setFormatting] = useState(false);

  useEffect(() => {
    setEditingTab(null);
    setOverviewDraft(null);
    setApproachesDraft(null);
    setLearningDraft(null);
    setMistakesDraft(null);
    setCodeDraft(null);
  }, [activeTab, selectedProblemInfo?.filename]);

  if (!selectedProblemInfo) return null;
  const p = selectedProblemInfo;

  const cancelEdit = () => {
    setEditingTab(null);
    setOverviewDraft(null);
    setApproachesDraft(null);
    setLearningDraft(null);
    setMistakesDraft(null);
    setCodeDraft(null);
  };

  const startEdit = (tab: EditableTab) => {
    setEditingTab(tab);
    switch (tab) {
      case 'overview':
        setOverviewDraft({
          title: p.title || '',
          statement: p.statement || '',
          tagsInput: p.tags.join(', '),
          difficulty: p.difficulty || 'Easy',
          platform: p.platform || '',
          date: p.date || '',
        });
        break;
      case 'approach':
        setApproachesDraft(
          p.approaches.length > 0
            ? p.approaches.map(a => ({ ...a }))
            : [{ title: 'Approach 1', timeComplexity: '', spaceComplexity: '', content: '' }]
        );
        break;
      case 'learning':
        setLearningDraft(p.learning || '');
        break;
      case 'mistakes':
        setMistakesDraft(p.mistakes || '');
        break;
      case 'code':
        setCodeDraft(p.code || '');
        break;
    }
  };

  const handleSaveTab = async () => {
    if (!editingTab || saving) return;
    setSaving(true);
    try {
      switch (editingTab) {
        case 'overview':
          if (!overviewDraft) return;
          await saveProblem({
            filename: p.filename,
            title: overviewDraft.title,
            statement: overviewDraft.statement,
            tags: overviewDraft.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
            difficulty: overviewDraft.difficulty,
            platform: overviewDraft.platform || undefined,
            date: overviewDraft.date,
          });
          break;
        case 'approach':
          if (!approachesDraft) return;
          await saveProblem({
            filename: p.filename,
            approaches: approachesDraft.filter(a => a.title.trim() || a.content.trim()),
          });
          break;
        case 'learning':
          if (learningDraft === null) return;
          await saveProblem({ filename: p.filename, learning: learningDraft });
          break;
        case 'mistakes':
          if (mistakesDraft === null) return;
          await saveProblem({ filename: p.filename, mistakes: mistakesDraft });
          break;
        case 'code':
          if (codeDraft === null) return;
          await saveProblem({ filename: p.filename, code: codeDraft });
          break;
      }
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    await saveProblem({ filename: p.filename, favorite: !p.favorite });
  };

  const handleStatusChange = async (status: string) => {
    await saveProblem({ filename: p.filename, status });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this problem log?')) {
      await deleteProblem(p.filename);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(p.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormatCode = async () => {
    const source = codeDraft ?? p.code;
    if (!source.trim()) {
      toast.error('Nothing to format');
      return;
    }
    setFormatting(true);
    try {
      const res = await fetch('/api/format-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error ||
          (res.status === 404
            ? 'Format API unavailable — restart the dev server (Ctrl+C, then npm run dev)'
            : 'Format failed')
        );
      }
      if (!data.formatted) throw new Error('No formatted output returned');
      if (editingTab === 'code' && codeDraft !== null) {
        setCodeDraft(data.formatted);
      } else {
        await saveProblem({ filename: p.filename, code: data.formatted });
      }
      toast.success('Formatted with Black');
    } catch (e: any) {
      toast.error(e.message || 'Could not format Python code');
    } finally {
      setFormatting(false);
    }
  };

  const handleRevisionUpdate = async (status: string) => {
    const today = new Date().toISOString().split('T')[0];
    await saveProblem({
      filename: p.filename,
      status,
      lastRevised: today,
    });
  };

  const handleTabChange = (tab: TabId) => {
    if (editingTab) cancelEdit();
    setActiveTab(tab);
  };

  const updateApproach = (idx: number, field: keyof Approach, value: string) => {
    if (!approachesDraft) return;
    setApproachesDraft(approachesDraft.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  };

  const addApproach = () => {
    setApproachesDraft([
      ...(approachesDraft || []),
      { title: `Approach ${(approachesDraft?.length || 0) + 1}`, timeComplexity: '', spaceComplexity: '', content: '' },
    ]);
  };

  const removeApproach = (idx: number) => {
    if (!approachesDraft) return;
    setApproachesDraft(approachesDraft.filter((_, i) => i !== idx));
  };

  const renderTabContent = () => {
    const isEditing = (tab: EditableTab) => editingTab === tab;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TabEditBar
              isEditing={isEditing('overview')}
              onEdit={() => startEdit('overview')}
              onSave={handleSaveTab}
              onCancel={cancelEdit}
            />
            {isEditing('overview') && overviewDraft ? (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Title</label>
                    <input className={inputClass} value={overviewDraft.title} onChange={e => setOverviewDraft({ ...overviewDraft, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Problem Statement</label>
                    <textarea className={textareaClass} value={overviewDraft.statement} onChange={e => setOverviewDraft({ ...overviewDraft, statement: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-6 space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Tags (comma-separated)</label>
                      <input className={inputClass} value={overviewDraft.tagsInput} onChange={e => setOverviewDraft({ ...overviewDraft, tagsInput: e.target.value })} placeholder="Array, HashMap, DP" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Platform</label>
                      <input className={inputClass} value={overviewDraft.platform} onChange={e => setOverviewDraft({ ...overviewDraft, platform: e.target.value })} placeholder="LeetCode" />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-6 space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Difficulty</label>
                      <select className={inputClass} value={overviewDraft.difficulty} onChange={e => setOverviewDraft({ ...overviewDraft, difficulty: e.target.value })}>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Date Solved</label>
                      <input className={inputClass} type="date" value={overviewDraft.date} onChange={e => setOverviewDraft({ ...overviewDraft, date: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Problem Statement</h4>
                  <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {p.statement || <span className="text-slate-600 italic">No problem statement recorded yet.</span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><TagIcon className="w-4 h-4"/> Tags & Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {p.tags.length > 0 ? p.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs tracking-wide text-slate-300">{tag}</span>
                      )) : <p className="text-sm text-slate-600">No tags assigned.</p>}
                    </div>
                    {p.platform && <p className="text-xs text-slate-500 mt-4">Platform: <span className="text-slate-400">{p.platform}</span></p>}
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-6 flex flex-col justify-between">
                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-3">Revision Status</p>
                    <select
                      value={p.status || ''}
                      onChange={e => handleStatusChange(e.target.value)}
                      disabled={!!editingTab}
                      className="w-full bg-[#010101] border border-white/10 text-sm text-slate-300 rounded p-2 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value="Need Revision">Need Revision</option>
                      <option value="Revised">Revised</option>
                      <option value="Mastered">Mastered</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'approach':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div />
              <div className="flex gap-2">
                {isEditing('approach') && (
                  <button onClick={addApproach} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                    <PlusIcon className="w-3.5 h-3.5" /> Add Approach
                  </button>
                )}
                <TabEditBar isEditing={isEditing('approach')} onEdit={() => startEdit('approach')} onSave={handleSaveTab} onCancel={cancelEdit} />
              </div>
            </div>
            {isEditing('approach') && approachesDraft ? (
              approachesDraft.map((app, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <input className={cn(inputClass, 'font-medium')} value={app.title} onChange={e => updateApproach(idx, 'title', e.target.value)} placeholder="Approach name" />
                    {approachesDraft.length > 1 && (
                      <button onClick={() => removeApproach(idx)} className="text-xs text-rose-500 hover:text-rose-400 shrink-0">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Time Complexity</label>
                      <input className={inputClass} value={app.timeComplexity || ''} onChange={e => updateApproach(idx, 'timeComplexity', e.target.value)} placeholder="O(n)" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Space Complexity</label>
                      <input className={inputClass} value={app.spaceComplexity || ''} onChange={e => updateApproach(idx, 'spaceComplexity', e.target.value)} placeholder="O(1)" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Explanation</label>
                    <textarea className={textareaClass} value={app.content} onChange={e => updateApproach(idx, 'content', e.target.value)} />
                  </div>
                </div>
              ))
            ) : p.approaches.length > 0 ? (
              p.approaches.map((app, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-white/10 pb-4">
                    <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <LayoutIcon className="w-4 h-4"/> {app.title || `Approach ${idx + 1}`}
                    </h4>
                    <div className="flex items-center gap-4 mt-3 md:mt-0">
                      {app.timeComplexity && (
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Time</span>
                          <span className="text-sm font-mono text-amber-300">{app.timeComplexity}</span>
                        </div>
                      )}
                      {app.spaceComplexity && (
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Space</span>
                          <span className="text-sm font-mono text-purple-400">{app.spaceComplexity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {app.content || <span className="text-slate-600 italic">No description provided.</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/5 border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
                <LayoutIcon className="w-8 h-8 mb-3 opacity-50" />
                <p>No approaches recorded yet.</p>
              </div>
            )}
          </div>
        );

      case 'learning':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TabEditBar isEditing={isEditing('learning')} onEdit={() => startEdit('learning')} onSave={handleSaveTab} onCancel={cancelEdit} />
            <div className="bg-white/5 border border-white/5 rounded-xl p-6 min-h-[400px]">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BookOpenIcon className="w-4 h-4"/> Key Takeaways
              </h4>
              {isEditing('learning') && learningDraft !== null ? (
                <textarea className={cn(textareaClass, 'min-h-[320px]')} value={learningDraft} onChange={e => setLearningDraft(e.target.value)} placeholder="What did you learn from this problem?" />
              ) : (
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {p.learning || <span className="text-slate-600 italic">No learning notes recorded yet.</span>}
                </div>
              )}
            </div>
          </div>
        );

      case 'mistakes':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TabEditBar isEditing={isEditing('mistakes')} onEdit={() => startEdit('mistakes')} onSave={handleSaveTab} onCancel={cancelEdit} />
            <div className="bg-white/5 border border-white/5 rounded-xl p-6 min-h-[400px]">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4 text-amber-400"/> Mistakes Log
              </h4>
              {isEditing('mistakes') && mistakesDraft !== null ? (
                <textarea className={cn(textareaClass, 'min-h-[320px]')} value={mistakesDraft} onChange={e => setMistakesDraft(e.target.value)} placeholder="Wrong approaches, bugs, edge cases missed..." />
              ) : (
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {p.mistakes || <span className="text-slate-600 italic">No mistakes logged yet.</span>}
                </div>
              )}
            </div>
          </div>
        );

      case 'code': {
        const codeEditing = isEditing('code');
        const codeValue = codeEditing && codeDraft !== null ? codeDraft : p.code;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TabEditBar isEditing={codeEditing} onEdit={() => startEdit('code')} onSave={handleSaveTab} onCancel={cancelEdit} />
            <div className={cn(
              'bg-[#010101] border border-white/5 rounded-xl overflow-hidden flex flex-col',
              isFullscreenCode
                ? 'fixed z-50 shadow-2xl inset-2 sm:inset-4 safe-area-x safe-area-top safe-area-bottom'
                : 'h-[min(60dvh,600px)] min-h-[280px]'
            )}>
              <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2 text-slate-400 min-w-0">
                  <CodeIcon className="w-4 h-4 shrink-0" />
                  <span className="text-xs sm:text-sm font-mono truncate">Python · {p.filename}{codeEditing ? ' (editing)' : ''}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <button
                    onClick={handleFormatCode}
                    disabled={formatting || (!codeEditing && !p.code.trim())}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Format with Black (pip install black)"
                  >
                    <Wand2Icon className="w-3.5 h-3.5" />
                    {formatting ? 'Formatting…' : 'Format'}
                  </button>
                  {!codeEditing && (
                    <>
                      <button onClick={handleCopyCode} className="p-1.5 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded" title="Copy Code">
                        {copied ? <span className="text-xs text-indigo-400 px-1">Copied!</span> : <CopyIcon className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setIsFullscreenCode(!isFullscreenCode)} className="p-1.5 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded" title="Toggle Fullscreen">
                        <Maximize2Icon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 relative min-h-0">
                <Editor
                  height="100%"
                  language={CODE_LANGUAGE}
                  theme="vs-dark"
                  value={codeValue}
                  onChange={codeEditing ? val => setCodeDraft(val || '') : undefined}
                  options={{
                    ...PYTHON_EDITOR_OPTIONS,
                    readOnly: !codeEditing,
                  }}
                />
              </div>
            </div>
          </div>
        );
      }

      case 'revision':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white/5 border border-white/5 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ClockIcon className="w-4 h-4"/> Revision Tracker
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-black/30 border border-white/5 rounded-lg p-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Current Status</p>
                  <p className={cn(
                    'text-lg font-medium',
                    p.status === 'Need Revision' ? 'text-amber-400' :
                    p.status === 'Mastered' ? 'text-emerald-400' : 'text-blue-400'
                  )}>{p.status}</p>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-lg p-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Last Revised</p>
                  <p className="text-lg font-mono text-slate-300">{p.lastRevised || '—'}</p>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-lg p-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">First Solved</p>
                  <p className="text-lg font-mono text-slate-300">{p.date || '—'}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Use the buttons below after you revisit a problem. Problems marked <span className="text-amber-400">Need Revision</span> appear in the sidebar <strong className="text-slate-400">Revision Queue</strong>.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleRevisionUpdate('Revised')}
                  className="px-4 py-2 text-sm rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  Mark as Revised Today
                </button>
                <button
                  onClick={() => handleRevisionUpdate('Mastered')}
                  className="px-4 py-2 text-sm rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  Mark as Mastered
                </button>
                <button
                  onClick={() => handleRevisionUpdate('Need Revision')}
                  className="px-4 py-2 text-sm rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  Back to Revision Queue
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] min-w-0">
      <div className="flex-none px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur z-10 sticky top-0 safe-area-top">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <button
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg shrink-0"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSelectedProblemInfo(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors group"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Problems
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight break-words">{p.title || p.filename}</h1>
              <button onClick={handleToggleFavorite} className="text-slate-500 hover:text-amber-500 transition-colors" disabled={!!editingTab}>
                <StarIcon className={cn('w-6 h-6', p.favorite && 'fill-amber-500 text-amber-500')} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-xs"><CalendarIcon className="w-4 h-4"/> {p.date} {p.time}</span>
              <span className={cn(
                'px-2 py-0.5 rounded border font-medium text-[10px] uppercase tracking-wider flex items-center',
                p.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                p.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-rose-500/10 text-rose-500 border-rose-500/20'
              )}>
                {p.difficulty}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleDelete} title="Delete Record" className="p-2 border border-rose-900/50 text-rose-500 rounded-lg hover:bg-rose-950 transition-colors">
              <Trash2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 mt-6 sm:mt-8 overflow-x-auto no-scrollbar -mx-1 px-1">
          {(['overview', 'approach', 'learning', 'mistakes', 'code', 'revision'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                'pb-3 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab
                  ? 'border-indigo-400 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700',
                editingTab && editingTab !== tab && tab !== 'revision' && 'opacity-50'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 relative max-w-5xl w-full mx-auto">
        {isFullscreenCode && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" onClick={() => setIsFullscreenCode(false)} />}
        {renderTabContent()}
      </div>
    </div>
  );
};
