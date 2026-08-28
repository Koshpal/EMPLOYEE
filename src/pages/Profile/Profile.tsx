import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../../components/common/Layout';
import { employeeService } from '../../services/employee.service';
import type { UserProfile } from '../../types/employee.types';
import { Button } from '../../components/ui/Button';
import { User, ShieldCheck, Mail, Phone, Camera, Loader2, CheckCircle, Lock, X, Eye, EyeOff } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SUPPORT_EMAIL = 'koshpal@koshpal.com';

const Profile: React.FC = () => {
  const { toggleTheme, theme } = useTheme();
  const { logout } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await employeeService.getProfile();
      setProfile(data);
      setFormData({
        name: data.name,
        phone: data.phone || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (pwForm.next !== pwForm.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    setPwSaving(true);
    try {
      await employeeService.changePassword(pwForm.current, pwForm.next);
      setShowPasswordModal(false);
      setPwForm({ current: '', next: '', confirm: '' });
      // The server revokes every session on password change — sign out cleanly
      // instead of leaving the user on a page whose cookie is now dead.
      toast.success('Password changed. Please sign in again.');
      setTimeout(() => logout(), 1200);
    } catch {
      setPwError('Current password is incorrect or request failed.');
    } finally {
      setPwSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ text: 'Only JPG, PNG or WebP images are allowed.', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'Image must be under 5 MB.', type: 'error' });
      return;
    }
    setPhotoUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const updated = await employeeService.updateProfile(fd);
      setProfile((prev) => prev ? { ...prev, profilePicture: updated.profilePicture || prev.profilePicture } : prev);
      setMessage({ text: 'Profile photo updated!', type: 'success' });
    } catch {
      setMessage({ text: 'Failed to upload photo.', type: 'error' });
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^\d\s+\-()]/g, '');
    setFormData({ ...formData, phone: sanitized });
    if (sanitized && !/^[+\d\s\-()]{7,20}$/.test(sanitized)) {
      setPhoneError('Enter a valid phone number (7–20 digits).');
    } else {
      setPhoneError('');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneError) {
      setMessage({ text: 'Please fix the phone number before saving.', type: 'error' });
      return;
    }
    if (formData.phone && !/^[+\d\s\-()]{7,20}$/.test(formData.phone.trim())) {
      setPhoneError('Enter a valid phone number (7–20 digits).');
      setMessage({ text: 'Please fix the phone number before saving.', type: 'error' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('phone', formData.phone);
      await employeeService.updateProfile(fd);
      setProfile((prev) => prev ? { ...prev, name: formData.name, phone: formData.phone } : prev);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="My Profile">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Profile">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Profile Header Card */}
        <div className="bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-primary)] overflow-hidden shadow-sm">
          <div className="h-32 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"></div>
          <div className="px-8 pb-8">
            <div className="relative -mt-12 flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative group">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <div className="w-32 h-32 rounded-3xl bg-[var(--color-bg-card)] p-1 shadow-xl">
                  <div className="w-full h-full rounded-2xl bg-[var(--color-bg-tertiary)] overflow-hidden flex items-center justify-center">
                    {photoUploading ? (
                      <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
                    ) : profile?.profilePicture ? (
                      <img src={profile.profilePicture} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-[var(--color-primary)]" />
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={photoUploading}
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute bottom-2 right-2 p-2 bg-[var(--color-primary)] text-white rounded-xl shadow-lg hover:scale-110 transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 mb-2">
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">
                  {profile?.name}
                </h1>
                <p className="text-[var(--color-text-secondary)] font-medium">Employee @ Koshpal</p>
              </div>
              <div className="mb-2">
                <Badge variant="success" className="px-4 py-1.5 text-sm">Active Account</Badge>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-slide-up ${
            message.type === 'success' 
              ? 'bg-[var(--color-success-bg)] text-[var(--color-success-dark)] border-[var(--color-success-light)]' 
              : 'bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            <span className="font-bold">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--color-bg-card)] p-8 rounded-3xl border border-[var(--color-border-primary)] shadow-sm">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--color-border-primary)]">
                <User className="w-6 h-6 text-[var(--color-primary)]" />
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-heading">Personal Information</h2>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="+91 00000 00000"
                        maxLength={20}
                        className={`w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--color-bg-tertiary)] border outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all ${phoneError ? 'border-[var(--color-error)]' : 'border-[var(--color-border-primary)]'}`}
                      />
                    </div>
                    {phoneError && (
                      <p className="mt-1 text-xs text-[var(--color-error)]">{phoneError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                    <input 
                      type="email" 
                      value={profile?.email ?? ''}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[var(--color-text-tertiary)] cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">Email address is managed by your organization and cannot be changed.</p>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button variant="primary" size="lg" loading={saving} type="submit" className="px-10">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>

            <div className="bg-[var(--color-bg-card)] p-8 rounded-3xl border border-[var(--color-border-primary)] shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--color-border-primary)]">
                <ShieldCheck className="w-6 h-6 text-[var(--color-primary)]" />
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-heading">Security & Privacy</h2>
              </div>
              <p className="text-[var(--color-text-secondary)] mb-6">Manage your account security and authentication preferences.</p>
              <Button variant="outline" size="md" onClick={() => setShowPasswordModal(true)}>Change Password</Button>
            </div>
          </div>

          {/* Right Column - Preferences */}
          <div className="space-y-6">
            <div className="bg-[var(--color-bg-card)] p-8 rounded-3xl border border-[var(--color-border-primary)] shadow-sm">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-heading mb-6">Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-bg-tertiary)]">
                  <div>
                    <p className="font-bold text-[var(--color-text-primary)]">Dark Mode</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Change portal appearance</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-12 h-6 rounded-full transition-all ${theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-grey-lightest)]'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-bg-tertiary)]">
                  <div>
                    <p className="font-bold text-[var(--color-text-primary)]">Session reminders</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      You'll get an email and a calendar invite for every session you book.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--color-success-dark)] whitespace-nowrap">On</span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-bg-card)] p-8 rounded-3xl border border-[var(--color-border-primary)] shadow-sm">
              <h3 className="font-bold text-[var(--color-text-primary)] mb-2">Need help?</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">Having trouble with your profile or account? Our support team is here to help.</p>
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Koshpal%20portal%20support`}>
                <Button variant="outline" size="sm" className="w-full">Contact Support</Button>
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-primary)] shadow-2xl w-full max-w-md p-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-heading">Change Password</h2>
              </div>
              <button onClick={() => { setShowPasswordModal(false); setPwError(null); setPwForm({ current: '', next: '', confirm: '' }); }} className="p-2 rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={pwForm.current}
                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                    required
                    className="w-full pl-4 pr-11 py-3 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNext ? 'text' : 'password'}
                    value={pwForm.next}
                    onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                    required
                    minLength={8}
                    className="w-full pl-4 pr-11 py-3 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  />
                  <button type="button" onClick={() => setShowNext(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
                    {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                  className="w-full pl-4 pr-4 py-3 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                />
              </div>
              {pwError && (
                <p className="text-sm text-[var(--color-error)] font-medium bg-[var(--color-error)]/10 px-4 py-2.5 rounded-xl">{pwError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" size="md" className="flex-1" onClick={() => { setShowPasswordModal(false); setPwError(null); }}>Cancel</Button>
                <Button type="submit" variant="primary" size="md" className="flex-1" loading={pwSaving}>Update Password</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Profile;
