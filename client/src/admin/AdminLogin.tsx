import React, { useState } from 'react';
import { Shield, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, username: string) => void;
  onBackToMenu: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToMenu }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('sree_mk_admin_token', data.token);
      localStorage.setItem('sree_mk_admin_user', data.user.username);
      onLoginSuccess(data.token, data.user.username);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-950 flex flex-col justify-center items-center px-4 py-12">
      
      {/* Back to menu button */}
      <button
        onClick={onBackToMenu}
        className="absolute top-6 left-6 flex items-center space-x-2 text-cream-300 hover:text-gold-400 text-sm font-semibold transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Menu</span>
      </button>

      <div className="max-w-md w-full bg-forest-900 border border-gold-600/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-forest-800 border-2 border-gold-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg text-gold-400">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gold-400">
            Staff & Admin Login
          </h2>
          <p className="text-xs text-cream-200 mt-1">
            Sree MK Food Court Management Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cream-200 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gold-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-forest-950 border border-forest-700 focus:border-gold-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-cream-50 focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-200 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gold-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-forest-950 border border-forest-700 focus:border-gold-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-cream-50 focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-forest-950 font-bold text-sm shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-forest-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>

      </div>

    </div>
  );
};
