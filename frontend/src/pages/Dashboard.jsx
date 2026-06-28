import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CheckCircle2, Circle, AlertTriangle, Clock, TrendingUp, Zap, Activity, Target, Star, Compass } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';


const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [briefing, setBriefing] = useState(null);
  const [habitInsights, setHabitInsights] = useState(null);
  const [weeklyReview, setWeeklyReview] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/tasks')
        ]);
        
        setStats(statsRes.data || {});
        
        // Normalize tasks array
        const tasksArray = Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data?.tasks || [];
        const pendingTasks = tasksArray.filter(t => !t.completed);
        const sortedTasks = pendingTasks.sort((a, b) => {
          if (a.recommended_order !== undefined && b.recommended_order !== undefined) {
            return a.recommended_order - b.recommended_order;
          }
          if (a.recommended_order !== undefined) return -1;
          if (b.recommended_order !== undefined) return 1;
          return new Date(b.created_at || 0) - new Date(a.created_at || 0); // Fallback
        });
        setTasks(sortedTasks.slice(0, 5));
        setLoading(false);

        // Fetch AI in background
        api.get('/ai/risk-assessment').then(res => {
          const riskArray = Array.isArray(res.data) ? res.data : res.data?.risks || res.data?.data || [];
          setRiskData(riskArray);
        }).catch(() => setRiskData([]));

        api.get('/ai/daily-coach').then(res => setBriefing(res.data)).catch(console.error);
        api.get('/ai/habit-insights').then(res => setHabitInsights(res.data)).catch(console.error);
        api.get('/ai/weekly-review').then(res => setWeeklyReview(res.data)).catch(console.error);
        api.get('/ai/productivity-forecast').then(res => setForecast(res.data)).catch(console.error);

      } catch (error) {
        console.error("Error fetching dashboard data", error);
        setError("Failed to load your dashboard data. Please try again.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8"><div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-200 rounded"></div><div className="space-y-3"><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-slate-200 rounded col-span-2"></div><div className="h-2 bg-slate-200 rounded col-span-1"></div></div><div className="h-2 bg-slate-200 rounded"></div></div></div></div></div>;
  }

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto w-full flex flex-col items-center justify-center min-h-[50vh]">
        <AlertTriangle className="w-12 h-12 text-danger mb-4" />
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-textSecondary mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
      </div>
    );
  }

  const handleComplete = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}`, { completed: true });
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full slide-up">
      <header className="mb-8">
        <h1 className="heading-lg">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-textSecondary mt-2">Here is what's happening with your productivity today.</p>
      </header>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4 text-textSecondary">
            <span className="font-medium text-sm">Productivity Score</span>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{stats?.productivity_score || 0}%</div>
          <p className="text-xs text-success mt-2 font-medium">+12% from last week</p>
        </div>
        
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4 text-textSecondary">
            <span className="font-medium text-sm">Focus Hours</span>
            <Clock className="w-5 h-5 text-secondary" />
          </div>
          <div className="text-3xl font-bold">{stats?.focus_hours || 0}h</div>
          <p className="text-xs text-textSecondary mt-2">Logged this week</p>
        </div>
        
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4 text-textSecondary">
            <span className="font-medium text-sm">Completed Tasks</span>
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div className="text-3xl font-bold">{stats?.completed_tasks || 0}</div>
          <p className="text-xs text-textSecondary mt-2">Out of {stats?.total_tasks || 0} total</p>
        </div>
        
        <div className="glass-panel p-6 bg-primary text-white border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Zap className="w-24 h-24" /></div>
          <div className="relative z-10">
            <div className="font-medium text-sm mb-4 opacity-90">Current Streak</div>
            <div className="text-3xl font-bold">{stats?.current_streak || 0} Days</div>
            <p className="text-xs mt-2 font-medium">Keep it up! 🔥</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Recommendations */}
          <div className="glass-panel p-6 border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="heading-md">AI Daily Coach</h2>
            </div>
            
            {!briefing ? (
               <div className="animate-pulse space-y-3">
                 <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                 <div className="h-4 bg-slate-200 rounded w-1/2"></div>
               </div>
            ) : (
               <div className="space-y-4">
                 <div>
                   <h3 className="font-bold text-lg text-textPrimary">{briefing.greeting}</h3>
                   <p className="text-textSecondary mt-1 leading-relaxed">{briefing.summary}</p>
                 </div>
                 
                 {briefing.warning && (
                   <div className="p-3 bg-danger/10 text-danger text-sm font-medium rounded-lg border border-danger/20 flex items-start gap-2">
                     <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                     {briefing.warning}
                   </div>
                 )}
                 
                 <div className="bg-gray-50 rounded-xl p-4 border border-border">
                   <p className="text-sm font-bold text-textPrimary mb-1 flex items-center gap-2">🎯 Today's Focus</p>
                   <p className="text-textSecondary text-sm mb-3">{briefing.top_task !== "None" ? briefing.top_task : "No pending tasks"}</p>
                   
                   <p className="text-sm font-bold text-textPrimary mb-1 flex items-center gap-2">💡 Recommendation</p>
                   <p className="text-textSecondary text-sm">{briefing.recommendation}</p>
                 </div>
                 
                 <p className="text-primary font-medium italic text-sm border-t border-border pt-4 mt-2 text-center">
                   "{briefing.motivation}"
                 </p>
               </div>
            )}
          </div>

          {/* Habit Intelligence */}
          <div className="glass-panel p-6 border-l-4 border-l-secondary">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="heading-md">Habit Intelligence</h2>
            </div>
            
            {!habitInsights ? (
               <div className="animate-pulse space-y-3">
                 <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                 <div className="h-4 bg-slate-200 rounded w-1/2"></div>
               </div>
            ) : (
               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-gray-50 rounded-xl p-4 border border-border">
                     <p className="text-sm font-bold text-textPrimary mb-1 flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-secondary" /> Overall Score
                     </p>
                     <p className="text-2xl font-bold text-secondary">{habitInsights.overall_habit_score}%</p>
                   </div>
                   <div className="bg-gray-50 rounded-xl p-4 border border-border">
                     <p className="text-sm font-bold text-textPrimary mb-1 flex items-center gap-2">
                       <Target className="w-4 h-4 text-success" /> Best Habit
                     </p>
                     <p className="text-sm font-medium truncate">{habitInsights.best_habit}</p>
                   </div>
                 </div>
                 
                 <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                   <p className="text-sm font-bold text-primary mb-1 flex items-center gap-2">💡 AI Insight</p>
                   <p className="text-textSecondary text-sm">{habitInsights.insights?.[0]}</p>
                 </div>
                 
                 <p className="text-secondary font-medium italic text-sm border-t border-border pt-4 mt-2 text-center">
                   "{habitInsights.motivation}"
                 </p>
               </div>
            )}
          </div>

          {/* Productivity Chart */}
          <div className="glass-panel p-6">
            <h2 className="heading-md mb-6">Weekly Performance</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.weekly_data || []}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="hours" stroke="#2563EB" strokeWidth={3} dot={{r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* Weekly Highlight */}
          <div className="glass-panel p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3 mb-4 text-purple-600">
              <Star className="w-5 h-5" />
              <h2 className="font-bold text-lg text-textPrimary">Weekly Highlight</h2>
            </div>
            {!weeklyReview ? (
               <div className="animate-pulse space-y-3">
                 <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                 <div className="h-4 bg-slate-200 rounded w-1/2"></div>
               </div>
            ) : (
               <div className="space-y-3">
                 <p className="text-sm text-textSecondary">{weeklyReview.summary}</p>
                 <div className="flex items-center justify-between pt-2">
                   <div className="text-sm font-bold text-purple-600">Score: {weeklyReview.overall_score}/100</div>
                   <button onClick={() => navigate('/analytics')} className="text-primary text-sm font-medium hover:underline">Full Report</button>
                 </div>
               </div>
            )}
          </div>

          {/* This Week Forecast */}
          <div className="glass-panel p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 mb-4 text-blue-600">
              <Compass className="w-5 h-5" />
              <h2 className="font-bold text-lg text-textPrimary">Productivity Forecast</h2>
            </div>
            {!forecast ? (
               <div className="animate-pulse space-y-3">
                 <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                 <div className="h-4 bg-slate-200 rounded w-1/2"></div>
               </div>
            ) : (
               <div className="space-y-4">
                 <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-border">
                   <span className="text-sm font-medium text-textSecondary">Completion Prob.</span>
                   <span className="text-lg font-bold text-blue-600">{forecast.completion_probability}%</span>
                 </div>
                 <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-border">
                   <span className="text-sm font-medium text-textSecondary">Overload Risk</span>
                   <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                     forecast.overload_risk === 'High' ? 'bg-danger/10 text-danger' :
                     forecast.overload_risk === 'Medium' ? 'bg-warning/10 text-warning' :
                     'bg-success/10 text-success'
                   }`}>{forecast.overload_risk}</span>
                 </div>
                 <div className="text-right">
                   <button onClick={() => navigate('/analytics')} className="text-primary text-sm font-medium hover:underline">Full Forecast</button>
                 </div>
               </div>
            )}
          </div>

          {/* High Risk Deadlines */}
          {riskData.length > 0 && (
            <div className="glass-panel p-6 border border-warning/30 bg-warning/5">
              <div className="flex items-center gap-3 mb-4 text-warning">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="font-bold text-lg">Deadline Risk</h2>
              </div>
              <div className="space-y-4">
                {riskData.slice(0, 2).map((risk, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-warning/20 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{risk.title}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                            risk.risk_percentage <= 30 ? 'bg-success/10 text-success' :
                            risk.risk_percentage <= 60 ? 'bg-warning/10 text-warning' :
                            risk.risk_percentage <= 80 ? 'bg-orange-500/10 text-orange-600' :
                            'bg-danger/10 text-danger'
                          }`}>{risk.risk_percentage}% Risk</span>
                    </div>
                    <p className="text-xs text-textSecondary">{risk.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Tasks */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Up Next</h2>
              <button onClick={() => navigate('/tasks', { state: { filter: 'All' } })} className="text-primary text-sm font-medium hover:underline">View All</button>
            </div>
            
            {tasks.length === 0 ? (
              <p className="text-sm text-textSecondary text-center py-4">You're all caught up!</p>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                    <button onClick={() => handleComplete(task._id)} className="text-gray-300 hover:text-success transition-colors">
                      <Circle className="w-5 h-5" />
                    </button>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === 'HIGH' ? 'bg-danger/10 text-danger' : 
                          task.priority === 'MEDIUM' ? 'bg-warning/10 text-warning' : 
                          'bg-success/10 text-success'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-textSecondary flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.estimated_hours}h
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
