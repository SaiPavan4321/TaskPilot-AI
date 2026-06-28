import React, { useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Send, Calendar, Wand2, Save, RotateCcw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIPlannerPage = () => {
  const [prompt, setPrompt] = useState('');
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const res = await api.post('/ai/planner', { prompt });
      setTasks(res.data);
    } catch (e) {
      console.error("Failed to generate plan", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskChange = (index, field, value) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const handleSaveAll = async () => {
    if (!tasks || tasks.length === 0) return;
    setSaving(true);
    try {
      await api.post('/ai/planner/save', tasks);
      navigate('/tasks');
    } catch (e) {
      console.error("Failed to save tasks", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full slide-up">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary shadow-inner">
          <Wand2 className="w-8 h-8" />
        </div>
        <h1 className="heading-lg mb-4">AI Task Planner</h1>
        <p className="text-lg text-textSecondary max-w-2xl mx-auto">
          Tell TaskPilot what you need to achieve, and our AI will break it down into actionable tasks.
        </p>
      </div>

      <div className="glass-panel p-4 mb-10 relative">
        <textarea 
          className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder:text-textSecondary/70 min-h-[120px] resize-none p-2"
          placeholder="e.g. I want to build a React Native app for habit tracking by next Friday. I can work 3 hours a day."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <button 
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Plan
              </>
            )}
          </button>
        </div>
      </div>

      {tasks && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-md">Generated Action Plan</h2>
            <div className="flex gap-3">
              <button 
                onClick={handleGenerate}
                disabled={loading || saving}
                className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl"
              >
                <RotateCcw className="w-4 h-4" /> Regenerate
              </button>
              <button 
                onClick={handleSaveAll}
                disabled={saving || tasks.length === 0}
                className="btn-primary flex items-center gap-2 px-6 py-2 rounded-xl"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : <Save className="w-4 h-4" />}
                Save All Tasks
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tasks.map((task, index) => (
              <div key={index} className="glass-panel p-5 relative group">
                <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-primary"></div>
                
                <input 
                  type="text" 
                  value={task.title}
                  onChange={e => handleTaskChange(index, 'title', e.target.value)}
                  className="w-full bg-transparent border-none text-lg font-bold text-textPrimary px-0 py-1 mb-2 focus:ring-0 focus:border-b focus:border-primary"
                />
                
                <textarea
                  value={task.description}
                  onChange={e => handleTaskChange(index, 'description', e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-textSecondary px-0 py-1 resize-none h-16 focus:ring-0 focus:border-b focus:border-primary"
                  placeholder="Task description..."
                />
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-xs text-textSecondary mb-1 block">Deadline</label>
                    <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2 border border-border">
                      <Calendar className="w-4 h-4 text-primary" />
                      <input 
                        type="date" 
                        value={task.deadline || ''}
                        onChange={e => handleTaskChange(index, 'deadline', e.target.value)}
                        className="bg-transparent border-none p-0 text-sm w-full focus:ring-0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-textSecondary mb-1 block">Est. Hours</label>
                    <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2 border border-border">
                      <Clock className="w-4 h-4 text-primary" />
                      <input 
                        type="number" 
                        min="0.5"
                        step="0.5"
                        value={task.estimated_hours || 1}
                        onChange={e => handleTaskChange(index, 'estimated_hours', parseFloat(e.target.value))}
                        className="bg-transparent border-none p-0 text-sm w-full focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <div className="flex-1">
                    <label className="text-xs text-textSecondary mb-1 block">Category</label>
                    <select 
                      value={task.category || 'Work'}
                      onChange={e => handleTaskChange(index, 'category', e.target.value)}
                      className="w-full bg-background/50 border border-border rounded-lg text-sm px-3 py-2 focus:ring-0"
                    >
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                      <option value="Study">Study</option>
                      <option value="Health">Health</option>
                      <option value="Finance">Finance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-textSecondary mb-1 block">Priority</label>
                    <select 
                      value={task.priority || 'MEDIUM'}
                      onChange={e => handleTaskChange(index, 'priority', e.target.value)}
                      className="w-full bg-background/50 border border-border rounded-lg text-sm px-3 py-2 focus:ring-0"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Suggested Prompts */}
      {!tasks && !loading && (
        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-textSecondary uppercase tracking-wider mb-6">Try these examples</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Plan my hackathon project over the next 3 days",
              "I have a coding interview next week, break down my study plan",
              "Create a 5-day marketing launch plan"
            ].map(suggestion => (
              <button 
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="px-4 py-2 bg-white border border-border rounded-full text-sm font-medium text-textSecondary hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPlannerPage;
