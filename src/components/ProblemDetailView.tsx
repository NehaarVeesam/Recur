import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Approach } from '../utils/parser';
import { useData } from '../context/DataContext';
import {
  ArrowLeftIcon, ClockIcon, CalendarIcon, TagIcon, StarIcon, LayoutIcon, CodeIcon,
  BookOpenIcon, AlertTriangleIcon, Edit3Icon, Trash2Icon, Maximize2Icon, CopyIcon,
  SaveIcon, XIcon, PlusIcon, Wand2Icon,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { SidebarToggle } from './SidebarToggle';
import { Markdown } from './Markdown';
import { MarkdownTextarea } from './MarkdownTextarea';
import { titleToFilename, isDraftFilename } from '../utils/filename';
import { saveStoredDraft, loadStoredDraft, clearStoredDraft } from '../utils/draftStorage';
import { hasUnsavedWork, confirmDiscard } from '../utils/unsavedChanges';
import { getDifficultyBadgeClass, getStatusButtonClass, getStatusTextClass, STATUS_COLORS } from '../utils/themeColors';
import { useIsMobile } from '../hooks/useIsMobile';
import { isTypingTarget } from '../hooks/useIsTypingTarget';
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
  'w-full bg-[#010101] border border-white/10 text-sm font-mono text-slate-300 rounded-lg p-3 min-h-[160px] resize-y focus:outline-none focus:border-indigo-500/50 leading-relaxed';

const TAB_ORDER: TabId[] = ['overview', 'approach', 'learning', 'mistakes', 'code', 'revision'];

const TabEditBar: React.FC<{
  isEditing: boolean;
  createMode?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ isEditing, createMode, onEdit, onSave, onCancel }) => (
  <div className="flex justify-end gap-2 mb-4">
    {isEditing ? (
      <>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-11 sm:min-h-0 text-xs text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
        >
          <XIcon className="w-3.5 h-3.5" /> {createMode ? 'Done' : 'Cancel'}
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-11 sm:min-h-0 text-xs text-indigo-400 border border-indigo-500/50 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors"
        >
          <SaveIcon className="w-3.5 h-3.5" /> Save
        </button>
      </>
    ) : (
      <button
        onClick={onEdit}
        className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-11 sm:min-h-0 text-xs text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 hover:text-slate-200 transition-colors"
      >
        <Edit3Icon className="w-3.5 h-3.5" /> Edit
      </button>
    )}
  </div>
);

