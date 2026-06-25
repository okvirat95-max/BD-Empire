import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, Sparkles, LogIn, UserPlus, ShieldAlert, ArrowRight } from 'lucide-react';
import { supabase, addSecurityLog } from '../lib/supabase';
import { User } from '../types';
import { checkRateLimit } from '../lib/rateLimit';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  addToast: (message: string, type: 'success' | 'info' | 'error' | 'premium') => void;
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
}

export default function AuthModal({ isOpen, onClose, addToast, setUser }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addToast('Please input valid credentials', 'error');
      return;
    }

    // Login Rate Limiting (Enterprise Hardening)
    const rateLimitCheck = await checkRateLimit('login', email.trim());
    if (!rateLimitCheck.allowed) {
      addToast(rateLimitCheck.message || 'Login attempt rate limited.', 'error');
      return;
    }

    setLoading(true);
    try {
      let authEmail = email.trim();
      let authPassword = password.trim();

      if (isSignUp) {
        if (!username.trim()) {
          addToast('Username is required for sign up', 'error');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              custom_username: username,
            }
          }
        });

        if (error) {
          await addSecurityLog('AUTH_SIGNUP_FAILED', authEmail, { username, error: error.message });
          throw error;
        }
        
        await addSecurityLog('AUTH_SIGNUP_SUCCESS', authEmail, { username });

        // Check if user requires confirmation
        if (data?.user && !data?.session) {
          addToast('Sign up successful! Please check your email inbox to confirm your account.', 'info');
        } else {
          addToast('Sign up successful! Welcome to DarkLeaker.', 'success');
        }
        onClose();
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });

        if (error) {
          await addSecurityLog('AUTH_SIGNIN_FAILED', authEmail, { error: error.message });
          throw error;
        }

        if (data?.user) {
          await addSecurityLog('AUTH_SIGNIN_SUCCESS', authEmail, { userId: data.user.id });
          addToast('Successfully authenticated with profile node!', 'success');
          onClose();
        }
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'Authentication error occurred';
      if (errMsg.toLowerCase().includes('email not confirmed')) {
        errMsg = 'Email not confirmed! Please check your email inbox (and spam/junk folders) for the confirmation link to activate your profile.';
      }
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'discord') => {
    try {
      addToast(`Initializing secure ${provider} authorization...`, 'info');
      await addSecurityLog('AUTH_OAUTH_INITIATED', email || 'anonymous_oauth', { provider });
      
      // Inside an iframe, standard redirections can be blocked by browsers.
      // We set skipBrowserRedirect to true to retrieve the authorization URL,
      // and open it directly in a new window/tab where third-party logins are allowed.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true
        }
      });
      
      if (error) throw error;

      if (data?.url) {
        addToast(`Opening Discord gateway in a new window. Please authorize there!`, 'success');
        const oauthWindow = window.open(data.url, '_blank');
        if (!oauthWindow) {
          addToast('Popup blocked! Redirecting you directly...', 'info');
          window.location.href = data.url;
        }
      } else {
        // Fallback standard redirect
        const { error: standardError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin
          }
        });
        if (standardError) throw standardError;
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || `Failed to initiate ${provider} auth`, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="auth-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 max-w-md w-full relative overflow-hidden shadow-2xl text-left"
        >
          {/* Cyber scan layer */}
          <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-purple/50 animate-[holo-scan_3s_infinite_linear]" />

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] font-mono text-brand-purple uppercase tracking-widest font-bold">SECURE GATEWAY</span>
              <h3 className="text-xl font-display font-extrabold text-white uppercase mt-1">
                {isSignUp ? 'REGISTER PROFILE' : 'AUTHENTICATE USER'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors font-mono text-xs"
            >
              [ESC] CLOSE
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-brand-purple focus:outline-none rounded-xl text-xs font-sans text-white transition-all"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Email or Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-brand-purple focus:outline-none rounded-xl text-xs font-sans text-white transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="Secure Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-brand-purple focus:outline-none rounded-xl text-xs font-sans text-white transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-brand-crimson via-brand-purple to-brand-blue text-white hover:brightness-110 active:scale-95 uppercase font-sans font-bold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-55"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-4.5 h-4.5" /> : <LogIn className="w-4.5 h-4.5" />}
                  {isSignUp ? 'Create Account' : 'Authenticate Profile'}
                </>
              )}
            </button>
          </form>

          {/* Spacer */}
          <div className="relative my-6 text-center">
            <hr className="border-slate-800" />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              OR CHOOSE PROVIDER
            </span>
          </div>

          {/* OAuth Buttons */}
          <div className="flex flex-col gap-2">
            {/* Discord OAuth */}
            <button
              onClick={() => handleOAuth('discord')}
              className="w-full h-11 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 hover:border-[#5865F2]/60 text-slate-200 rounded-xl flex items-center justify-center gap-2.5 transition-all font-sans font-bold text-xs"
            >
              <svg className="w-4.5 h-4.5 text-[#5865F2]" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53a105.73,105.73,0,0,0,32,16.15,86.12,86.12,0,0,0,6.81-11.06,68.61,68.61,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.65-2a75.58,75.58,0,0,0,71,0c.85.69,1.74,1.37,2.65,2a68.28,68.28,0,0,1-10.85,5.18,86.12,86.12,0,0,0,6.81,11.06,105.73,105.73,0,0,0,32-16.15C129.66,48.51,123.63,25.64,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
              </svg>
              Sign In with Discord
            </button>
          </div>

          <div className="mt-6 flex justify-between items-center text-[11px] text-slate-500 font-sans">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-brand-cyan hover:underline hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
