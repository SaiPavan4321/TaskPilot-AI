import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Calendar, LineChart, Bell, MessageSquare, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-8 rounded-2xl bg-white border border-border shadow-sm hover:shadow-soft transition-all"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-textSecondary leading-relaxed">{description}</p>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">T</div>
          <span className="text-xl font-bold tracking-tight">TaskPilot<span className="text-primary">AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-textSecondary">
          <a href="#features" className="hover:text-textPrimary transition-colors">Features</a>
          <a href="#testimonials" className="hover:text-textPrimary transition-colors">Testimonials</a>
          <Link to="/login" state={{ isSignup: false }} className="hover:text-textPrimary transition-colors">Sign In</Link>
          <button onClick={() => navigate('/login', { state: { isSignup: true } })} className="btn-primary">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-24 pb-32 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8">
            <SparklesIcon className="w-4 h-4" />
            The Future of Productivity is Here
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-textPrimary mb-8 leading-[1.1]">
            Never Miss <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Deadlines</span> Again.
          </h1>
          <p className="text-xl text-textSecondary mb-12 max-w-2xl mx-auto leading-relaxed">
            AI that plans, prioritizes, and helps you complete tasks before deadlines arrive. Stop managing your tasks and start finishing them.
          </p>
          
          <div className="h-20 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/login', { state: { isSignup: true } })} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 text-lg px-8 py-4">
              Get Started for Free <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-32 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-sm font-bold text-primary tracking-widest uppercase mb-4">Features</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-textPrimary mb-6">Everything you need to stay on track</h2>
            <p className="text-lg text-textSecondary">Built for makers, teams, and anyone who can't afford to miss a deadline.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Brain} 
              title="AI Prioritization" 
              description="Your AI companion analyzes deadlines, context, and your work patterns to surface what matters most."
            />
            <FeatureCard 
              icon={Calendar} 
              title="Smart Scheduling" 
              description="Automatically blocks time in your calendar based on task complexity and your energy patterns."
            />
            <FeatureCard 
              icon={LineChart} 
              title="Productivity Insights" 
              description="Track your performance over time and identify patterns that help you do your best work."
            />
            <FeatureCard 
              icon={Bell} 
              title="Smart Reminders" 
              description="Proactive nudges before deadlines hit, not after. Never scramble at the last minute again."
            />
            <FeatureCard 
              icon={MessageSquare} 
              title="AI Chat Assistant" 
              description="Ask anything about your workload, get instant planning advice, or just think out loud with your AI."
            />
            <FeatureCard 
              icon={Users} 
              title="Team Ready" 
              description="Share task boards, assign responsibilities, and keep every stakeholder aligned effortlessly."
            />
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="bg-background py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-sm font-bold text-primary tracking-widest uppercase mb-4">Results</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-textPrimary">Numbers that speak for themselves</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            <div className="px-4">
              <h3 className="text-5xl md:text-6xl font-extrabold text-primary mb-4">94%</h3>
              <p className="text-textSecondary">Deadline hit rate for active users</p>
            </div>
            <div className="px-4">
              <h3 className="text-5xl md:text-6xl font-extrabold text-primary mb-4">2.4<span className="text-4xl md:text-5xl">×</span></h3>
              <p className="text-textSecondary">More tasks completed per week</p>
            </div>
            <div className="px-4">
              <h3 className="text-5xl md:text-6xl font-extrabold text-primary mb-4">50K+</h3>
              <p className="text-textSecondary">Tasks managed daily</p>
            </div>
            <div className="px-4">
              <h3 className="text-5xl md:text-6xl font-extrabold text-primary mb-4">4.9<span className="text-4xl md:text-5xl">★</span></h3>
              <p className="text-textSecondary">Average user rating</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-background py-12 border-t border-border">
        <div className="container mx-auto px-6 text-center text-textSecondary">
          <p>© {new Date().getFullYear()} TaskPilot AI. Built for the Vibe2Ship Hackathon.</p>
        </div>
      </footer>
    </div>
  );
};

const SparklesIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

export default LandingPage;
