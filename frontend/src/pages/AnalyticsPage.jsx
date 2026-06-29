import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, TrendingUp, Clock, CheckCircle2, AlertTriangle, Activity, Star, Compass } from 'lucide-react';

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [risks, setRisks] = useState([]);
  const [habitInsights, setHabitInsights] = useState(null);
  const [weeklyReview, setWeeklyReview] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        setStats(res.data);
        setLoading(false);
        
        api.get('/ai/risk-assessment').then(riskRes => setRisks(riskRes.data || [])).catch(() => setRisks([]));
        api.get('/ai/habit-insights').then(habitRes => setHabitInsights(habitRes.data)).catch(console.error);
        api.get('/ai/weekly-review').then(weeklyRes => setWeeklyReview(weeklyRes.data)).catch(console.error);
        api.get('/ai/productivity-forecast').then(forecastRes => setForecast(forecastRes.data)).catch(console.error);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-4 md:p-8 text-textSecondary text-center">Loading analytics...</div>;

  const completionData = [
    { name: 'Completed', value: stats?.completed_tasks || 0 },
    { name: 'Pending', value: stats?.pending_tasks || 0 },
  ];


  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full slide-up">
      <div className="mb-8">
        <h1 className="heading-lg">Analytics</h1>
        <p className="text-textSecondary mt-2">Deep dive into your productivity patterns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {[
          { label: 'Productivity Score', value: `${stats?.productivity_score}%`, icon: TrendingUp, color: 'text-primary bg-primary/10' },
          { label: 'Focus Hours', value: `${stats?.focus_hours}h`, icon: Clock, color: 'text-secondary bg-secondary/10' },
          { label: 'Tasks Completed', value: stats?.completed_tasks, icon: CheckCircle2, color: 'text-success bg-success/10' },
          { label: 'Current Streak', value: `${stats?.current_streak || 0} Days`, icon: Target, color: 'text-warning bg-warning/10' },
          { label: 'High Risk Tasks', value: risks.filter(r => r.risk_percentage > 60).length, icon: AlertTriangle, color: 'text-danger bg-danger/10' },
          { label: 'Habit Score', value: `${habitInsights?.overall_habit_score || 0}%`, icon: Activity, color: 'text-purple-500 bg-purple-500/10' },
        ].map((item, i) => (
          <div key={i} className="glass-panel p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-textSecondary">{item.label}</p>
              <h3 className="text-2xl font-bold">{item.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* AI Weekly Review */}
      <div className="glass-panel p-6 mb-8 border-l-4 border-l-purple-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
            <Star className="w-5 h-5" />
          </div>
          <h2 className="heading-md">AI Weekly Review</h2>
        </div>
        
        {!weeklyReview ? (
           <div className="animate-pulse space-y-4">
             <div className="h-4 bg-slate-200 rounded w-3/4"></div>
             <div className="h-4 bg-slate-200 rounded w-1/2"></div>
             <div className="h-4 bg-slate-200 rounded w-full"></div>
           </div>
        ) : (
           <div className="space-y-6">
             <div className="flex items-start justify-between">
               <div>
                 <p className="text-textSecondary text-lg mb-1">{weeklyReview.summary}</p>
                 <p className="text-purple-600 font-bold">Overall Score: {weeklyReview.overall_score}/100</p>
               </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-6">
               <div className="bg-success/5 border border-success/20 p-4 rounded-xl">
                 <h3 className="font-bold text-success mb-2 flex items-center gap-2">👍 Strengths</h3>
                 <ul className="list-disc list-inside text-sm text-textSecondary space-y-1">
                   {weeklyReview.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                 </ul>
               </div>
               <div className="bg-danger/5 border border-danger/20 p-4 rounded-xl">
                 <h3 className="font-bold text-danger mb-2 flex items-center gap-2">📈 Areas for Improvement</h3>
                 <ul className="list-disc list-inside text-sm text-textSecondary space-y-1">
                   {weeklyReview.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                 </ul>
               </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-6">
               <div className="bg-gray-50 border border-border p-4 rounded-xl">
                 <h3 className="font-bold text-textPrimary mb-2 flex items-center gap-2">🔍 Patterns</h3>
                 <ul className="list-disc list-inside text-sm text-textSecondary space-y-1">
                   {weeklyReview.patterns?.map((p, i) => <li key={i}>{p}</li>)}
                 </ul>
               </div>
               <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                 <h3 className="font-bold text-primary mb-2 flex items-center gap-2">💡 Recommendations</h3>
                 <ul className="list-disc list-inside text-sm text-textSecondary space-y-1">
                   {weeklyReview.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
                 </ul>
               </div>
             </div>
             
             <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 border border-purple-500/20 p-4 rounded-xl text-center">
               <p className="text-sm font-bold text-textPrimary mb-1">Next Week's Goal</p>
               <p className="text-purple-600 font-medium">{weeklyReview.next_week_goal}</p>
             </div>
           </div>
        )}
      </div>

      {/* AI Productivity Forecast */}
      <div className="glass-panel p-6 mb-8 border-l-4 border-l-blue-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="heading-md">AI Productivity Forecast</h2>
        </div>
        
        {!forecast ? (
           <div className="animate-pulse space-y-4">
             <div className="h-4 bg-slate-200 rounded w-3/4"></div>
             <div className="h-4 bg-slate-200 rounded w-1/2"></div>
             <div className="h-4 bg-slate-200 rounded w-full"></div>
           </div>
        ) : (
           <div className="space-y-6">
             <p className="text-textSecondary text-lg mb-1">{forecast.forecast_summary}</p>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-gray-50 p-4 rounded-xl border border-border">
                 <p className="text-sm font-medium text-textSecondary mb-1">Forecast Score</p>
                 <p className="text-2xl font-bold text-blue-600">{forecast.forecast_score}</p>
               </div>
               <div className="bg-gray-50 p-4 rounded-xl border border-border">
                 <p className="text-sm font-medium text-textSecondary mb-1">Completion Prob.</p>
                 <p className="text-2xl font-bold text-primary">{forecast.completion_probability}%</p>
               </div>
               <div className="bg-gray-50 p-4 rounded-xl border border-border">
                 <p className="text-sm font-medium text-textSecondary mb-1">Predicted Focus</p>
                 <p className="text-2xl font-bold text-secondary">{forecast.predicted_focus_hours}h</p>
               </div>
               <div className={`p-4 rounded-xl border ${
                 forecast.overload_risk === 'High' ? 'bg-danger/10 border-danger/20 text-danger' :
                 forecast.overload_risk === 'Medium' ? 'bg-warning/10 border-warning/20 text-warning' :
                 'bg-success/10 border-success/20 text-success'
               }`}>
                 <p className="text-sm font-medium mb-1">Overload Risk</p>
                 <p className="text-2xl font-bold">{forecast.overload_risk}</p>
               </div>
             </div>

             <div className="grid md:grid-cols-2 gap-6">
               <div className="bg-gray-50 p-4 rounded-xl border border-border flex justify-between items-center">
                 <div>
                   <p className="text-sm font-medium text-textSecondary">Busiest Day</p>
                   <p className="font-bold text-textPrimary">{forecast.busiest_day}</p>
                 </div>
                 <AlertTriangle className="text-warning w-5 h-5" />
               </div>
               <div className="bg-gray-50 p-4 rounded-xl border border-border flex justify-between items-center">
                 <div>
                   <p className="text-sm font-medium text-textSecondary">Lightest Day</p>
                   <p className="font-bold text-textPrimary">{forecast.lightest_day}</p>
                 </div>
                 <Target className="text-success w-5 h-5" />
               </div>
             </div>
             
             <div className="bg-blue-50/50 border border-blue-500/20 p-4 rounded-xl">
               <h3 className="font-bold text-blue-600 mb-2 flex items-center gap-2">🎯 Smart Goals for the Week</h3>
               <ul className="list-disc list-inside text-sm text-textSecondary space-y-1">
                 {forecast.recommended_goals?.map((g, i) => <li key={i}>{g}</li>)}
               </ul>
             </div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h2 className="font-bold text-lg mb-6">Focus Hours by Day</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weekly_data || []}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dy={10} />
                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="hours" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="font-bold text-lg mb-6">Task Completion Ratio</h2>
          <div className="h-72 w-full flex items-center justify-center">
            {stats?.total_tasks === 0 ? (
              <p className="text-textSecondary">No data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
