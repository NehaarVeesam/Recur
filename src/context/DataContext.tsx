import React, { createContext, useContext, useEffect, useState } from 'react';
import { Problem, parseProblem, generateProblemText } from '../utils/parser';
import toast from 'react-hot-toast';

interface DataContextType {
  problems: Problem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveProblem: (problem: Partial<Problem> & { filename: string }) => Promise<void>;
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

  const saveProblem = async (problemData: Partial<Problem> & { filename: string }) => {
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
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('Failed to save');

      const updated = parseProblem(problemData.filename, content);
      setSelectedProblemInfo(prev =>
        prev?.filename === problemData.filename ? updated : prev
      );
      setProblems(prev =>
        prev.some(p => p.filename === problemData.filename)
          ? prev.map(p => (p.filename === problemData.filename ? updated : p))
          : [...prev, updated]
      );

      toast.success('Saved successfully');
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
    const content = `Title: New Problem
Date: ${new Date().toISOString().split('T')[0]}
Difficulty: Easy
Tags: Array
Platform: LeetCode
Favorite: false
Status: Need Revision

Statement:
Describe the problem here.

Approach: Approach 1
Time Complexity: O(n)
Space Complexity: O(1)
Explain your approach here.

Learning:
What did you learn from this problem?

Mistakes:
What went wrong? Wrong approaches, bugs, edge cases missed...

Code:
def solve():
    pass
`;
    const res = await fetch(`/api/problems/${filename}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error('Failed to create new problem');

    await fetchProblems(true);
    
    // Auto-select the newly created problem
    const newProb = parseProblem(filename, content);
    setSelectedProblemInfo(newProb);
    setCurrentView('all'); // switch to all view to show the new problem context
    toast.success('Successfully created new problem');
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
      isSidebarOpen, setIsSidebarOpen
    }}>
      {children}
    </DataContext.Provider>
  );
};
