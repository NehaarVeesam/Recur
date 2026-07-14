import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, LockIcon, RepeatIcon, UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Enter both username and password');
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err?.message || 'Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-[#050505] text-slate-300 flex items-center justify-center px-4 py-10 relative overflow-hidden safe-area-x">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.22), transparent), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(139, 92, 246, 0.08), transparent)',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-500/20 items-center justify-center border border-indigo-500/40 mb-5">
            <RepeatIcon className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Recur</h1>
          <p className="text-slate-500 mt-3 text-sm sm:text-base">
            Sign in to your DSA practice journal
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl shadow-black/40"
        >
          <div>
            <label htmlFor="username" className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">
              Username
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 bg-[#010101] border border-white/10 rounded-lg pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                placeholder="Enter username"
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">
              Password
            </label>
            <div className="relative">
              <LockIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-[#010101] border border-white/10 rounded-lg pl-10 pr-11 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                placeholder="Enter password"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-500 hover:text-slate-300 rounded-md transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};
