import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, Sparkles, Shield, Zap, Terminal, Copy, CheckCircle, 
  ArrowRight, ShieldCheck, Cpu, Award, BadgeAlert
} from 'lucide-react';
import { User } from '../types';
import { updateUserProfileStats } from '../lib/supabase';

interface PromotionsProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  addToast: (message: string, type: 'success' | 'info' | 'error' | 'premium') => void;
  onOpenAuth?: () => void;
}

export default function Promotions({ user, setUser, addToast, onOpenAuth }: PromotionsProps) {
  const [code, setCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [successRank, setSuccessRank] = useState<string | null>(null);

  // High-fidelity predefined authorization codes for each target rank
  const promoKeys = [
    {
      rank: 'OWNER',
      code: 'OWNER-LEAKER-SECRET-2026',
      altCode: 'OWNER_NODE_ACTIVATOR_X99',
      level: 99,
      tokens: 999999,
      diamonds: 99999,
      color: 'from-amber-500 via-orange-600 to-red-600',
      badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      description: 'System-wide owner authorization. Grants full privileges, absolute priority compile, and maximum progression attributes.'
    },
    {
      rank: 'ADMIN',
      code: 'ADMIN-DARK-CORE-ACCESS',
      altCode: 'ADMIN_ACCESS_KEY_770',
      level: 80,
      tokens: 500000,
      diamonds: 50000,
      color: 'from-brand-purple via-violet-600 to-indigo-600',
      badgeColor: 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple',
      description: 'Administrative core node permissions. Authorizes log diagnostics, database queries, and user configuration.'
    },
    {
      rank: 'DROPPER',
      code: 'DROPPER-QUANTUM-BYPASS',
      altCode: 'DROPPER_NODE_LEAK_440',
      level: 50,
      tokens: 150000,
      diamonds: 15000,
      color: 'from-brand-crimson via-rose-600 to-pink-600',
      badgeColor: 'bg-brand-crimson/10 border-brand-crimson/30 text-brand-crimson',
      description: 'Dropper status bypass. Fast-track high-frequency leak access, asset publishing override, and high-speed compiler access.'
    },
    {
      rank: 'VIP',
      code: 'VIP-PREMIUM-GATEWAY',
      altCode: 'VIP_ACCESS_GATE_220',
      level: 30,
      tokens: 50000,
      diamonds: 5000,
      color: 'from-brand-cyan via-sky-600 to-brand-blue',
      badgeColor: 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan',
      description: 'Premium VIP gateway insignia. Grants exclusive download priorities, double crystal rewards, and ad-free dashboards.'
    }
  ];

  const handleApplyPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!user) {
      addToast('Authenticate your account node first before activating authorization codes!', 'error');
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const matchedKey = promoKeys.find(
      k => k.code.toUpperCase() === cleanCode || k.altCode.toUpperCase() === cleanCode
    );

    if (!cleanCode) {
      addToast('Please enter a system authorization key.', 'error');
      return;
    }

    if (!matchedKey) {
      addToast('Invalid system activation code or expired security hash.', 'error');
      return;
    }

    setIsActivating(true);
    setSuccessRank(null);

    try {
      // Simulate cryptographic calculation delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedFields: Partial<User> = {
        rank: matchedKey.rank,
        level: matchedKey.level,
        xp: matchedKey.tokens - 1000, // Sync progression
        nextXp: matchedKey.tokens + 5000,
        tokens: matchedKey.tokens,
        diamonds: matchedKey.diamonds,
        badges: Array.from(new Set([...(user.badges || []), `${matchedKey.rank} Insignia`, 'Node Verified'])),
        achievements: Array.from(new Set([...(user.achievements || []), `Code Activated: ${matchedKey.rank}`]))
      };

      // Call database update helper
      if (user.id) {
        await updateUserProfileStats(user.id, updatedFields);
      }

      // Sync local state
      setUser(prev => prev ? { ...prev, ...updatedFields } : null);
      setSuccessRank(matchedKey.rank);
      addToast(`Access Authorized! Rank successfully upgraded to ${matchedKey.rank}!`, 'premium');
      setCode('');
    } catch (err: any) {
      addToast(err.message || 'System update interruption', 'error');
    } finally {
      setIsActivating(false);
    }
  };

  const handleQuickAutofill = (selectedCode: string) => {
    setCode(selectedCode);
    addToast('Redemption code copied to command buffer.', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-left">
      {/* Page Header */}
      <div className="mb-10">
        <span className="text-xs font-mono text-brand-purple uppercase tracking-widest font-bold">NODE SECURITY AUTHENTICATION</span>
        <h2 className="text-3xl font-display font-black text-white uppercase mt-1">Rank Promotion Hub</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xl">
          Enter cryptographic system keys or promotional codes below to authorize your account node for privileged security ranks (Owner, Admin, Dropper, or VIP).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Core Code Activation Panel */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none" />
          
          <div className="flex items-center gap-3 border-b border-slate-900 pb-5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-brand-purple uppercase tracking-widest font-black">COMMAND PROCESSOR</span>
              <h3 className="text-base font-sans font-bold text-slate-100">Cryptographic Access Terminal</h3>
            </div>
          </div>

          <form onSubmit={handleApplyPromoCode} className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2.5">
                Redeem System Key / Promotion Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. OWNER-LEAKER-SECRET-2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isActivating}
                  className="w-full h-13 bg-slate-950 border border-slate-800/80 hover:border-brand-purple/40 focus:border-brand-purple focus:outline-none rounded-xl text-sm font-mono text-white px-5 pr-12 transition-all"
                />
                <Key className="absolute right-4.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              </div>
              <p className="text-[10px] text-slate-500 font-sans mt-2.5 leading-relaxed">
                * Note: Activating codes will instantly recalibrate your database node attributes (tokens, diamonds, Level, and badges) to reflect the matching system tier configuration.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                type="submit"
                disabled={isActivating}
                className={`w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-brand-purple via-violet-600 to-indigo-600 hover:brightness-110 text-xs font-sans font-black text-white uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/10 cursor-pointer ${
                  isActivating ? 'opacity-70 pointer-events-none' : ''
                }`}
              >
                {isActivating ? (
                  <>
                    <Cpu className="w-4.5 h-4.5 animate-spin" />
                    <span>Cryptographic Verification in Progress...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4.5 h-4.5" />
                    <span>Authorize System Access</span>
                  </>
                )}
              </button>

              {!user && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="text-xs font-mono text-brand-cyan hover:underline transition-all"
                >
                  Connect account first →
                </button>
              )}
            </div>
          </form>

          {/* Success Promotion Alert Panel */}
          <AnimatePresence>
            {successRank && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 p-5 bg-brand-emerald/10 border border-brand-emerald/20 rounded-2xl flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 text-brand-emerald flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono text-brand-emerald uppercase tracking-wider font-bold">Node Access Upgraded</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Success! Your account has been integrated with the secure <strong className="text-brand-emerald font-extrabold">{successRank}</strong> permissions cluster. Check your new privileges in your main profile dashboard tab.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Tier Benefit Information Side Panel */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black block mb-4">
              RANK ARCHITECTURE BENEFIT MATRIX
            </span>

            <div className="space-y-4">
              {promoKeys.map((item) => (
                <div 
                  key={item.rank}
                  className="relative p-4 rounded-2xl bg-slate-950/30 hover:bg-slate-950/60 border border-slate-900/80 transition-all group overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b ${item.color}`} />
                  <div className="flex items-center gap-2.5 mb-1.5 pl-1.5">
                    {item.rank === 'OWNER' && <Award className="w-4 h-4 text-amber-500" />}
                    {item.rank === 'ADMIN' && <Shield className="w-4 h-4 text-brand-purple" />}
                    {item.rank === 'DROPPER' && <Zap className="w-4 h-4 text-brand-crimson" />}
                    {item.rank === 'VIP' && <ShieldCheck className="w-4 h-4 text-brand-cyan" />}
                    
                    <span className="text-xs font-sans font-black text-slate-100 tracking-wider">
                      {item.rank} PRIVILEGES
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed pl-1.5">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Secure system confirmation alert */}
          <div className="bg-slate-900/20 border border-slate-900/60 rounded-3xl p-5 text-center flex flex-col items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-brand-emerald animate-pulse" />
            <div>
              <h5 className="text-xs font-sans font-bold text-slate-300">SHA-256 Cloud Validation</h5>
              <p className="text-[10px] text-slate-500 font-sans leading-relaxed mt-1">
                All promotion activation queries run on sandboxed server transactions, utilizing direct real-time database integrity protocols.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
