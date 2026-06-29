import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Calendar, MessageSquare, Activity, Settings, LogOut, BarChart2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useAuth();
  
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && setIsOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [setIsOpen]);
  
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { name: 'AI Planner', icon: Calendar, path: '/planner' },
    { name: 'AI Chat', icon: MessageSquare, path: '/chat' },
    { name: 'Habits', icon: Activity, path: '/habits' },
    { name: 'Analytics', icon: BarChart2, path: '/analytics' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 md:hidden fade-in" 
          onClick={() => setIsOpen && setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <div className="w-0 md:w-64 shrink-0 md:relative md:z-40">
        <div className={`fixed inset-y-0 left-0 w-[280px] md:w-full bg-card border-r border-border h-full flex flex-col py-6 shadow-2xl md:shadow-none z-[60] md:z-auto transform transition-transform duration-300 ease-in-out md:absolute md:inset-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-6 mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
              T
            </div>
            <span className="text-xl font-bold tracking-tight">TaskPilot<span className="text-primary">AI</span></span>
          </div>
          <button 
            className="md:hidden p-1 text-textSecondary hover:text-primary transition-colors"
            onClick={() => setIsOpen && setIsOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      
      <div className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setIsOpen && setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-textSecondary hover:bg-gray-50 hover:text-textPrimary'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </div>
      
      <div className="px-6 mt-auto">
        <div className="p-4 bg-gray-50 rounded-xl border border-border mb-4 flex items-center gap-3">
          {user?.picture ? (
            <img src={user.picture} alt={user?.name} className="w-10 h-10 rounded-full border border-border object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-xs text-textSecondary truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-danger font-medium hover:bg-danger/10 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
