import React, { createContext, useContext, useEffect, useState } from 'react';
import { Problem, parseProblem, generateProblemText } from '../utils/parser';
import toast from 'react-hot-toast';

interface DataContextType {
  problems: Problem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveProblem: (problem: Partial<Problem> & { filename: string; renameTo?: string }) => Promise<string>;
  deleteProblem: (filename: string) => Promise<void>;
  createNewProblem: () => Promise<void>;
  
  // UI State
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTag: string | null;
  setSelectedTag: (t: string | null) => void;
  currentView: 'all' | 'favorites' | 'recent' | 'revision' | 'tags' | 'analytics';
  setCurrentView: (v: 'all' | 'favorites' | 'recent' | 'revision' | 'tags' | 'analytics') => void;
  selectedProblemInfo: Problem | null;
  setSelectedProblemInfo: (p: Problem | null) => void;
  sortBy: 'newest' | 'oldest' | 'a-z' | 'z-a' | 'difficulty';
  setSortBy: (s: 'newest' | 'oldest' | 'a-z' | 'z-a' | 'difficulty') => void;
  filterDifficulty: string | null;
  setFilterDifficulty: (d: string | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (b: boolean) => void;
  createModeFilename: string | null;
  setCreateModeFilename: (filename: string | null) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'all' | 'favorites' | 'recent' | 'revision' | 'tags' | 'analytics'>('all');
  const [selectedProblemInfo, setSelectedProblemInfo] = useState<Problem | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a' | 'difficulty'>('newest');
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [createModeFilename, setCreateModeFilename] = useState<string | null>(null);

  const fetchProblems = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const res = await fetch('/api/problems');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const parsed = data.map((d: { filename: string; content: string }) => parseProblem(d.filename, d.content));
      setProblems(parsed);
    } catch {
      if (!silent) setError('Could not load problems from disk.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const saveProblem = async (problemData: Partial<Problem> & { filename: string; renameTo?: string }) => {
    try {
      const existing = problems.find(p => p.filename === problemData.filename)
        ?? (selectedProblemInfo?.filename === problemData.filename ? selectedProblemInfo : undefined);
      const merged: Partial<Problem> = {
        title: '',
        date: '',
        time: '',
        difficulty: 'Easy',
        tags: [],
        statement: '',
        approaches: [],
        learning: '',
        mistakes: '',
        code: '',
        favorite: false,
        status: 'Need Revision',
        ...existing,
        ...problemData,
        filename: problemData.filename,
      };
      const content = generateProblemText(merged);
      const res = await fetch(`/api/problems/${problemData.filename}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          renameTo: problemData.renameTo,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }
      const { filename: savedFilename } = await res.json();
      const finalFilename = savedFilename || problemData.filename;

      const updated = parseProblem(finalFilename, content);
      setSelectedProblemInfo(prev =>
        prev?.filename === problemData.filename ? updated : prev
      );
      setProblems(prev => {
        const rest = prev.filter(p => p.filename !== problemData.filename && p.filename !== finalFilename);
        return [...rest, updated];
      });

      toast.success(
        problemData.renameTo && finalFilename !== problemData.filename
          ? `Saved as ${finalFilename}`
          : 'Saved successfully'
      );
      return finalFilename;
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
      throw e;
    }
  };

  const deleteProblem = async (filename: string) => {
    try {
      const res = await fetch(`/api/problems/${filename}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchProblems(true);
      if (selectedProblemInfo?.filename === filename) {
        setSelectedProblemInfo(null);
      }
      toast.success('Problem deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete problem');
      throw e;
    }
  };

  const createNewProblem = async () => {
    try {
    const filename = `new-problem-${Date.now()}.txt`;
    const today = new Date().toISOString().split('T')[0];
    const content = `Title: 
Date: ${today}
Difficulty: Easy
Tags: 
Platform: 
Favorite: false
Status: Need Revision

Statement:

Approach: Approach 1
Time Complexity: 
Space Complexity: 

Learning:

Mistakes:

Code:
`;
    const res = await fetch(`/api/problems/${filename}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error('Failed to create new problem');

    await fetchProblems(true);
    
    const newProb = parseProblem(filename, content);
    setCreateModeFilename(filename);
    setSelectedProblemInfo(newProb);
    setCurrentView('all');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create new problem');
      throw e;
    }
  };

  return (
    <DataContext.Provider value={{
      problems, loading, error, refresh: () => fetchProblems(), saveProblem, deleteProblem, createNewProblem,
      searchQuery, setSearchQuery,
      selectedTag, setSelectedTag,
      currentView, setCurrentView,
      selectedProblemInfo, setSelectedProblemInfo,
      sortBy, setSortBy,
      filterDifficulty, setFilterDifficulty,
      isSidebarOpen, setIsSidebarOpen,
      createModeFilename, setCreateModeFilename,
    }}>
      {children}
    </DataContext.Provider>
  );
};
