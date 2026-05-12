import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, Mail, KeyRound, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employee.service';
import { Button } from '../../components/ui/Button';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await employeeService.forgotPassword(email);
      setSuccess('OTP has been sent to your email');
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { tempToken } = await employeeService.verifyOtp(email, otp);
      await employeeService.resetPassword(tempToken, newPassword);
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. Check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--color-bg-card)] rounded-[2rem] shadow-2xl p-8 border border-[var(--color-border-primary)] animate-fade-in">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/30">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black text-[var(--color-text-primary)] font-heading tracking-tight">Koshpal</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading mb-2">
            {step === 'email' ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            {step === 'email' 
              ? 'Enter your work email to receive a password reset OTP.' 
              : `We've sent a 6-digit code to your email.`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-2xl text-sm font-bold border border-[var(--color-error)]/20 animate-shake">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-[var(--color-success-bg)] text-[var(--color-success-dark)] rounded-2xl text-sm font-bold border border-[var(--color-success-light)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--color-text-primary)] ml-1">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium"
                  required
                />
              </div>
            </div>

            <Button variant="primary" size="lg" className="w-full" loading={loading} type="submit">
              Send OTP
            </Button>

            <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--color-text-primary)] ml-1">6-Digit OTP</label>
              <div className="relative group">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-mono text-center tracking-[0.5em] text-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text-primary)] ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text-primary)] ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button variant="primary" size="lg" className="w-full" loading={loading} type="submit">
              Reset Password
            </Button>

            <button type="button" onClick={() => setStep('email')} className="w-full text-sm font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
              Try a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
