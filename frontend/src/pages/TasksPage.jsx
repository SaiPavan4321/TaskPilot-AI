import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Clock, Circle, CheckCircle2, MoreVertical, Search, Calendar as CalendarIcon, Edit2, Trash2, AlertTriangle } from 'lucide-react';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Filtering & Search
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState(location.state?.filter || 'All'); // 'All', 'To Do', 'Completed'

  // Dropdown State
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [hours, setHours] = useState('1');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState('Medium');
  
  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpenId && !e.target.closest('.dropdown-container')) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      const tasksArray = Array.isArray(res.data) ? res.data : res.data?.tasks || res.data?.data || [];
      setTasks(tasksArray);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDeadline('');
    setHours('1');
    setCategory('Work');
    setPriority('Medium');
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setIsEditing(true);
    setEditingId(task._id);
    setTitle(task.title);
    setDescription(task.description || '');
    setDeadline(task.deadline || '');
    setHours(task.estimated_hours?.toString() || '1');
    setCategory(task.category || 'Work');
    setPriority(task.priority || 'Medium');
    setShowModal(true);
    setMenuOpenId(null);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        description,
        deadline,
        estimated_hours: parseFloat(hours),
        category,
        priority
      };

      if (isEditing) {
        const res = await api.put(`/tasks/${editingId}`, payload);
        setTasks(tasks.map(t => t._id === editingId ? res.data : t));
        showToast('Task updated successfully!');
      } else {
        const res = await api.post('/tasks', payload);
        setTasks([...tasks, res.data]);
        showToast('Task created successfully!');
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
      showToast('Error saving task');
    }
  };

  const handleSmartPrioritize = async () => {
    setAiLoading(true);
    try {
      await api.post('/tasks/prioritize');
      await fetchTasks();
      showToast('Tasks reprioritized!');
    } catch (e) {
      console.error(e);
      showToast('Error running AI prioritize');
    } finally {
      setAiLoading(false);
    }
  };

  const handleComplete = async (taskId, currentStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { completed: !currentStatus });
      setTasks(tasks.map(t => t._id === taskId ? { ...t, completed: !currentStatus } : t));
      setMenuOpenId(null);
      showToast(currentStatus ? 'Task marked pending' : 'Task marked complete');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task?\nThis action cannot be undone.")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      setMenuOpenId(null);
      showToast('Task deleted successfully!');
    } catch (e) {
      console.error(e);
      showToast('Error deleting task');
    }
  };

  // Filter Logic
  const filteredTasks = tasks.filter(task => {
    if (filterTab === 'To Do' && task.completed) return false;
    if (filterTab === 'Completed' && !task.completed) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title?.toLowerCase().includes(q);
      const matchCat = task.category?.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full slide-up">
      {/* Removed Invisible Overlay */}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="heading-lg">Task Management</h1>
          <p className="text-textSecondary mt-2">Manage, organize, and prioritize your workload.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSmartPrioritize} 
            disabled={aiLoading || tasks.length === 0}
            className="btn-secondary flex items-center gap-2 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {aiLoading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-4 h-4 text-primary" />
            )}
            <span className="relative z-10 text-primary font-semibold">Smart Prioritize</span>
          </button>
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
            <input 
              type="text" 
              placeholder="Search by title, category, or description..." 
              className="input-field pl-10 py-2 text-sm bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            {['All', 'To Do', 'Completed'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilterTab(f)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${f === filterTab ? 'bg-primary text-white' : 'bg-white text-textSecondary border border-border hover:bg-gray-50'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-textSecondary">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <CheckSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">No tasks found</h3>
            <p className="text-textSecondary mb-6">
              {tasks.length === 0 ? "Create a task to get started on your productivity journey." : "No tasks match your filters."}
            </p>
            {tasks.length === 0 && (
              <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add First Task
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence>
              {filteredTasks.map((task, index) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={task._id} 
                  className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors relative ${task.completed ? 'opacity-60' : ''} ${menuOpenId === task._id ? 'z-50' : 'z-0'}`}
                >
                  <button onClick={() => handleComplete(task._id, task.completed)}>
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    ) : (
                      <Circle className="w-6 h-6 text-border hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm md:text-base ${task.completed ? 'line-through text-textSecondary' : 'text-textPrimary'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-textSecondary mt-0.5 truncate">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-textSecondary">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {task.deadline || 'No deadline'}
                      </span>
                      <span className="text-[10px] text-textSecondary flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.estimated_hours}h
                      </span>
                      <span className="text-[10px] text-textSecondary flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                        {task.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'HIGH' ? 'bg-danger/10 text-danger' : 
                        task.priority === 'MEDIUM' ? 'bg-warning/10 text-warning' : 
                        'bg-success/10 text-success'
                      }`}>
                        {task.priority}
                      </span>
                      {task.ai_score && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {task.ai_score} Score
                        </span>
                      )}
                      {task.risk_percentage !== undefined && task.risk_percentage !== null && !task.completed && (
                        <span 
                          title={`${task.risk_reason || ''} | Best start: ${task.best_start_time || 'N/A'}`}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-help ${
                            task.risk_percentage <= 30 ? 'bg-success/10 text-success border-success/20' :
                            task.risk_percentage <= 60 ? 'bg-warning/10 text-warning border-warning/20' :
                            task.risk_percentage <= 80 ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                            'bg-danger/10 text-danger border-danger/20'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" /> {task.risk_percentage}% Risk
                        </span>
                      )}
                    </div>
                    {task.priority_reason && (
                      <p className="text-xs text-textSecondary mt-1 italic flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary opacity-70" />
                        {task.priority_reason}
                      </p>
                    )}
                  </div>
                  
                  {/* Three Dot Menu */}
                  <div className="relative dropdown-container">
                    <button 
                      onClick={() => setMenuOpenId(menuOpenId === task._id ? null : task._id)} 
                      className="p-2 text-textSecondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors z-20 relative"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {menuOpenId === task._id && (
                      <div className={`absolute right-0 w-48 bg-white border border-border rounded-xl shadow-lg z-30 overflow-hidden py-1 ${
                        index >= filteredTasks.length - 2 && filteredTasks.length > 3 ? 'bottom-full mb-2' : 'mt-2'
                      }`}>
                        <button onClick={() => openEditModal(task)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-textPrimary hover:bg-gray-50 text-left">
                          <Edit2 className="w-4 h-4" /> Edit Task
                        </button>
                        <button onClick={() => handleComplete(task._id, task.completed)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-textPrimary hover:bg-gray-50 text-left">
                          {task.completed ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} 
                          {task.completed ? 'Mark Pending' : 'Mark Complete'}
                        </button>
                        <div className="h-px bg-border my-1"></div>
                        <button onClick={() => handleDelete(task._id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10 text-left font-medium">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">{isEditing ? 'Edit Task' : 'Add New Task'}</h2>
            </div>
            <form onSubmit={handleSubmitTask} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1.5">Task Title</label>
                <input required value={title} onChange={e=>setTitle(e.target.value)} type="text" className="input-field" placeholder="What needs to be done?" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description (Optional)</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} className="input-field resize-none h-20" placeholder="Add some details..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Deadline</label>
                  <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Est. Hours</label>
                  <input required type="number" min="0.5" step="0.5" value={hours} onChange={e=>setHours(e.target.value)} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select value={category} onChange={e=>setCategory(e.target.value)} className="input-field">
                    <option>Work</option>
                    <option>Study</option>
                    <option>Personal</option>
                    <option>Hackathon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Priority</label>
                  <select value={priority} onChange={e=>setPriority(e.target.value)} className="input-field">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{isEditing ? 'Save Changes' : 'Create Task'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="font-medium text-sm">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple stub CheckSquare icon for the empty state
const CheckSquare = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;

export default TasksPage;
