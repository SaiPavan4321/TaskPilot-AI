import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, BrainCircuit, Activity, Clock, Target } from 'lucide-react';

const SettingsPage = () => {
  const { user, logout, updateSettings } = useAuth();
  
  const [activeTab, setActiveTab] = useState('Profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const defaultPrefs = user?.preferences || {};

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  
  // AI & Goals
  const [aiPersonality, setAiPersonality] = useState(defaultPrefs.ai_personality || 'Professional Coach');
  const [goal, setGoal] = useState(defaultPrefs.goal || 'Improve productivity');
  const [learningGoal, setLearningGoal] = useState(defaultPrefs.learning_goal || 'Learn continuously');
  
  // Productivity
  const [focusLimit, setFocusLimit] = useState(defaultPrefs.daily_focus_limit || 4);
  const [breakInterval, setBreakInterval] = useState(defaultPrefs.break_interval || 15);
  const [stressLevel, setStressLevel] = useState(defaultPrefs.stress_level || 'Medium');
  const [weekendWorking, setWeekendWorking] = useState(defaultPrefs.weekend_working || false);
  
  // Schedule
  const [timezone, setTimezone] = useState(defaultPrefs.timezone || 'UTC');
  const [wakeTime, setWakeTime] = useState(defaultPrefs.wake_time || '08:00');
  const [sleepTime, setSleepTime] = useState(defaultPrefs.sleep_time || '23:00');
  const [workSession, setWorkSession] = useState(defaultPrefs.preferred_work_session || 60);
  
  // Notifications
  const [reminderStyle, setReminderStyle] = useState(defaultPrefs.reminder_style || 'Gentle');
  const [notifications, setNotifications] = useState(defaultPrefs.notification_preferences ?? true);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      await updateSettings({ 
        name, 
        bio,
        preferences: {
          ai_personality: aiPersonality,
          goal,
          learning_goal: learningGoal,
          daily_focus_limit: parseInt(focusLimit),
          break_interval: parseInt(breakInterval),
          stress_level: stressLevel,
          weekend_working: weekendWorking,
          timezone,
          wake_time: wakeTime,
          sleep_time: sleepTime,
          preferred_work_session: parseInt(workSession),
          reminder_style: reminderStyle,
          notification_preferences: notifications
        }
      });
      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setMessage('Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { name: 'Profile', icon: User },
    { name: 'AI Preferences', icon: BrainCircuit },
    { name: 'Productivity', icon: Activity },
    { name: 'Work Schedule', icon: Clock },
    { name: 'Goals', icon: Target },
    { name: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full slide-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="heading-lg">Smart Settings</h1>
          <p className="text-textSecondary mt-2">Personalize your AI productivity ecosystem.</p>
        </div>
        <div className="flex items-center gap-4">
          {message && <span className={`text-sm ${message.includes('success') ? 'text-success' : 'text-danger'}`}>{message}</span>}
          <button onClick={handleSave} disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${
                  activeTab === tab.name ? 'bg-primary/10 text-primary' : 'text-textSecondary hover:bg-gray-50 hover:text-textPrimary'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            )
          })}
          <div className="pt-8 border-t border-border mt-8">
            <button onClick={logout} className="text-danger font-medium hover:underline flex items-center gap-2 px-4 py-2">
              Sign Out
            </button>
          </div>
        </div>

        <div className="md:col-span-3 space-y-8">
          {activeTab === 'Profile' && (
            <div className="glass-panel p-6 animate-fade-in">
              <h3 className="heading-md mb-6">Profile Details</h3>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-primary/20 rounded-full overflow-hidden flex items-center justify-center text-primary text-2xl font-bold">
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{user?.name}</h3>
                  <p className="text-textSecondary">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-textSecondary">Full Name</label>
                  <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-textSecondary">Email Address</label>
                  <input type="email" className="input-field opacity-50" defaultValue={user?.email} readOnly disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-textSecondary">Bio</label>
                  <textarea className="input-field h-24 resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a bit about yourself..." />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AI Preferences' && (
            <div className="glass-panel p-6 animate-fade-in border-l-4 border-l-purple-500">
              <h3 className="heading-md mb-2 flex items-center gap-2"><BrainCircuit className="text-purple-500" /> AI Coach Persona</h3>
              <p className="text-sm text-textSecondary mb-6">Control how the AI speaks to you in chats and daily briefings.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-textSecondary">AI Personality Type</label>
                  <select className="input-field" value={aiPersonality} onChange={(e) => setAiPersonality(e.target.value)}>
                    <option value="Professional Coach">Professional Coach (Direct & Objective)</option>
                    <option value="Gentle Supporter">Gentle Supporter (Empathetic & Kind)</option>
                    <option value="Aggressive Drill Sergeant">Drill Sergeant (Tough Love & Strict)</option>
                    <option value="Pirate">Pirate (Fun & Thematic)</option>
                    <option value="Philosopher">Philosopher (Deep & Thoughtful)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Goals' && (
            <div className="glass-panel p-6 animate-fade-in border-l-4 border-l-green-500">
              <h3 className="heading-md mb-2 flex items-center gap-2"><Target className="text-green-500" /> Primary Goals</h3>
              <p className="text-sm text-textSecondary mb-6">Your goals influence AI planning and recommendations.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-textSecondary">Overarching Productivity Goal</label>
                  <input type="text" className="input-field" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Launch my startup by Q4" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-textSecondary">Current Learning Goal</label>
                  <input type="text" className="input-field" value={learningGoal} onChange={(e) => setLearningGoal(e.target.value)} placeholder="e.g. Master React and Node.js" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Productivity' && (
            <div className="glass-panel p-6 animate-fade-in border-l-4 border-l-blue-500">
              <h3 className="heading-md mb-2 flex items-center gap-2"><Activity className="text-blue-500" /> Productivity Thresholds</h3>
              <p className="text-sm text-textSecondary mb-6">Set your limits to help the AI detect burnout risk.</p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-textSecondary">Daily Focus Limit (Hours)</label>
                    <input type="number" min="1" max="16" className="input-field" value={focusLimit} onChange={(e) => setFocusLimit(e.target.value)} />
                    <p className="text-xs text-textSecondary mt-1">If tasks exceed this, overload risk increases.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-textSecondary">Break Interval (Minutes)</label>
                    <input type="number" min="5" max="60" step="5" className="input-field" value={breakInterval} onChange={(e) => setBreakInterval(e.target.value)} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-textSecondary">Current Stress Level</label>
                    <select className="input-field" value={stressLevel} onChange={(e) => setStressLevel(e.target.value)}>
                      <option value="Low">Low (Ready for anything)</option>
                      <option value="Medium">Medium (Normal)</option>
                      <option value="High">High (Need a lighter load)</option>
                    </select>
                  </div>
                  <div className="flex items-center h-full pt-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded text-primary focus:ring-primary" checked={weekendWorking} onChange={(e) => setWeekendWorking(e.target.checked)} />
                      <span className="text-sm font-medium text-textSecondary">Enable Weekend Working</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Work Schedule' && (
            <div className="glass-panel p-6 animate-fade-in border-l-4 border-l-orange-500">
              <h3 className="heading-md mb-6 flex items-center gap-2"><Clock className="text-orange-500" /> Work & Sleep Schedule</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-textSecondary">Timezone</label>
                  <select className="input-field" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-textSecondary">Wake Time</label>
                    <input type="time" className="input-field" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-textSecondary">Sleep Time</label>
                    <input type="time" className="input-field" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-textSecondary">Preferred Work Session Block (Minutes)</label>
                  <select className="input-field" value={workSession} onChange={(e) => setWorkSession(e.target.value)}>
                    <option value="25">25 mins (Pomodoro)</option>
                    <option value="60">60 mins</option>
                    <option value="90">90 mins (Deep Work)</option>
                    <option value="120">120 mins</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="glass-panel p-6 animate-fade-in">
              <h3 className="heading-md mb-6 flex items-center gap-2"><Bell className="text-primary" /> Notification Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="flex items-center justify-between p-4 border border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="font-medium text-textPrimary">Push Notifications</h4>
                      <p className="text-sm text-textSecondary">Receive alerts for deadlines and habits.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-primary' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications ? 'left-7' : 'left-1'}`} />
                    </div>
                    {/* Hidden actual input */}
                    <input type="checkbox" className="hidden" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-textSecondary">AI Reminder Style</label>
                  <select className="input-field" value={reminderStyle} onChange={(e) => setReminderStyle(e.target.value)}>
                    <option value="Gentle">Gentle & Encouraging</option>
                    <option value="Strict">Strict & Direct</option>
                    <option value="Urgent">High Urgency</option>
                    <option value="Gamified">Gamified (Score based)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
