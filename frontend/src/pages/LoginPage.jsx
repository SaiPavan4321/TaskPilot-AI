import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, googleLogin } = useAuth();
  
  // Default to signup if they came from "Get Started", otherwise login
  const [isLogin, setIsLogin] = useState(location.state?.isSignup === false ? true : false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If they came from landing page with a goal, we could optionally use it or just log them in
  // const initialGoal = location.state?.initialGoal || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      const backendError = err.response?.data?.detail;
      let errorMsg = isLogin ? 'Invalid email or password. Please try again.' : 'Failed to create account. Please try again.';
      
      if (typeof backendError === 'string') {
        errorMsg = backendError;
      } else if (Array.isArray(backendError)) {
        errorMsg = backendError.map(e => e.msg).join(', ');
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans overflow-hidden">
      
      {/* LEFT PANEL - Changes based on Login/Signup */}
      <div className="hidden md:flex w-1/2 bg-[#EAF2FF] flex-col justify-center items-center p-12 relative">
        <div className="max-w-md w-full text-center flex flex-col items-center">
          
          {isLogin ? (
            <>
              {/* Login Left Content */}
              <div className="w-32 h-24 bg-white rounded-xl shadow-sm border border-blue-100 flex flex-col p-4 mb-8 relative">
                <div className="w-16 h-2 bg-blue-200 rounded-full mb-3"></div>
                <div className="w-24 h-2 bg-blue-100 rounded-full mb-3"></div>
                <div className="w-8 h-4 bg-primary rounded-md mt-auto"></div>
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-blue-200 flex items-center justify-center">
                  <div className="w-3 h-3 text-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </div>
              </div>
              
              <h2 className="text-3xl font-extrabold text-textPrimary mb-4 tracking-tight">Welcome back.</h2>
              <p className="text-textSecondary leading-relaxed mb-12 px-6">
                Your tasks, priorities, and deadlines are exactly where you left them. Let's pick up where you stopped.
              </p>
              
              <div className="flex items-center justify-center gap-8 w-full">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-primary mb-1">94%</h3>
                  <p className="text-xs text-textSecondary uppercase tracking-wide font-medium">Deadline accuracy</p>
                </div>
                <div className="w-px h-10 bg-blue-200"></div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-primary mb-1">50K</h3>
                  <p className="text-xs text-textSecondary uppercase tracking-wide font-medium">Tasks daily</p>
                </div>
                <div className="w-px h-10 bg-blue-200"></div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-primary mb-1 flex items-center justify-center">4.9<span className="text-lg ml-0.5">★</span></h3>
                  <p className="text-xs text-textSecondary uppercase tracking-wide font-medium">Avg. rating</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Signup Left Content */}
              <div className="w-24 h-24 bg-blue-100/50 rounded-full flex items-center justify-center mb-8 relative">
                <div className="w-16 h-16 bg-blue-200/50 rounded-full absolute bottom-2 overflow-hidden flex flex-col items-center justify-end">
                   <div className="w-6 h-6 bg-blue-400/40 rounded-full mb-1"></div>
                   <div className="w-12 h-6 bg-blue-400/40 rounded-t-full"></div>
                </div>
                <div className="absolute right-0 bottom-4 text-primary">
                   <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>

              <h2 className="text-3xl font-extrabold text-textPrimary mb-4 tracking-tight">Start for free.</h2>
              <p className="text-textSecondary leading-relaxed mb-10 px-4">
                Join 50,000+ productive people who ship more, stress less, and never miss a deadline with TaskPilot AI.
              </p>

              <div className="space-y-4 text-left w-full max-w-[250px]">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-sm font-medium text-textSecondary">No credit card required</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-sm font-medium text-textSecondary">Free plan forever</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-sm font-medium text-textSecondary">Setup in under 2 minutes</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-[400px]">
          
          <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold">T</div>
            <span className="font-bold text-sm">TaskPilot AI</span>
          </div>

          <h1 className="text-2xl font-bold text-textPrimary mb-1">
            {isLogin ? 'Log in to your account' : 'Create your account'}
          </h1>
          <p className="text-sm text-textSecondary mb-8">
            {isLogin ? 'Enter your credentials to continue' : 'Start your productivity journey today'}
          </p>

          {error && (
            <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm font-medium mb-6">
              {error}
            </div>
          )}

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setError('');
                setLoading(true);
                try {
                  await googleLogin(credentialResponse.credential);
                  navigate('/dashboard');
                } catch {
                  setError('Google authentication failed.');
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => {
                setError('Google authentication was unsuccessful or aborted.');
              }}
              useOneTap
              shape="rectangular"
              theme="outline"
              size="large"
              text={isLogin ? "signin_with" : "signup_with"}
              width="350"
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-textSecondary">or</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-textPrimary mb-1.5">Full name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-textPrimary placeholder:text-textSecondary/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-textPrimary mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-textPrimary placeholder:text-textSecondary/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-textPrimary">Password</label>
              </div>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "••••••••" : "Min. 8 characters"}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-textPrimary placeholder:text-textSecondary/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            
            {isLogin && (
              <div className="flex justify-end mt-1 mb-2">
                <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</a>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all shadow-sm ${!isLogin ? 'mt-6' : 'mt-2'}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
              ) : (
                isLogin ? 'Log In' : 'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-textSecondary">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-primary hover:underline">
                {isLogin ? "Sign up free" : "Log in"}
              </button>
            </p>
          </div>

          {!isLogin && (
            <div className="mt-8 text-center px-4">
              <p className="text-[10px] text-textSecondary leading-relaxed">
                By creating an account you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
