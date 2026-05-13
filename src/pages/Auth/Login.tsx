import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-[var(--color-bg-secondary)]">
      <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-xl p-8 w-full max-w-md border border-[var(--color-border-primary)] animate-slide-up">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl">
            <img src="/logo.png" alt="logo" className="w-8 h-8" />
          </div>
          <span className="text-2xl font-bold text-[var(--color-text-primary)] font-heading">
            Koshpal
          </span>
        </div>

        {/* Welcome Text */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-[var(--color-text-primary)] font-heading">
            Welcome back
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Sign in to your employee portal to manage your coaching sessions.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 animate-shake">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-[var(--color-text-primary)]">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
          Don't have an account?{' '}
          <span className="font-semibold text-[var(--color-primary)]">Contact your HR</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
