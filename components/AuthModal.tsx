import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Mail, Lock, User as UserIcon, ArrowRight, LogIn, Loader2 } from 'lucide-react';
import { User } from '../types';
import { criarConta, fazerLogin } from '../auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void; // Prop kept for compatibility but main logic is via auth observer
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await fazerLogin(formData.email, formData.password);
        // Success: onClose and state updates handled by onAuthStateChanged in App.tsx
      } else {
        await criarConta(formData.email, formData.password, formData.name);
      }
      // Clear sensitive data on success
      setFormData({ name: '', email: '', password: '' });
    } catch (err: any) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isLogin ? 'Welcome Back' : 'Create Account'}
      footer={
        <div className="w-full flex flex-col gap-3">
          <Button 
            onClick={handleSubmit} 
            className="w-full justify-center" 
            disabled={isLoading}
            icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? <LogIn className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
          <div className="text-center">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-xs text-gray-500 hover:text-nether-500 underline decoration-dotted underline-offset-4 transition-colors"
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        {!isLogin && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-nether-500 text-sm text-gray-900 dark:text-white transition-all disabled:opacity-50"
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-nether-500 text-sm text-gray-900 dark:text-white transition-all disabled:opacity-50"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-nether-500 text-sm text-gray-900 dark:text-white transition-all disabled:opacity-50"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};