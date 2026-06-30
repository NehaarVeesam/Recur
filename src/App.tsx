import React from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { ProblemList } from './components/ProblemList';
import { ProblemDetailView } from './components/ProblemDetailView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { TagsExplorer } from './components/TagsExplorer';
import { Toaster } from 'react-hot-toast';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import { useIsMobile } from './hooks/useIsMobile';
import { cn } from './utils/cn';

const GlobalShortcuts = () => {
  useGlobalKeyboardShortcuts();
  return null;
};

const ContentWrapper = () => {
  const { currentView, selectedTag, selectedProblemInfo } = useData();

  if (selectedProblemInfo) {
    return <ProblemDetailView />;
  }

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-hidden">
      <TopNav />
      <div className="flex-1 overflow-y-auto relative no-scrollbar">
        {currentView === 'analytics' ? (
          <AnalyticsDashboard />
        ) : currentView === 'tags' && !selectedTag ? (
          <TagsExplorer />
        ) : (
          <ProblemList />
        )}
      </div>
    </div>
  );
};

const RootLayout = () => {
  const { isSidebarOpen, setIsSidebarOpen } = useData();
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-dvh h-dvh bg-[#050505] text-slate-300 font-sans overflow-hidden relative safe-area-x">
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-20 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'shrink-0 h-full transition-[width,transform] duration-300 ease-in-out overflow-hidden',
          isMobile ? 'fixed inset-y-0 left-0 z-30 w-64' : 'relative',
          isMobile
            ? isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            : isSidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        <ContentWrapper />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <GlobalShortcuts />
      <RootLayout />
      <Toaster 
        position="bottom-center"
        containerStyle={{
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
        toastOptions={{
          style: {
            background: '#111',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '14px',
          },
          success: {
             iconTheme: {
                primary: '#818CF8',
                secondary: '#111',
             }
          }
        }} 
      />
    </DataProvider>
  );
}
