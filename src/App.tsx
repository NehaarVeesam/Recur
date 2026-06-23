import React from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { ProblemList } from './components/ProblemList';
import { ProblemDetailView } from './components/ProblemDetailView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { TagsExplorer } from './components/TagsExplorer';
import { Toaster } from 'react-hot-toast';

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

  return (
    <div className="flex h-screen bg-[#050505] text-slate-300 font-sans overflow-hidden relative">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-20 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - fixed on mobile, relative on desktop */}
      <div className={`fixed inset-y-0 left-0 z-30 md:relative transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10 w-full">
        <ContentWrapper />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <RootLayout />
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#111',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '14px',
          },
          success: {
             iconTheme: {
                primary: '#818CF8', // indigo-400
                secondary: '#111',
             }
          }
        }} 
      />
    </DataProvider>
  );
}
