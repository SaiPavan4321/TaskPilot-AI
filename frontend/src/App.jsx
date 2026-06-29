import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Menu } from 'lucide-react';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import AIPlannerPage from './pages/AIPlannerPage';
import AIChatPage from './pages/AIChatPage';
import HabitsPage from './pages/HabitsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 overflow-y-auto flex flex-col w-full min-w-0">
        <div className="md:hidden flex items-center p-4 border-b border-border bg-card shrink-0 z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-textSecondary hover:text-primary transition-colors" aria-label="Open sidebar">
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-2 font-bold text-lg tracking-tight">TaskPilot<span className="text-primary">AI</span></span>
        </div>
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/planner" element={<ProtectedRoute><AIPlannerPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><AIChatPage /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
