import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Activity, Plus, Flame, Code, BookOpen, Dumbbell, Coffee, Trash2, Zap, Target } from 'lucide-react';

const categoryIcons = {
  Coding: Code,
  Reading: BookOpen,
  Exercise: Dumbbell,
  Meditation: Coffee
};

const categoryColors = {
  Coding: 'text-blue-500 bg-blue-100',
  Reading: 'text-purple-500 bg-purple-100',
  Exercise: 'text-green-500 bg-green-100',
  Meditation: 'text-orange-500 bg-orange-100'
};

const HabitsPage = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Coding');
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    fetchHabits();
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await api.get('/ai/habit-insights');
      setInsights(res.data);
    } catch(e) {
      console.error(e);
    }
  };

  const fetchHabits = async () => {
    try {
      const res = await api.get('/habits');
      const habitsArray = Array.isArray(res.data) ? res.data : res.data?.habits || res.data?.data || [];
      setHabits(habitsArray);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/habits', { name, category, target_days: 7 });
      setShowModal(false);
      setName('');
      fetchHabits();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckin = async (habitId) => {
    
    try {
      await api.post(`/habits/${habitId}/checkin`);
      fetchHabits(); // Refresh data to get updated streaks
    } catch (e) {
      console.error("Check-in error:", e);
    }
  };

  const handleDelete = async (habitId) => {
    if (!window.confirm("Are you sure you want to delete this habit?")) return;
    try {
      await api.delete(`/habits/${habitId}`);
      setHabits(habits.filter(h => h._id !== habitId));
    } catch (e) {
      console.error(e);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-lg">Habits</h1>
          <p className="text-textSecondary mt-2">Build consistency and track your daily streaks.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Habit
        </button>
      </div>

      {/* AI Insights Panel */}
      <div className="glass-panel p-6 mb-8 border-l-4 border-l-secondary">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="heading-md">AI Insights</h2>
        </div>
        
        {!insights ? (
           <div className="animate-pulse space-y-3">
             <div className="h-4 bg-slate-200 rounded w-3/4"></div>
             <div className="h-4 bg-slate-200 rounded w-1/2"></div>
           </div>
        ) : (
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-4">
               {insights.insights?.map((insight, idx) => (
                 <div key={idx} className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-border">
                   <Target className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                   <p className="text-sm font-medium text-textPrimary">{insight}</p>
                 </div>
               ))}
             </div>
             <div className="space-y-4">
               {insights.recommendations?.map((rec, idx) => (
                 <div key={idx} className="flex items-start gap-3 bg-primary/5 p-4 rounded-xl border border-primary/20">
                   <Activity className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                   <p className="text-sm font-medium text-textPrimary">{rec}</p>
                 </div>
               ))}
             </div>
           </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-textSecondary p-8">Loading habits...</div>
      ) : habits.length === 0 ? (
        <div className="glass-panel p-8 md:p-16 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-2">No habits yet</h3>
          <p className="text-textSecondary mb-6">Start building consistency by adding your first habit.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map(habit => {
            const Icon = categoryIcons[habit.category] || Activity;
            const colorClass = categoryColors[habit.category] || 'text-primary bg-primary/10';
            const isCompletedToday = habit.completions?.includes(todayStr);

            return (
              <motion.div 
                layout
                key={habit._id} 
                className="glass-panel p-6 relative overflow-hidden group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-600 rounded-full font-bold text-sm">
                      <Flame className="w-4 h-4 fill-current" />
                      {habit.streak}
                    </div>
                    <button 
                      onClick={() => handleDelete(habit._id)}
                      className="p-1 text-textSecondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg mb-1">{habit.name}</h3>
                <p className="text-sm text-textSecondary mb-6">{habit.category}</p>

                <button 
                  onClick={() => !isCompletedToday && handleCheckin(habit._id)}
                  disabled={isCompletedToday}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    isCompletedToday 
                      ? 'bg-success/10 text-success cursor-default' 
                      : 'bg-gray-100 text-textPrimary hover:bg-primary hover:text-white'
                  }`}
                >
                  {isCompletedToday ? 'Completed Today!' : 'Check In'}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">Create Habit</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Habit Name</label>
                <input required value={name} onChange={e=>setName(e.target.value)} type="text" className="input-field" placeholder="e.g. 1 hour LeetCode" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select value={category} onChange={e=>setCategory(e.target.value)} className="input-field">
                  <option>Coding</option>
                  <option>Reading</option>
                  <option>Exercise</option>
                  <option>Meditation</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsPage;
