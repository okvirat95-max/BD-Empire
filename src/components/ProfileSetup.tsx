import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, ShieldCheck, Sparkles, AlertCircle, RefreshCw, HelpCircle, Check, Compass } from 'lucide-react';
import { completeProfileSetup } from '../lib/supabase';
import { User as UserType } from '../types';

interface ProfileSetupProps {
  user: UserType;
  onComplete: (updatedUser: UserType) => void;
  addToast: (message: string, type: 'success' | 'info' | 'error' | 'premium') => void;
  onLogout: () => void;
}

const PRESET_AVATARS = [
  { emoji: '🧙‍♂️', name: 'Wizard', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { emoji: '🤖', name: 'Cybergolem', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { emoji: '🥷', name: 'Shinobi', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { emoji: '👑', name: 'Voxel King', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { emoji: '👾', name: 'Nether Drake', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { emoji: '🚀', name: 'Aether Pilot', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' }
];

export default function ProfileSetup({ user, onComplete, addToast, onLogout }: ProfileSetupProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧙‍♂️');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleValidateUsername = (value: string) => {
    setUsername(value);
    if (value.trim().length < 3) {
      setValidationError('Username must be at least 3 characters.');
    } else if (value.startsWith('pending_')) {
      setValidationError('Username cannot start with "pending_".');
    } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setValidationError('Only letters, numbers, and underscores are allowed.');
    } else {
      setValidationError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) {
      addToast(validationError, 'error');
      return;
    }
    if (!username.trim() || !displayName.trim()) {
      addToast('Username and Display Name are strictly required.', 'error');
      return;
    }

    setLoading(true);
    const finalAvatar = useCustomUrl ? customAvatarUrl.trim() : selectedAvatar;
    if (useCustomUrl && !customAvatarUrl.trim()) {
      addToast('Please provide a valid custom avatar URL.', 'error');
      setLoading(false);
      return;
    }

    try {
      const result = await completeProfileSetup(
        user.id || '',
        username.trim(),
        displayName.trim(),
        finalAvatar
      );

      if (result.success) {
        addToast('Profile activated successfully! Welcome to DarkLeaker.', 'success');
        // Trigger complete callback
        onComplete({
          ...user,
          username: username.trim(),
          displayName: displayName.trim(),
          avatarUrl: finalAvatar,
          isActive: true
        });
      } else {
        addToast(result.error || 'Failed to activate profile.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error configuring account activation', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Visual cyber backgrounds */}
      <div className="absolute inset-0 cyber-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-crimson/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl z-10"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-crimson via-brand-purple to-brand-blue" />
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-purple/10 border border-brand-purple/30 text-brand-purple mb-4">
            <Compass className="w-6 h-6 animate-[spin_20s_infinite_linear]" />
          </div>
          <span className="text-[10px] font-mono text-brand-purple uppercase tracking-widest font-black block">MANDATORY INITIALIZATION</span>
          <h2 className="text-2xl font-display font-extrabold text-white mt-1 uppercase">Configure Your Profile</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Welcome to the DarkLeaker network. Before your node can be activated and granted access to secure files, you must configure a unique identity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          {/* USERNAME */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Choose Username</label>
              <span className="text-[9px] font-mono text-slate-500">Must be unique, alphanumeric</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => handleValidateUsername(e.target.value)}
                placeholder="e.g. cyber_ranger"
                className={`w-full h-11 px-4 bg-slate-950/80 border rounded-xl text-xs font-sans text-white focus:outline-none transition-all ${
                  validationError 
                    ? 'border-red-500/65 focus:border-red-500' 
                    : username.length >= 3 
                      ? 'border-emerald-500/65 focus:border-emerald-500' 
                      : 'border-slate-850 focus:border-brand-purple'
                }`}
                required
                disabled={loading}
              />
            </div>
            {validationError && (
              <div className="flex items-center gap-1.5 text-[10px] text-red-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* DISPLAY NAME */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Cyber Ranger"
              className="w-full h-11 px-4 bg-slate-950/80 border border-slate-850 focus:border-brand-purple rounded-xl text-xs font-sans text-white focus:outline-none transition-all"
              required
              disabled={loading}
            />
          </div>

          {/* AVATAR CONFIG */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Select Identity Avatar</label>
            
            {/* Toggle custom vs presets */}
            <div className="flex gap-2 p-1 bg-slate-950/80 border border-slate-900 rounded-xl">
              <button
                type="button"
                onClick={() => setUseCustomUrl(false)}
                className={`flex-1 h-8 text-[10px] font-sans font-bold uppercase rounded-lg transition-all ${
                  !useCustomUrl 
                    ? 'bg-slate-900 text-brand-purple border border-brand-purple/20 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Choose Preset Emoji
              </button>
              <button
                type="button"
                onClick={() => setUseCustomUrl(true)}
                className={`flex-1 h-8 text-[10px] font-sans font-bold uppercase rounded-lg transition-all ${
                  useCustomUrl 
                    ? 'bg-slate-900 text-brand-purple border border-brand-purple/20 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom URL Address
              </button>
            </div>

            {!useCustomUrl ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = selectedAvatar === preset.emoji;
                  return (
                    <button
                      key={preset.emoji}
                      type="button"
                      onClick={() => setSelectedAvatar(preset.emoji)}
                      className={`h-14 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all relative ${
                        isSelected 
                          ? 'bg-brand-purple/10 border-brand-purple scale-105 shadow-md shadow-brand-purple/15' 
                          : 'bg-slate-950/40 border-slate-850 hover:border-slate-700 hover:bg-slate-950/80'
                      }`}
                    >
                      <span className="text-xl">{preset.emoji}</span>
                      <span className="text-[7.5px] font-sans font-medium text-slate-400 uppercase tracking-tight">{preset.name}</span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-brand-purple text-white w-4 h-4 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 font-black" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <input
                  type="url"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full h-11 px-4 bg-slate-950/80 border border-slate-850 focus:border-brand-purple rounded-xl text-xs font-sans text-white focus:outline-none transition-all"
                  disabled={loading}
                />
                <span className="text-[8px] text-slate-500 font-mono leading-normal">Provide a secure URL starting with http:// or https://.</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 h-12 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white uppercase font-sans font-bold text-xs tracking-wider rounded-xl transition-all"
              disabled={loading}
            >
              Sign Out
            </button>
            <button
              type="submit"
              disabled={loading || !!validationError}
              className="flex-2 h-12 bg-gradient-to-r from-brand-crimson to-brand-purple text-white hover:brightness-110 active:scale-95 uppercase font-sans font-bold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>Activate Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
