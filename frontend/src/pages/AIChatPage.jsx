import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

const AIChatPage = () => {
  const { user } = useAuth();
  const initialMessage = { role: 'ai', content: `Hello ${user?.name?.split(' ')[0] || ''}! I'm your TaskPilot AI coach. How can I help you improve your productivity today?` };
  
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/ai/chat/history');
        if (res.data && res.data.length > 0) {
          setMessages(res.data);
        }
      } catch (e) {
        console.error("Failed to load chat history", e);
      } finally {
        setInitialLoad(false);
      }
    };
    fetchHistory();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!initialLoad) {
      scrollToBottom();
    }
  }, [messages, loading, initialLoad]);

  const handleSend = async (e, customMessage) => {
    e?.preventDefault();
    const messageToSend = customMessage || input.trim();
    if (!messageToSend || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { 
        message: messageToSend
      });
      
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await api.post('/ai/chat/history/clear');
      setMessages([initialMessage]);
    } catch (e) {
      console.error("Failed to clear chat", e);
    }
  };

  const suggestedPrompts = [
    "What should I do first today?",
    "Can I finish everything today?",
    "Generate today's schedule.",
    "Which task is most urgent?",
    "Which task can wait?",
    "How productive am I?",
    "Motivate me."
  ];

  if (initialLoad) {
    return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="h-full max-w-4xl mx-auto w-full flex flex-col p-4 md:p-8 slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="heading-md">AI Productivity Coach</h1>
            <p className="text-sm text-textSecondary">Ask for advice, schedules, or prioritization help.</p>
          </div>
        </div>
        <button 
          onClick={handleClearChat}
          className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          title="Clear Chat"
        >
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>

      <div className="flex-1 glass-panel flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx} 
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-100 text-primary' : 'bg-primary text-white'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-gray-100 text-textPrimary rounded-tl-sm'}`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex gap-4 max-w-[85%]"
            >
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-gray-100 rounded-tl-sm flex items-center gap-2 h-[52px]">
                <div className="w-2 h-2 bg-textSecondary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-textSecondary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-textSecondary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-white">
          {messages.length === 1 && (
            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
              {suggestedPrompts.map(prompt => (
                <button 
                  key={prompt}
                  onClick={(e) => handleSend(e, prompt)}
                  className="px-4 py-2 bg-gray-50 border border-border rounded-full text-xs font-medium text-textSecondary hover:text-primary whitespace-nowrap transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={(e) => handleSend(e)} className="relative flex items-center">
            <input 
              type="text" 
              className="w-full bg-gray-50 border border-border rounded-xl pl-4 pr-14 py-4 text-textPrimary placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Ask TaskPilot AI anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
