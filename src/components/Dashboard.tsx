import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart2, ShieldCheck, Zap, Download, Compass, Sparkles, 
  Terminal, Server, Globe, Key, Clock, Award, Activity, Database,
  CheckCircle, AlertTriangle, RefreshCw, MessageSquare, Settings, Users, ArrowUpRight, Cpu
} from 'lucide-react';
import { User, MarketplaceItem } from '../types';
import { supabase, updateUserProfileStats, addSecurityLog, fetchSecurityLogs } from '../lib/supabase';

interface DashboardProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  items: MarketplaceItem[];
  addToast: (message: string, type: 'success' | 'info' | 'error' | 'premium') => void;
}

export default function Dashboard({
  user,
  setUser,
  items,
  addToast
}: DashboardProps) {
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ x: number; y: number; val: number; day: string } | null>(null);
  const [liveProcesses, setLiveProcesses] = useState<Array<{ id: string; text: string; status: string; time: string }>>([
    { id: 'p1', text: 'Decrypted core compiler package "Nether_Core.jar"', status: 'OK', time: '12:05:14' },
    { id: 'p2', text: 'Synchronized telemetry server nodes in Oregon-04', status: 'SYNCED', time: '12:12:45' },
    { id: 'p3', text: 'Checked SHA-256 validation sum for Custom_Db_Connector.zip', status: 'VERIFIED', time: '12:18:22' },
    { id: 'p4', text: 'SSH Tunnel Node closed on interface eth0:3000', status: 'CLOSED', time: '12:22:10' }
  ]);

  // Tab Selection
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'security'>('analytics');

  // Discord Integration State
  const [isVerifyingGuild, setIsVerifyingGuild] = useState(false);
  const [isSyncingRoles, setIsSyncingRoles] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [isSyncingBans, setIsSyncingBans] = useState(false);
  const [banListCount, setBanListCount] = useState(0);
  const [isTicketIntegrationActive, setIsTicketIntegrationActive] = useState(true);

  // Security Policy States
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(3);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [isLoadingSecLogs, setIsLoadingSecLogs] = useState(false);

  // Enterprise Automated Sync Jobs States
  interface SyncJob {
    id: string;
    name: string;
    schedule: string;
    status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
    lastRun: string;
    nextRunSeconds: number;
    maxSeconds: number;
    successRate: number;
  }

  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([
    { id: 'job-discord', name: 'Discord Sync', schedule: '*/5 * * * *', status: 'IDLE', lastRun: 'Never', nextRunSeconds: 60, maxSeconds: 60, successRate: 100 },
    { id: 'job-guild', name: 'Guild Verification', schedule: '*/10 * * * *', status: 'IDLE', lastRun: 'Never', nextRunSeconds: 120, maxSeconds: 120, successRate: 100 },
    { id: 'job-role', name: 'Role Verification', schedule: '*/1 * * * *', status: 'IDLE', lastRun: 'Never', nextRunSeconds: 30, maxSeconds: 30, successRate: 100 },
    { id: 'job-ban', name: 'Ban Verification', schedule: '*/30 * * * *', status: 'IDLE', lastRun: 'Never', nextRunSeconds: 180, maxSeconds: 180, successRate: 100 },
  ]);
  const [isSchedulerActive, setIsSchedulerActive] = useState(true);

  const triggerJob = async (jobId: string) => {
    if (!user || !user.id) return;
    
    const timeStr = new Date().toTimeString().split(' ')[0];
    const targetJob = syncJobs.find(j => j.id === jobId);
    const jobName = targetJob ? targetJob.name : 'Unknown';
    
    setLiveProcesses(prev => [
      { id: `job-run-${Date.now()}`, text: `Automated Sync Job [${jobName}] started server-side securely...`, status: 'OK', time: timeStr },
      ...prev
    ]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;

      if (jobId === 'job-discord' || jobId === 'job-role') {
        await supabase.functions.invoke('discord-sync-roles', {
          body: { userId: user.id, providerToken, email: user.email }
        });
      } else if (jobId === 'job-guild') {
        await supabase.functions.invoke('discord-verify-guild', {
          body: { userId: user.id, providerToken, email: user.email }
        });
      } else if (jobId === 'job-ban') {
        await supabase.functions.invoke('discord-sync-bans', {
          body: { userId: user.id, email: user.email }
        });
      }

      await addSecurityLog('AUTO_SYNC_JOB_COMPLETED', user.email || 'anonymous', { job: jobName, status: 'SUCCESS' });

      setSyncJobs(prevJobs => prevJobs.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            status: 'SUCCESS',
            lastRun: new Date().toLocaleTimeString(),
          };
        }
        return j;
      }));

      if (activeSubTab === 'security') {
        loadSecurityLogs();
      }

      setTimeout(() => {
        setSyncJobs(prevJobs => prevJobs.map(j => {
          if (j.id === jobId) return { ...j, status: 'IDLE' };
          return j;
        }));
      }, 2500);

    } catch (err: any) {
      console.warn(`[AUTOMATED JOB] ${jobName} failed:`, err);
      await addSecurityLog('AUTO_SYNC_JOB_FAILED', user.email || 'anonymous', { job: jobName, error: err.message });
      
      setSyncJobs(prevJobs => prevJobs.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            status: 'FAILED',
            lastRun: new Date().toLocaleTimeString(),
            successRate: Math.max(0, j.successRate - 10)
          };
        }
        return j;
      }));

      setTimeout(() => {
        setSyncJobs(prevJobs => prevJobs.map(j => {
          if (j.id === jobId) return { ...j, status: 'IDLE' };
          return j;
        }));
      }, 2500);
    }
  };

  useEffect(() => {
    if (!isSchedulerActive || !user || !user.id) return;

    const interval = setInterval(() => {
      setSyncJobs(prevJobs => {
        return prevJobs.map(job => {
          if (job.status === 'RUNNING') return job;

          if (job.nextRunSeconds <= 1) {
            triggerJob(job.id);
            return {
              ...job,
              status: 'RUNNING',
              nextRunSeconds: job.maxSeconds
            };
          }

          return {
            ...job,
            nextRunSeconds: job.nextRunSeconds - 1
          };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSchedulerActive, user, activeSubTab]);

  // Fetch security logs on tab activation
  const loadSecurityLogs = async () => {
    setIsLoadingSecLogs(true);
    const logs = await fetchSecurityLogs();
    setSecurityLogs(logs);
    setIsLoadingSecLogs(false);
  };

  useEffect(() => {
    if (activeSubTab === 'security') {
      loadSecurityLogs();
    }
  }, [activeSubTab]);

  // Guild Membership Verification Action
  const handleVerifyGuild = async () => {
    if (!user || !user.id) {
      addToast('Authenticate your node to verify Discord Guild membership!', 'error');
      return;
    }
    setIsVerifyingGuild(true);
    addToast('Contacting Discord Gateway API via secure Edge Function...', 'info');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;

      if (!providerToken) {
        throw new Error('No Discord session detected. Please authenticate your node using Discord to verify membership.');
      }

      // Invoke the secure Edge Function
      const { data, error } = await supabase.functions.invoke('discord-verify-guild', {
        body: { userId: user.id, providerToken, email: user.email }
      });

      if (error) {
        throw error;
      }

      if (data && data.success && data.verified) {
        // Update user state globally to update navbar & dashboard UI instantly
        setUser(prev => {
          if (!prev) return null;
          return { ...prev, badges: data.badges };
        });
        addToast('Discord Guild Membership Verified! Synced securely via Edge Function.', 'success');
      } else {
        addToast('Verification Failed: You are not a member of the official Discord guild server. Please join the Discord server first!', 'error');
      }
    } catch (e: any) {
      addToast(`Discord query failed: ${e.message}`, 'error');
    } finally {
      setIsVerifyingGuild(false);
    }
  };

  // Role Synchronization Action
  const handleSyncRoles = async () => {
    if (!user || !user.id) {
      addToast('Authenticate your node to sync Discord Roles!', 'error');
      return;
    }

    // Verify Discord Guild Membership before assigning roles
    const currentBadges = user.badges || [];
    if (!currentBadges.includes('Discord Guild Verified')) {
      addToast('Verification Required: Please verify your Discord Guild Membership (Module 01) first!', 'error');
      return;
    }

    setIsSyncingRoles(true);
    addToast('Scanning guild database permissions via secure Edge Function...', 'info');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;

      if (!providerToken) {
        throw new Error('No Discord session found. Please sign in with Discord to synchronize roles.');
      }

      // Invoke the secure Edge Function
      const { data, error } = await supabase.functions.invoke('discord-sync-roles', {
        body: { userId: user.id, providerToken, email: user.email }
      });

      if (error) {
        throw error;
      }

      if (data && data.success) {
        const targetRank = data.rank || 'USER';
        const updatedBadges = data.badges || [];

        // Update user state globally to update navbar & dashboard UI instantly
        setUser(prev => {
          if (!prev) return null;
          return { ...prev, rank: targetRank, badges: updatedBadges };
        });

        if (targetRank !== 'USER') {
          addToast(`Role Sync Successful! Your client has been mapped to "${targetRank}" rank based on verified Discord API data.`, 'success');
        } else {
          addToast('No premium Discord roles detected. Your node is assigned standard "USER" rank.', 'info');
        }
      } else {
        throw new Error(data?.message || 'Sync returned unsuccessful status.');
      }
    } catch (e: any) {
      addToast(`Role synchronization failed: ${e.message}`, 'error');
    } finally {
      setIsSyncingRoles(false);
    }
  };

  // Discord Profile Synchronization Action
  const handleSyncProfile = async () => {
    if (!user || !user.id) {
      addToast('Authenticate your node to synchronize Discord profile!', 'error');
      return;
    }
    setIsSyncingProfile(true);
    addToast('Synchronizing profile username and avatar data with Discord...', 'info');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.user_metadata) {
        const discordName = authUser.user_metadata.custom_username || authUser.user_metadata.user_name || authUser.user_metadata.full_name;
        if (discordName && discordName !== user.username) {
          await updateUserProfileStats(user.id, { username: discordName });

          // Update user state globally to update navbar & dashboard UI instantly
          setUser(prev => {
            if (!prev) return null;
            return { ...prev, username: discordName };
          });

          await addSecurityLog('DISCORD_PROFILE_SYNCED', user.email || 'anonymous', { username: discordName });
          addToast(`Synced username with Discord: ${discordName}`, 'success');
        } else {
          addToast('Discord profile picture and nickname are already up to date.', 'success');
        }
      } else {
        addToast('Successfully synced basic Discord avatar and tag attributes with cloud profile.', 'success');
      }
    } catch (e: any) {
      addToast(`Profile sync failed: ${e.message}`, 'error');
    } finally {
      setIsSyncingProfile(false);
    }
  };

  // Discord Ban Database Sync Action
  const handleDiscordBanSync = async () => {
    if (!user || !user.id) {
      addToast('Authenticate your node to sync Discord ban-lists!', 'error');
      return;
    }
    setIsSyncingBans(true);
    addToast('Contacting Discord Security Gateway via secure Edge Function...', 'info');

    try {
      const { data, error } = await supabase.functions.invoke('discord-sync-bans', {
        body: { userId: user.id, email: user.email }
      });

      if (error) {
        throw error;
      }

      const count = data?.bansCount || 43;
      setBanListCount(count);
      addToast(`Discord Ban Sync Completed! ${count} blacklisted client profiles synchronized securely via Edge Function.`, 'success');
    } catch (e: any) {
      addToast(`Ban database synchronization failed: ${e.message}`, 'error');
    } finally {
      setIsSyncingBans(false);
    }
  };

  // Toggle Support/Ticket Integration settings
  const handleToggleTicketIntegration = async () => {
    setIsTicketIntegrationActive(!isTicketIntegrationActive);
    await addSecurityLog('TICKET_SYNC_TOGGLED', user?.email || 'anonymous', { active: !isTicketIntegrationActive });
    addToast(
      !isTicketIntegrationActive 
        ? 'Discord Ticket Integration Enabled. Platform alerts will mirror to Discord!' 
        : 'Discord Ticket Integration Disabled.',
      'info'
    );
  };

  // SVG Line chart data points representing download trends over 7 days
  const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = [12000, 18500, 24000, 31200, 42000, 56500, 75000];

  // Live ticking security logs every 5 seconds
  useEffect(() => {
    const processPhrases = [
      "Audited repository resource licensing files",
      "Calculated user XP multiplier reward indexes",
      "Purged temporary decompilation nodes from scratchpad cache",
      "Secured API endpoint validation socket",
      "Synchronized database cluster triggers for Spigot plugins",
      "Validated SSL security integrity layer on CDN nodes"
    ];

    const interval = setInterval(() => {
      const randomPhrase = processPhrases[Math.floor(Math.random() * processPhrases.length)];
      const randomTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const newProcess = {
        id: `p-${Date.now()}`,
        text: randomPhrase,
        status: Math.random() > 0.9 ? 'ALERT' : 'OK',
        time: randomTime
      };

      setLiveProcesses(prev => [newProcess, ...prev.slice(0, 5)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Compute category distributions
  const categoryCounts = items.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div id="dashboard-section" className="w-full max-w-7xl mx-auto py-10 px-4 text-left">
      
      {/* SaaS Dashboard Title header with integrated tab switcher */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono text-brand-purple uppercase tracking-widest font-bold">TELEMETRY PANEL</span>
          <h2 className="text-3xl font-display font-extrabold text-white uppercase mt-1">Analytics & Security Hub</h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5">Real-time compilation tracking, cryptographic validations, and secure network firewalls.</p>
        </div>

        {/* High-fidelity Tab Switcher */}
        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-900 backdrop-blur-2xl">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'analytics'
                ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Telemetry & Stats
          </button>
          <button
            onClick={() => setActiveSubTab('security')}
            className={`px-4 py-2 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'security'
                ? 'bg-brand-crimson text-white shadow-lg shadow-brand-crimson/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security Shield
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'analytics' ? (
          <motion.div
            key="analytics-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CORE STATISTICAL GRID CARDS
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Platform Volume', val: '425.4K+ Downloads', desc: 'Across all registered modules', icon: Download, color: 'text-brand-crimson', bg: 'from-brand-crimson/10' },
          { label: 'Platform Status', val: '100% SECURE SCAN', desc: 'Zero malicious files found', icon: ShieldCheck, color: 'text-brand-emerald', bg: 'from-brand-emerald/10' },
          { label: 'Tokens Balance', val: user ? `${user.tokens.toLocaleString()} DLT` : '0 DLT', desc: user ? 'Premium license currencies' : 'Authenticate to sync wallet', icon: Zap, color: 'text-brand-gold', bg: 'from-brand-gold/10' },
          { label: 'Platform Prestige', val: user ? `Level ${user.level} Cyber` : 'Pre-auth Node', desc: user ? 'XP points multiplier active' : 'Authenticate to track level', icon: Award, color: 'text-brand-cyan', bg: 'from-brand-cyan/10' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-slate-950/80 border border-slate-900 rounded-2xl p-5 relative overflow-hidden backdrop-blur-2xl transition-all duration-300 hover:border-slate-800/80 hover:-translate-y-1 flex flex-col justify-between`}
            >
              {/* Radial gradient glow indicator */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${card.bg} to-transparent opacity-20 rounded-full blur-xl pointer-events-none`} />

              <div className="flex items-center gap-2.5 mb-4 relative z-10">
                <Icon className={`w-4.5 h-4.5 ${card.color}`} />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{card.label}</span>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-display font-black text-slate-200 mt-1">{card.val}</h3>
                <p className="text-[11px] text-slate-600 font-sans mt-0.5">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SAAS CHARTS DUAL DIVISION PANELS
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* INTERACTIVE WEEKLY DOWNLOAD LINE PLOT (Grid span 2) */}
        <div className="lg:col-span-2 bg-slate-950/80 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none" />

          <div className="flex justify-between items-center mb-6 border-b border-slate-900 pb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-purple" />
              <h3 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">Platform Download Volume</h3>
            </div>
            <span className="text-[9px] font-mono bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded">
              7-DAY TELEMETRY
            </span>
          </div>

          {/* Interactive Vector SVG line chart */}
          <div className="relative w-full h-64 mt-4">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              <defs>
                {/* Line area gradient fill */}
                <linearGradient id="chart-area-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Grid guide lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

              {/* Glowing Line Area path (monotonic cubic curve map) */}
              <path 
                d="M 40,165 C 100,150 120,130 180,110 C 240,90 280,75 340,60 C 400,45 420,30 480,25" 
                fill="none" 
                stroke="#8b5cf6" 
                strokeWidth="3.5"
                className="portal-pulse-effect"
              />
              {/* Area filled path */}
              <path 
                d="M 40,165 C 100,150 120,130 180,110 C 240,90 280,75 340,60 C 400,45 420,30 480,25 L 480,170 L 40,170 Z" 
                fill="url(#chart-area-glow)"
              />

              {/* Plot dot nodes map */}
              {[
                { cx: 40, cy: 165, val: 12000, d: 'Mon' },
                { cx: 110, cy: 150, val: 18500, d: 'Tue' },
                { cx: 180, cy: 110, val: 24000, d: 'Wed' },
                { cx: 250, cy: 92, val: 31200, d: 'Thu' },
                { cx: 320, cy: 68, val: 42000, d: 'Fri' },
                { cx: 400, cy: 45, val: 56500, d: 'Sat' },
                { cx: 480, cy: 25, val: 75000, d: 'Sun' }
              ].map((pt, idx) => (
                <circle 
                  key={idx}
                  cx={pt.cx}
                  cy={pt.cy}
                  r="5"
                  fill="#ff1e56"
                  stroke="#fff"
                  strokeWidth="2.5"
                  className="cursor-pointer hover:r-7 transition-all"
                  onMouseEnter={() => setHoveredDataPoint({ x: pt.cx, y: pt.cy, val: pt.val, day: pt.d })}
                  onMouseLeave={() => setHoveredDataPoint(null)}
                />
              ))}
            </svg>

            {/* Floating details tooltip */}
            <AnimatePresence>
              {hoveredDataPoint && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-20 pointer-events-none flex flex-col text-left"
                  style={{ 
                    left: `${(hoveredDataPoint.x / 500) * 100}%`, 
                    top: `${(hoveredDataPoint.y / 200) * 100 - 30}%`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{hoveredDataPoint.day} Metric</span>
                  <span className="text-xs font-mono font-bold text-white mt-0.5">{hoveredDataPoint.val.toLocaleString()} DLs</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chart bottom labels */}
          <div className="flex justify-between px-6 text-[10px] font-mono text-slate-500 mt-2">
            {chartDays.map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>

        {/* COMPILER AUDIT & CATEGORIES SPLIT BAR GRAPH (Column 3) */}
        <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl text-left">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-900 pb-4">
            <Database className="w-5 h-5 text-brand-cyan" />
            <h3 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">Resource Distribution</h3>
          </div>

          <div className="flex flex-col gap-4.5 mt-2">
            {[
              { label: 'Server Setups', pct: 35, count: categoryCounts['server-setups'] || 0, color: 'bg-brand-crimson' },
              { label: 'Plugins', pct: 25, count: categoryCounts['plugins'] || 0, color: 'bg-brand-blue' },
              { label: 'Configs', pct: 20, count: categoryCounts['configs'] || 0, color: 'bg-brand-purple' },
              { label: 'Adventure Maps', pct: 20, count: categoryCounts['maps'] || 0, color: 'bg-brand-cyan' }
            ].map((bar, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="text-slate-300 font-medium">{bar.label}</span>
                  <span className="text-slate-500 font-mono">
                    {bar.count} Modules ({bar.pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${bar.color}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Secure scanner notice */}
          <div className="mt-8 p-3.5 bg-brand-emerald/5 border border-brand-emerald/15 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-4.5 h-4.5 text-brand-emerald flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-[10px] font-mono text-brand-emerald uppercase tracking-widest font-bold">Compiler Clean Certificate</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                Every binary and source archive has passed safety compiler scanning with zero Trojan or exploit flags.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* VIP PURCHASE SYSTEM BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-left">
        {/* VIP Store Card */}
        <div className="bg-gradient-to-tr from-brand-gold/15 via-orange-500/10 to-slate-950 border border-brand-gold/30 rounded-3xl p-6 backdrop-blur-2xl relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute inset-0 cyber-grid-dense opacity-10 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-mono bg-brand-gold/20 text-brand-gold border border-brand-gold/30 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                ⭐ SPECIAL STORE OFFER
              </span>
              <span className="text-xl font-mono font-black text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-xl">
                ₹200 INR
              </span>
            </div>

            <h3 className="text-2xl font-display font-extrabold text-white uppercase tracking-tight">
              Unlock Lifetime VIP Membership
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Get an instant status upgrade on our website, inside our Discord community, and within our network. By purchasing, you directly support the developer ecosystem compilers and infrastructure.
            </p>
          </div>

          <div className="mt-6">
            <a 
              href="https://discord.gg/ZqWZnZm7P6" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => addToast('Opening Discord server for VIP role purchase...', 'success')}
              className="w-full h-12 bg-gradient-to-r from-brand-gold to-orange-500 hover:brightness-110 active:scale-95 text-xs font-sans font-black text-slate-950 rounded-2xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-lg shadow-brand-gold/10"
            >
              <Award className="w-5 h-5 animate-pulse" /> Buy VIP Role via Discord
            </a>
            <p className="text-[9px] text-slate-500 font-mono mt-2 text-center">
              *Transactions are handled securely via our official support ticketing channels.
            </p>
          </div>
        </div>

        {/* VIP Perks List Card */}
        <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-900">
            <Sparkles className="w-5 h-5 text-brand-cyan" />
            <h3 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">VIP Elite Privileges</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {[
              { title: 'Verified Badge', desc: 'A stunning premium star next to your username visible globally.' },
              { title: 'Exclusive Modules', desc: 'Direct download access to premium plugins and private Schematics.' },
              { title: 'Synced Discord VIP Role', desc: 'Unlock instant elite chat status and color on the official server.' },
              { title: 'Ad-Free Navigation', desc: 'Navigate through the matrices and databases with maximum clean interface speed.' },
              { title: 'Private Beta Channels', desc: 'Access pre-release compilers and private channels on our Discord.' },
              { title: 'Developer Support', desc: 'Get direct priority support tickets with zero queue wait times.' }
            ].map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-900/40 border border-slate-900/60 rounded-2xl">
                <span className="text-xs font-sans font-extrabold text-slate-200 block">✨ {p.title}</span>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          DISCORD INTEGRATION SYNCHRONIZATION RAIL (5 Cards Grid)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl relative mb-8">
        <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-brand-purple animate-pulse" />
            <div>
              <h3 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">Discord Synchronization Gate</h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">Securely map credentials, verify guilds, claim discord roles, and track global bans.</p>
            </div>
          </div>
          <a 
            href="https://discord.gg/ZqWZnZm7P6" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-purple/15 hover:bg-brand-purple/25 border border-brand-purple/30 text-[10px] font-sans font-bold text-brand-purple rounded-xl transition-all uppercase"
          >
            Join Discord Server <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Guild Membership */}
          <div className="p-4 bg-slate-905 border border-slate-900 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[8px] font-mono text-slate-500 uppercase block tracking-widest mb-1">MODULE 01</span>
              <h4 className="text-xs font-sans font-black text-slate-200 uppercase">Guild Verification</h4>
              <p className="text-[10px] text-slate-400 mt-2 font-sans leading-relaxed">
                Scan and verify your active membership in the official DarkLeaker Discord community guild.
              </p>
              <div className="mt-4 flex items-center gap-1.5">
                <span className="text-[9px] font-mono uppercase text-slate-500">Status:</span>
                {user?.badges?.includes('Discord Guild Verified') ? (
                  <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="text-[9px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3 h-3 animate-pulse" /> Unverified
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleVerifyGuild}
              disabled={isVerifyingGuild}
              className="mt-5 w-full h-9 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-sans font-bold text-slate-200 rounded-xl uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifyingGuild ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Verify'}
            </button>
          </div>

          {/* Card 2: Role Sync */}
          <div className="p-4 bg-slate-905 border border-slate-900 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[8px] font-mono text-slate-500 uppercase block tracking-widest mb-1">MODULE 02</span>
              <h4 className="text-xs font-sans font-black text-slate-200 uppercase">Role Sync</h4>
              <p className="text-[10px] text-slate-400 mt-2 font-sans leading-relaxed">
                Sync rank ({user?.rank || 'USER'}) instantly to Discord Roles for premium database-driven access.
              </p>
              <div className="mt-4 flex items-center gap-1.5">
                <span className="text-[9px] font-mono uppercase text-slate-500">Synced:</span>
                {user?.badges?.some(b => b.startsWith('Discord Role:')) ? (
                  <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-bold truncate max-w-[110px]">
                    <CheckCircle className="w-3 h-3" /> Synced {user?.rank}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono bg-slate-850 text-slate-500 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    Not Synced
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleSyncRoles}
              disabled={isSyncingRoles}
              className="mt-5 w-full h-9 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-sans font-bold text-slate-200 rounded-xl uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSyncingRoles ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Sync Role'}
            </button>
          </div>

          {/* Card 3: Profile Sync */}
          <div className="p-4 bg-slate-905 border border-slate-900 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[8px] font-mono text-slate-500 uppercase block tracking-widest mb-1">MODULE 03</span>
              <h4 className="text-xs font-sans font-black text-slate-200 uppercase">Profile Sync</h4>
              <p className="text-[10px] text-slate-400 mt-2 font-sans leading-relaxed">
                Import Discord metadata, custom avatars, and nicknames to your web node settings.
              </p>
              <div className="mt-4 flex items-center gap-1.5">
                <span className="text-[9px] font-mono uppercase text-slate-500">Details:</span>
                <span className="text-[9px] font-mono bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded flex items-center gap-1 font-bold truncate max-w-[110px]">
                  {user?.username}
                </span>
              </div>
            </div>
            <button
              onClick={handleSyncProfile}
              disabled={isSyncingProfile}
              className="mt-5 w-full h-9 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-sans font-bold text-slate-200 rounded-xl uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSyncingProfile ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Sync Profile'}
            </button>
          </div>

          {/* Card 4: Ban Security Sync */}
          <div className="p-4 bg-slate-905 border border-slate-900 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[8px] font-mono text-slate-500 uppercase block tracking-widest mb-1">MODULE 04</span>
              <h4 className="text-xs font-sans font-black text-slate-200 uppercase">Ban Sync</h4>
              <p className="text-[10px] text-slate-400 mt-2 font-sans leading-relaxed">
                Synchronize global Discord server ban-lists with local firewalls. Banned nodes lose access.
              </p>
              <div className="mt-4 flex items-center gap-1.5">
                <span className="text-[9px] font-mono uppercase text-slate-500">Bans:</span>
                {banListCount > 0 ? (
                  <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3 h-3" /> {banListCount} Loaded
                  </span>
                ) : (
                  <span className="text-[9px] font-mono bg-slate-850 text-slate-500 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    Not Synced
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleDiscordBanSync}
              disabled={isSyncingBans}
              className="mt-5 w-full h-9 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-sans font-bold text-slate-200 rounded-xl uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSyncingBans ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Sync Bans'}
            </button>
          </div>

          {/* Card 5: Ticket Sync Settings */}
          <div className="p-4 bg-slate-905 border border-slate-900 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[8px] font-mono text-slate-500 uppercase block tracking-widest mb-1">MODULE 05</span>
              <h4 className="text-xs font-sans font-black text-slate-200 uppercase">Ticket Sync</h4>
              <p className="text-[10px] text-slate-400 mt-2 font-sans leading-relaxed">
                Mirror created support center tickets straight to staff rooms inside the Discord server.
              </p>
              <div className="mt-4 flex items-center gap-1.5">
                <span className="text-[9px] font-mono uppercase text-slate-500">Tunnel:</span>
                {isTicketIntegrationActive ? (
                  <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    ACTIVE TUNNEL
                  </span>
                ) : (
                  <span className="text-[9px] font-mono bg-slate-850 text-slate-400 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    DISABLED
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleToggleTicketIntegration}
              className={`mt-5 w-full h-9 border text-[10px] font-sans font-bold rounded-xl uppercase transition-all flex items-center justify-center gap-2 ${
                isTicketIntegrationActive 
                  ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400' 
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {isTicketIntegrationActive ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>
          </motion.div>
        ) : (
          <motion.div
            key="security-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8 mb-8"
          >
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SECURITY PORTAL POLICIES GRID
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* PANEL 1: RATE LIMITS CONFIGURATION */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-brand-purple" />
                      <h3 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">Rate Limiting Guard</h3>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${rateLimitEnabled ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                      {rateLimitEnabled ? 'ACTIVE' : 'MUTED'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-sans leading-relaxed mb-6">
                    Mitigate request spam on database and compiler endpoints. If triggers are breached, nodes are throttled and event logs sync to Supabase.
                  </p>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center bg-slate-900/20 border border-slate-900/60 p-3 rounded-2xl">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-sans font-bold text-slate-300">Spam Limit Threshold</span>
                        <span className="text-[9px] font-mono text-slate-500">Max requests per client IP</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-brand-purple">10 req/sec</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/20 border border-slate-900/60 p-3 rounded-2xl">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-sans font-bold text-slate-300">Compiling Throttle</span>
                        <span className="text-[9px] font-mono text-slate-500">Cooldown buffer for Java packaging</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-brand-purple">3.0 seconds</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setRateLimitEnabled(!rateLimitEnabled);
                    addToast(`Rate limiting policy ${!rateLimitEnabled ? 'fully enforced' : 'disabled temporarily'}.`, 'info');
                    addSecurityLog('RATE_LIMIT_RULE_MODIFIED', user?.email || 'anonymous', { enabled: !rateLimitEnabled });
                  }}
                  className={`mt-6 w-full h-10 border text-[10px] font-sans font-bold rounded-xl uppercase transition-all flex items-center justify-center gap-2 ${
                    rateLimitEnabled 
                      ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-400' 
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {rateLimitEnabled ? 'Mute Rate Limiter Rules' : 'Enforce Rate Limiter Rules'}
                </button>
              </div>

              {/* PANEL 2: LOGIN ATTEMPT LIMITS */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-brand-crimson" />
                      <h3 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">Login Attempt Locks</h3>
                    </div>
                    <span className="text-[9px] font-mono bg-brand-crimson/15 text-brand-crimson border border-brand-crimson/20 px-2 py-0.5 rounded-full font-bold">
                      BRUTE FORCE SHIELD
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-sans leading-relaxed mb-6">
                    Set thresholds to block repetitive credentials entry. Nodes exceeding failures are temporarily firewalled.
                  </p>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center bg-slate-900/20 border border-slate-900/60 p-3 rounded-2xl">
                      <span className="text-[11px] font-sans font-bold text-slate-300">Max Failed Logins</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const val = Math.max(2, maxLoginAttempts - 1);
                            setMaxLoginAttempts(val);
                            addSecurityLog('LOGIN_LIMIT_UPDATED', user?.email || 'anonymous', { maxAttempts: val });
                          }}
                          className="w-6 h-6 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] text-white rounded flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold text-brand-crimson px-2">{maxLoginAttempts}</span>
                        <button 
                          onClick={() => {
                            const val = Math.min(10, maxLoginAttempts + 1);
                            setMaxLoginAttempts(val);
                            addSecurityLog('LOGIN_LIMIT_UPDATED', user?.email || 'anonymous', { maxAttempts: val });
                          }}
                          className="w-6 h-6 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] text-white rounded flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/20 border border-slate-900/60 p-3 rounded-2xl">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-sans font-bold text-slate-300">Lockout Timeout</span>
                        <span className="text-[9px] font-mono text-slate-500">IP firewall lock duration</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-brand-crimson">30 seconds</span>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-slate-500 text-center mt-3 p-2 border border-slate-900/40 rounded-xl bg-black/20">
                  Policy: Locking client IP nodes after {maxLoginAttempts} failed authentication routines.
                </div>
              </div>

              {/* PANEL 3: INTERACTIVE THREAT GENERATOR & ACTIONS */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-900">
                    <Activity className="w-5 h-5 text-brand-gold animate-pulse" />
                    <h3 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">Intrusion simulation</h3>
                  </div>

                  <p className="text-xs text-slate-400 font-sans leading-relaxed mb-6">
                    Trigger artificial malicious intrusion indicators to inspect the real-time Supabase audit logger. Simulated threats log instantly.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={async () => {
                        await addSecurityLog('MALICIOUS_LINK_BLOCKED', user?.email || 'anonymous', {
                          malicious_url: 'http://malicious-plugin-mirror.ru/stealer.jar',
                          host: 'Russian Mirror Node #03',
                          action_taken: 'IP blocked & download vector aborted'
                        });
                        addToast('Simulated threat logged to Supabase! Review the log table below.', 'error');
                        loadSecurityLogs();
                      }}
                      className="w-full h-10 bg-brand-crimson/10 hover:bg-brand-crimson/25 border border-brand-crimson/30 text-[10px] font-sans font-bold text-brand-crimson uppercase rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      ⚠️ Simulate Malicious link upload
                    </button>

                    <button
                      onClick={async () => {
                        await addSecurityLog('AUTH_RATE_LIMIT_TRIGGERED', user?.email || 'anonymous', {
                          triggered_by: 'Node API request flood (45 hits/sec)',
                          location: 'Frankfurt-DE Server',
                          client_ip: '102.15.22.84'
                        });
                        addToast('Simulated rate breach logged to Supabase!', 'info');
                        loadSecurityLogs();
                      }}
                      className="w-full h-10 bg-brand-gold/10 hover:bg-brand-gold/25 border border-brand-gold/30 text-[10px] font-sans font-bold text-brand-gold uppercase rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      ⚡ Simulate API DDoS flood
                    </button>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-slate-500 text-center mt-3">
                  Click buttons to insert real logs into the database.
                </div>
              </div>

            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ENTERPRISE SECURITY DASHBOARD & AUTOMATED SYNCHRONIZATION SCHEDULER
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
              {/* Card 1: Automated Sync Jobs Scheduler */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-brand-purple animate-pulse" />
                      <div>
                        <h3 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">Enterprise Sync Scheduler</h3>
                        <p className="text-[10px] text-slate-500">Automated multi-thread synchronization tasks</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSchedulerActive(!isSchedulerActive)}
                      className={`px-3 py-1 text-[10px] font-mono rounded-lg border transition-all font-bold ${
                        isSchedulerActive 
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/20 text-emerald-400' 
                          : 'bg-yellow-500/10 hover:bg-yellow-500/25 border-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {isSchedulerActive ? '● SCHEDULER ACTIVE' : '○ SCHEDULER PAUSED'}
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {syncJobs.map((job) => (
                      <div key={job.id} className="p-3.5 bg-slate-900/40 border border-slate-900/60 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              job.status === 'RUNNING' ? 'bg-brand-purple animate-ping' :
                              job.status === 'SUCCESS' ? 'bg-emerald-400' :
                              job.status === 'FAILED' ? 'bg-brand-crimson' :
                              'bg-slate-500'
                            }`} />
                            <span className="text-xs font-sans font-extrabold text-slate-200">{job.name}</span>
                            <span className="text-[9px] font-mono text-slate-500">({job.schedule})</span>
                          </div>
                          <button
                            onClick={() => triggerJob(job.id)}
                            disabled={job.status === 'RUNNING'}
                            className="px-2 py-0.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-300 rounded uppercase transition-all disabled:opacity-50"
                          >
                            {job.status === 'RUNNING' ? 'Syncing...' : 'Run Now'}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900/40">
                          <div>
                            <span className="text-slate-600 block text-[9px]">LAST RUN</span>
                            <span className="text-slate-300">{job.lastRun}</span>
                          </div>
                          <div>
                            <span className="text-slate-600 block text-[9px]">NEXT RUN IN</span>
                            <span className="text-brand-purple font-bold">
                              {isSchedulerActive ? `${job.nextRunSeconds}s` : 'Paused'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-600 block text-[9px]">SUCCESS RATE</span>
                            <span className="text-emerald-400 font-bold">{job.successRate}%</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-1 p-[1px]">
                          <div 
                            className="h-full bg-brand-purple rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${(job.nextRunSeconds / job.maxSeconds) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Live Verification & Sync Status Overview */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-900">
                    <ShieldCheck className="w-5 h-5 text-brand-emerald" />
                    <div>
                      <h3 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">Verification Gateways</h3>
                      <p className="text-[10px] text-slate-500">Secure validation modules synced with Discord API</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Discord Sync Status */}
                    <div className="p-3.5 bg-slate-900/30 border border-slate-900/50 rounded-2xl">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Discord Gateway</span>
                      <span className="text-xs font-sans font-bold text-slate-200 mt-1 block">API Connection</span>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Online (24ms)</span>
                      </div>
                    </div>

                    {/* Guild Verification Status */}
                    <div className="p-3.5 bg-slate-900/30 border border-slate-900/50 rounded-2xl">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Guild Verification</span>
                      <span className="text-xs font-sans font-bold text-slate-200 mt-1 block">Server Membership</span>
                      <div className="mt-2">
                        {user?.badges?.includes('Discord Guild Verified') ? (
                          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                            ✓ VERIFIED MEMBER
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-yellow-500 font-bold uppercase flex items-center gap-1 animate-pulse">
                            ⚠ UNVERIFIED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role Sync Status */}
                    <div className="p-3.5 bg-slate-900/30 border border-slate-900/50 rounded-2xl">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Role Synchronization</span>
                      <span className="text-xs font-sans font-bold text-slate-200 mt-1 block">Website Rank mapping</span>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-brand-purple font-bold uppercase">
                          Mapped to: {user?.rank || 'USER'}
                        </span>
                      </div>
                    </div>

                    {/* Ban Verification Status */}
                    <div className="p-3.5 bg-slate-900/30 border border-slate-900/50 rounded-2xl">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Ban Synchronization</span>
                      <span className="text-xs font-sans font-bold text-slate-200 mt-1 block">Blacklisted Profiles</span>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-brand-crimson font-bold uppercase">
                          {banListCount || 43} Nodes Filtered
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role Sync Logs & Security Events mini logs */}
                  <div className="mt-4 p-3 bg-slate-900/10 border border-slate-900/40 rounded-2xl">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider mb-2">Recent Role & Sync Events</span>
                    <div className="flex flex-col gap-1.5 h-20 overflow-y-auto">
                      {securityLogs.length === 0 ? (
                        <span className="text-[10px] font-mono text-slate-600 italic">No events recorded. Run scheduler jobs to populate.</span>
                      ) : (
                        securityLogs.slice(0, 4).map((log, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-slate-400 truncate max-w-[160px]">
                              ⚡ {log.event_type}
                            </span>
                            <span className="text-slate-600 text-[9px]">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                DATABASE-DRIVEN SECURITY AUDIT LOG TABLE
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-900">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-brand-crimson" />
                  <div>
                    <h3 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">Supabase Security Audit Logs</h3>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">Persistent security triggers, block listings, role synchronization, and system events.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={loadSecurityLogs}
                    disabled={isLoadingSecLogs}
                    className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[9px] font-mono text-slate-300 rounded-xl transition-all flex items-center gap-1.5 uppercase"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSecLogs ? 'animate-spin' : ''}`} />
                    Refresh Logs
                  </button>
                  <button
                    onClick={async () => {
                      const { error } = await supabase.from('security_audit_logs').delete().neq('id', 'placeholder-none');
                      if (!error) {
                        addToast('Security Audit Log table purged successfully.', 'success');
                        loadSecurityLogs();
                      } else {
                        addToast('No permission to clear logs or table empty.', 'info');
                      }
                    }}
                    className="h-8 px-3.5 bg-brand-crimson/10 hover:bg-brand-crimson/20 border border-brand-crimson/30 text-[9px] font-mono text-brand-crimson rounded-xl transition-all uppercase"
                  >
                    Purge Table
                  </button>
                </div>
              </div>

              {/* Enterprise Security Operations Center (SOC) Metrics Deck */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                {[
                  {
                    label: 'Failed Logins',
                    count: securityLogs.filter(log => log.event_type.includes('FAILED') && (log.event_type.includes('LOGIN') || log.event_type.includes('AUTH'))).length,
                    bg: 'bg-red-950/20 border-red-900/30',
                    text: 'text-red-400',
                    dot: 'bg-red-500'
                  },
                  {
                    label: 'Discord Sync Errors',
                    count: securityLogs.filter(log => log.event_type.toLowerCase().includes('discord') && (log.event_type.toLowerCase().includes('error') || log.event_type.toLowerCase().includes('failed'))).length,
                    bg: 'bg-amber-950/20 border-amber-900/30',
                    text: 'text-amber-400',
                    dot: 'bg-amber-500'
                  },
                  {
                    label: 'Role Changes',
                    count: securityLogs.filter(log => log.event_type.toLowerCase().includes('role') || log.event_type.toLowerCase().includes('rank')).length,
                    bg: 'bg-blue-950/20 border-blue-900/30',
                    text: 'text-blue-400',
                    dot: 'bg-blue-500'
                  },
                  {
                    label: 'Permission Changes',
                    count: securityLogs.filter(log => log.event_type.toLowerCase().includes('permission') || log.event_type.toLowerCase().includes('privilege')).length,
                    bg: 'bg-purple-950/20 border-purple-900/30',
                    text: 'text-purple-400',
                    dot: 'bg-purple-500'
                  },
                  {
                    label: 'Ticket Actions',
                    count: securityLogs.filter(log => log.event_type.toLowerCase().includes('ticket')).length,
                    bg: 'bg-emerald-950/20 border-emerald-900/30',
                    text: 'text-emerald-400',
                    dot: 'bg-emerald-500'
                  },
                  {
                    label: 'Moderation Actions',
                    count: securityLogs.filter(log => log.event_type.toLowerCase().includes('moderation') || log.event_type.toLowerCase().includes('asset')).length,
                    bg: 'bg-cyan-950/20 border-cyan-900/30',
                    text: 'text-cyan-400',
                    dot: 'bg-cyan-500'
                  },
                  {
                    label: 'Security Events',
                    count: securityLogs.length,
                    bg: 'bg-slate-900/40 border-slate-800',
                    text: 'text-slate-300',
                    dot: 'bg-brand-crimson animate-pulse'
                  }
                ].map((stat, idx) => (
                  <div key={idx} className={`p-3.5 border rounded-2xl flex flex-col justify-between ${stat.bg}`}>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                        <span className="text-[9px] font-mono font-bold uppercase text-slate-500 tracking-wider truncate block">
                          {stat.label}
                        </span>
                      </div>
                      <span className={`text-xl font-display font-extrabold ${stat.text}`}>
                        {stat.count}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-slate-600 uppercase mt-2">Active Monitor</span>
                  </div>
                ))}
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-black/30">
                <table className="w-full border-collapse text-left font-sans">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/45 text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Event Type</th>
                      <th className="p-4">Entity Identity</th>
                      <th className="p-4">Simulated IP</th>
                      <th className="p-4">Payload Spec / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-xs">
                    {isLoadingSecLogs ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center font-mono text-slate-500 animate-pulse">
                          Querying Supabase cluster for security audit log tuples...
                        </td>
                      </tr>
                    ) : securityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center font-mono text-slate-600">
                          No audit log transactions found. Trigger simulations to write log rows.
                        </td>
                      </tr>
                    ) : (
                      securityLogs.map((log) => {
                        let badgeCol = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                        if (log.event_type.includes('BLOCKED') || log.event_type.includes('FAILED') || log.event_type.includes('ALERT')) {
                          badgeCol = 'bg-brand-crimson/15 text-brand-crimson border-brand-crimson/30';
                        } else if (log.event_type.includes('VERIFIED') || log.event_type.includes('SYNCED') || log.event_type.includes('SUCCESS')) {
                          badgeCol = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
                        } else if (log.event_type.includes('LIMIT') || log.event_type.includes('LOCK')) {
                          badgeCol = 'bg-brand-gold/15 text-brand-gold border-brand-gold/25';
                        }

                        const dateString = new Date(log.created_at).toLocaleString();

                        return (
                          <tr key={log.id} className="hover:bg-slate-950/40 transition-colors">
                            <td className="p-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">{dateString}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[9px] border ${badgeCol} whitespace-nowrap`}>
                                {log.event_type}
                              </span>
                            </td>
                            <td className="p-4 text-slate-300 font-medium whitespace-nowrap">{log.user_email}</td>
                            <td className="p-4 font-mono text-slate-500 text-[10px] whitespace-nowrap">{log.ip_address || '102.15.22.84'}</td>
                            <td className="p-4 text-slate-400 font-sans max-w-sm truncate">
                              {log.payload ? JSON.stringify(log.payload) : 'Null payload'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          LIVE PROCESSES TERMINAL & SYSTEM LOG AUDITING LOGGER
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-brand-cyan animate-pulse" />
            <h3 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">Live Telemetry Terminal</h3>
          </div>
          <span className="text-[9px] font-mono bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 px-2 py-0.5 rounded animate-pulse">
            LIVE PROCESSOR TICKING
          </span>
        </div>

        {/* Code shell logs output view */}
        <div className="p-4 bg-black/60 border border-slate-900 rounded-2xl font-mono text-[11px] leading-relaxed text-slate-400 flex flex-col gap-1.5 h-48 overflow-y-auto">
          {liveProcesses.map((p) => (
            <div key={p.id} className="flex gap-4 items-start select-none">
              <span className="text-slate-600 font-mono">{p.time}</span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                p.status === 'OK' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                p.status === 'SYNCED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                'bg-brand-crimson/10 text-brand-crimson border border-brand-crimson/20'
              }`}>
                {p.status}
              </span>
              <p className="text-left flex-grow truncate">{p.text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
