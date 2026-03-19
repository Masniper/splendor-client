import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AuthScreenProps {
  onLogin: (token: string, username: string) => void;
  onPlayGuest: (guestName: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const API_BASE_URL = 'http://localhost:5001/api';

export function AuthScreen({ onLogin, onPlayGuest, theme, onThemeToggle }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'guest') {
        // Guest Auth
        const response = await fetch(`${API_BASE_URL}/auth/guest`, {
          method: 'POST',
        });
        const data = await response.json();
        
        if (response.ok && data.success) {
          onLogin(data.token, `Guest_${data.user.id.substring(0, 4)}`); // Using onLogin to pass token even for guest
        } else {
          setError(data.message || 'Failed to create guest session');
        }
      } 
      else if (mode === 'login') {
        // Login Auth
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (response.ok && data.token) {
          onLogin(data.token, data.user?.username || email.split('@')[0]);
        } else {
          setError(data.message || 'Invalid credentials');
        }
      } 
      else if (mode === 'register') {
        // Register Auth
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username }),
        });
        const data = await response.json();

        if (response.ok) {
          // After successful registration, switch to login or auto-login
          // Assuming register doesn't return a token based on swagger, we switch to login
          setMode('login');
          setError('Registration successful. Please login.');
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 bg-cover bg-center ${isDark ? 'text-stone-100' : 'text-gray-800'}`}
         style={{ backgroundImage: `linear-gradient(${isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)"}, ${isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)"}), url('/images/startup-bg.jpg')` }}
    >
      <div className="absolute top-4 right-4">
        <button onClick={onThemeToggle} className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-stone-800 text-yellow-400' : 'bg-stone-200 text-indigo-600'}`}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-yellow-500/40 bg-gradient-to-br from-stone-900/90 via-stone-950/95 to-black/95 shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
            Splendor
          </h1>
          <p className="text-stone-400 text-sm">Authentication</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-900/50 border border-red-500/50 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-stone-800/50 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                placeholder="Enter your username"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-800/50 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-800/50 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  placeholder="Enter your password"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-lg shadow-yellow-900/20 mt-6"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : mode === 'register' ? 'Register' : 'Play as Guest'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          {mode !== 'login' && (
            <button onClick={() => { setMode('login'); setError(null); }} className="text-stone-400 hover:text-yellow-400 transition-colors">
              Already have an account? Login
            </button>
          )}
          {mode !== 'register' && (
            <button onClick={() => { setMode('register'); setError(null); }} className="text-stone-400 hover:text-yellow-400 transition-colors">
              Need an account? Register
            </button>
          )}
          {mode !== 'guest' && (
            <button onClick={() => { setMode('guest'); setError(null); }} className="text-stone-500 hover:text-stone-300 transition-colors mt-2">
              Or play as a guest
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