export const ProblemDetailView: React.FC = () => {
  const {
    selectedProblemInfo,
    navigateToProblem,
    saveProblem,
    deleteProblem,
    createModeFilename,
    setCreateModeFilename,
    problems,
    registerLeaveConfirm,
    isSidebarOpen,
  } = useData();
  const isMobile = useIsMobile();
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
  const draftHydratedRef = useRef(false);
  const keyHandlersRef = useRef({
    onSave: () => {},
    onTab: (_tab: TabId) => {},
  });

  const getUnsavedState = useCallback(() => {
    if (!selectedProblemInfo) return false;
    return hasUnsavedWork({
      createMode: createModeFilename === selectedProblemInfo.filename,
      editingTab,
      problem: selectedProblemInfo,
      overviewDraft,
      approachesDraft,
      learningDraft,
      mistakesDraft,
      codeDraft,
    });
  }, [
    selectedProblemInfo,
    createModeFilename,
    editingTab,
    overviewDraft,
    approachesDraft,
    learningDraft,
    mistakesDraft,
    codeDraft,
  ]);

  useEffect(() => {
    draftHydratedRef.current = false;
  }, [selectedProblemInfo?.filename]);

  useEffect(() => {
    if (!selectedProblemInfo) return;

    const stored = loadStoredDraft();
    if (stored && stored.problemFilename === selectedProblemInfo.filename && !draftHydratedRef.current) {
      draftHydratedRef.current = true;
      setOverviewDraft(stored.overviewDraft);
      setApproachesDraft(stored.approachesDraft);
      setLearningDraft(stored.learningDraft);
      setMistakesDraft(stored.mistakesDraft);
      setCodeDraft(stored.codeDraft);
      setActiveTab(stored.activeTab);
      setEditingTab(stored.editingTab);
      return;
    }

    if (createModeFilename === selectedProblemInfo.filename && !draftHydratedRef.current) {
      draftHydratedRef.current = true;
      setOverviewDraft({
        title: '',
        statement: '',
        tagsInput: '',
        difficulty: 'Easy',
        platform: '',
        date: selectedProblemInfo.date || new Date().toISOString().split('T')[0],
      });
      setApproachesDraft([{ title: 'Approach 1', timeComplexity: '', spaceComplexity: '', content: '' }]);
      setLearningDraft('');
      setMistakesDraft('');
      setCodeDraft('');
      setActiveTab('overview');
    }
  }, [selectedProblemInfo?.filename, createModeFilename]);

  useEffect(() => {
    if (createModeFilename === selectedProblemInfo?.filename) return;
    setEditingTab(null);
    setOverviewDraft(null);
    setApproachesDraft(null);
    setLearningDraft(null);
    setMistakesDraft(null);
    setCodeDraft(null);
  }, [activeTab, selectedProblemInfo?.filename, createModeFilename]);

  useEffect(() => {
    if (!selectedProblemInfo) return;
    const inCreateMode = createModeFilename === selectedProblemInfo.filename;
    if (!inCreateMode && !editingTab) {
      clearStoredDraft();
      return;
    }

    const timeout = window.setTimeout(() => {
      saveStoredDraft({
        problemFilename: selectedProblemInfo.filename,
        problemContent: selectedProblemInfo.raw,
        createMode: inCreateMode,
        activeTab,
        editingTab,
        overviewDraft,
        approachesDraft,
        learningDraft,
        mistakesDraft,
        codeDraft,
        savedAt: Date.now(),
      });
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [
    selectedProblemInfo,
    createModeFilename,
    activeTab,
    editingTab,
    overviewDraft,
    approachesDraft,
    learningDraft,
    mistakesDraft,
    codeDraft,
  ]);

  useEffect(() => {
    registerLeaveConfirm(() => {
      if (!getUnsavedState()) return true;
      return confirmDiscard();
    });
    return () => registerLeaveConfirm(null);
  }, [registerLeaveConfirm, getUnsavedState]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!getUnsavedState()) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [getUnsavedState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        keyHandlersRef.current.onSave();
        return;
      }

      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        const idx = parseInt(e.key, 10);
        if (idx >= 1 && idx <= TAB_ORDER.length) {
          e.preventDefault();
          keyHandlersRef.current.onTab(TAB_ORDER[idx - 1]);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!selectedProblemInfo) return null;
  const p = selectedProblemInfo;
  const createMode = createModeFilename === p.filename;

  const exitCreateMode = () => {
    setCreateModeFilename(null);
    setEditingTab(null);
    setOverviewDraft(null);
    setApproachesDraft(null);
    setLearningDraft(null);
    setMistakesDraft(null);
    setCodeDraft(null);
    clearStoredDraft();
  };

  const discardEdit = () => {
    setEditingTab(null);
    setOverviewDraft(null);
    setApproachesDraft(null);
    setLearningDraft(null);
    setMistakesDraft(null);
    setCodeDraft(null);
    clearStoredDraft();
  };

  const cancelEdit = () => {
    if (getUnsavedState() && !confirmDiscard()) return;
    if (createMode) {
      exitCreateMode();
      return;
    }
    discardEdit();
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

  const handleSaveAll = async () => {
    if (
      saving ||
      !overviewDraft ||
      approachesDraft === null ||
      learningDraft === null ||
      mistakesDraft === null ||
      codeDraft === null
    ) {
      return;
    }
    if (!overviewDraft.title.trim()) {
      toast.error('Please enter a problem title');
      setActiveTab('overview');
      return;
    }
    setSaving(true);
    try {
      const targetFilename = isDraftFilename(p.filename)
        ? titleToFilename(overviewDraft.title, problems.map(prob => prob.filename))
        : p.filename;

      await saveProblem({
        filename: targetFilename,
        title: overviewDraft.title.trim(),
        statement: overviewDraft.statement,
        tags: overviewDraft.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        difficulty: overviewDraft.difficulty,
        platform: overviewDraft.platform || undefined,
        date: overviewDraft.date,
        approaches: approachesDraft.filter(
          a => a.title.trim() || a.content.trim() || a.timeComplexity?.trim() || a.spaceComplexity?.trim()
        ),
        learning: learningDraft,
        mistakes: mistakesDraft,
        code: codeDraft,
      });
      exitCreateMode();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTab = async () => {
    if (createMode) return;
    const tabToSave = (createMode ? activeTab : editingTab) as EditableTab | 'revision' | null;
    if (!tabToSave || tabToSave === 'revision' || saving) return;
    setSaving(true);
    try {
      switch (tabToSave) {
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
      if (!createMode) discardEdit();
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
      if ((createMode || editingTab === 'code') && codeDraft !== null) {
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
    if (!createMode && editingTab) {
      if (getUnsavedState() && !confirmDiscard('Discard unsaved changes on this tab?')) return;
      discardEdit();
    }
    setActiveTab(tab);
  };

  keyHandlersRef.current = {
    onSave: () => {
      if (createMode) void handleSaveAll();
      else if (editingTab) void handleSaveTab();
    },
    onTab: handleTabChange,
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
    const isEditing = (tab: EditableTab) => createMode || editingTab === tab;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!createMode && (
              <TabEditBar
                isEditing={isEditing('overview')}
                createMode={createMode}
                onEdit={() => startEdit('overview')}
                onSave={handleSaveTab}
                onCancel={cancelEdit}
              />
            )}
            {isEditing('overview') && overviewDraft ? (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Title</label>
                    <input className={inputClass} value={overviewDraft.title} onChange={e => setOverviewDraft({ ...overviewDraft, title: e.target.value })} placeholder="e.g. Two Sum" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Problem Statement</label>
                    <MarkdownTextarea className={textareaClass} value={overviewDraft.statement} onChange={v => setOverviewDraft({ ...overviewDraft, statement: v })} placeholder="Describe the problem here..." />
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
                  {p.statement ? (
                    <Markdown content={p.statement} />
                  ) : (
                    <span className="text-slate-600 italic">No problem statement recorded yet.</span>
                  )}
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
                      disabled={!!editingTab || createMode}
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
                {!createMode && (
                  <TabEditBar isEditing={isEditing('approach')} createMode={createMode} onEdit={() => startEdit('approach')} onSave={handleSaveTab} onCancel={cancelEdit} />
                )}
              </div>
            </div>
            {isEditing('approach') && approachesDraft ? (
              approachesDraft.map((app, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <input className={cn(inputClass, 'font-medium')} value={app.title} onChange={e => updateApproach(idx, 'title', e.target.value)} placeholder="Approach name" />
                    {approachesDraft.length > 1 && (
                      <button onClick={() => removeApproach(idx)} className="text-xs text-red-500 hover:text-red-400 shrink-0">Remove</button>
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
                    <MarkdownTextarea className={textareaClass} value={app.content} onChange={v => updateApproach(idx, 'content', v)} placeholder="Explain your approach here..." />
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
                          <span className="text-sm font-mono text-indigo-300">{app.timeComplexity}</span>
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
                  {app.content ? (
                    <Markdown content={app.content} />
                  ) : (
                    <span className="text-slate-600 italic">No description provided.</span>
                  )}
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
            {!createMode && (
              <TabEditBar isEditing={isEditing('learning')} createMode={createMode} onEdit={() => startEdit('learning')} onSave={handleSaveTab} onCancel={cancelEdit} />
            )}
            <div className="bg-white/5 border border-white/5 rounded-xl p-6 min-h-[400px]">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BookOpenIcon className="w-4 h-4"/> Key Takeaways
              </h4>
              {isEditing('learning') && learningDraft !== null ? (
                <MarkdownTextarea className={cn(textareaClass, 'min-h-[320px]')} value={learningDraft} onChange={setLearningDraft} placeholder="What did you learn from this problem?" />
              ) : (
                p.learning ? (
                  <Markdown content={p.learning} />
                ) : (
                  <span className="text-slate-600 italic">No learning notes recorded yet.</span>
                )
              )}
            </div>
          </div>
        );

      case 'mistakes':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!createMode && (
              <TabEditBar isEditing={isEditing('mistakes')} createMode={createMode} onEdit={() => startEdit('mistakes')} onSave={handleSaveTab} onCancel={cancelEdit} />
            )}
            <div className="bg-white/5 border border-white/5 rounded-xl p-6 min-h-[400px]">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4 text-orange-400"/> Mistakes Log
              </h4>
              {isEditing('mistakes') && mistakesDraft !== null ? (
                <MarkdownTextarea className={cn(textareaClass, 'min-h-[320px]')} value={mistakesDraft} onChange={setMistakesDraft} placeholder="Wrong approaches, bugs, edge cases missed..." />
              ) : (
                p.mistakes ? (
                  <Markdown content={p.mistakes} />
                ) : (
                  <span className="text-slate-600 italic">No mistakes logged yet.</span>
                )
              )}
            </div>
          </div>
        );

      case 'code': {
        const codeEditing = isEditing('code');
        const codeValue = codeEditing && codeDraft !== null ? codeDraft : p.code;
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!createMode && (
              <TabEditBar isEditing={codeEditing} createMode={createMode} onEdit={() => startEdit('code')} onSave={handleSaveTab} onCancel={cancelEdit} />
            )}
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
                    className="flex items-center gap-1.5 px-3 py-2 sm:px-2 sm:py-1.5 min-h-11 sm:min-h-0 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded disabled:opacity-40 disabled:cursor-not-allowed"
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
                {isMobile && codeEditing ? (
                  <textarea
                    className="w-full h-full min-h-[280px] bg-[#010101] text-slate-300 font-mono text-base leading-relaxed p-4 focus:outline-none resize-none"
                    value={codeValue}
                    onChange={(e) => setCodeDraft(e.target.value)}
                    placeholder={'def solve():\n    pass'}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                  />
                ) : (
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
                )}
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
                  <p className={cn('text-lg font-medium', getStatusTextClass(p.status))}>{p.status}</p>
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
                Use the buttons below after you revisit a problem. Problems marked <span className={STATUS_COLORS['Need Revision'].text}>Need Revision</span> appear in the sidebar <strong className="text-slate-400">Revision Queue</strong>.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleRevisionUpdate('Revised')}
                  className={getStatusButtonClass('Revised')}
                >
                  Mark as Revised Today
                </button>
                <button
                  onClick={() => handleRevisionUpdate('Mastered')}
                  className={getStatusButtonClass('Mastered')}
                >
                  Mark as Mastered
                </button>
                <button
                  onClick={() => handleRevisionUpdate('Need Revision')}
                  className={getStatusButtonClass('Need Revision')}
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
      <div className="flex-none border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur z-10 sticky top-0 safe-area-top">
        <div className="flex items-center gap-1 px-4 sm:px-6 md:px-8 h-12">
          {!isSidebarOpen && (
            <SidebarToggle mode="open" className="h-9 w-9 shrink-0" />
          )}
          <button
            onClick={() => navigateToProblem(null)}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-colors group min-w-0"
          >
            <ArrowLeftIcon className="w-4 h-4 shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span className="truncate">Back to Problems</span>
          </button>
        </div>

        <div className="px-4 sm:px-6 md:px-8 pb-3 pt-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2 sm:gap-3 mb-2">
                <h1 className={cn(
                  'text-xl sm:text-2xl md:text-3xl font-bold tracking-tight break-words min-w-0 flex-1',
                  createMode && !overviewDraft?.title.trim() ? 'text-slate-500 italic' : 'text-white'
                )}>
                  {createMode ? (overviewDraft?.title.trim() || 'New Problem') : (p.title || p.filename)}
                </h1>
                <button
                  onClick={handleToggleFavorite}
                  className="text-slate-500 hover:text-yellow-500 transition-colors shrink-0 mt-0.5"
                  disabled={!!editingTab || createMode}
                >
                  <StarIcon className={cn('w-6 h-6', p.favorite && 'fill-yellow-500 text-yellow-500')} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  <CalendarIcon className="w-4 h-4 shrink-0" /> {p.date} {p.time}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded border font-medium text-[10px] uppercase tracking-wider',
                  getDifficultyBadgeClass(p.difficulty)
                )}>
                  {p.difficulty}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {createMode && (
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 py-2 sm:px-4 min-h-10 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  <SaveIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save Problem'}</span>
                  <span className="sm:hidden">{saving ? '…' : 'Save'}</span>
                </button>
              )}
              {!createMode && (
                <button
                  onClick={handleDelete}
                  title="Delete Record"
                  className="flex h-10 w-10 items-center justify-center border border-red-900/50 text-red-500 rounded-lg hover:bg-red-950 transition-colors"
                >
                  <Trash2Icon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 md:px-8 overflow-x-auto no-scrollbar border-t border-white/5 pt-1">
          {(['overview', 'approach', 'learning', 'mistakes', 'code', 'revision'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                'pb-3 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap shrink-0',
                activeTab === tab
                  ? 'border-indigo-400 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700',
                !createMode && editingTab && editingTab !== tab && tab !== 'revision' && 'opacity-50'
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
