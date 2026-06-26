import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Github, Terminal, ArrowRight, Lock, Cpu, BookOpen, 
  Zap, Sparkles, Globe, Users, CloudLightning, ShieldCheck, HelpCircle, Database
} from 'lucide-react';

// Sub Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marketplace from './components/Marketplace';
import Creators from './components/Creators';
import Community from './components/Community';
import Support from './components/Support';
import Dashboard from './components/Dashboard';
import Promotions from './components/Promotions';
import Toast, { ToastMessage } from './components/Toast';
import VoxelWorldCanvas from './components/VoxelWorldCanvas';
import AuthModal from './components/AuthModal';
import ProfileSetup from './components/ProfileSetup';

// Supabase helper operations
import { 
  supabase, 
  getOrCreateProfile, 
  fetchMarketplaceItems, 
  fetchCommunityPosts, 
  fetchSupportTickets, 
  fetchCreators,
  isSupabaseConfigured
} from './lib/supabase';

// Data models & Seeds
import { 
  ThemeMode, WeatherType, User 
} from './types';

export default function App() {
  const [isSandbox, setIsSandbox] = useState(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('isSandboxMode', 'true');
      return true;
    }
    return localStorage.getItem('isSandboxMode') === 'true';
  });
  const [activeTab, setActiveTab] = useState<string>('home');
  const [theme, setTheme] = useState<ThemeMode>('midnight');
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [user, setUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Local state caches (instantiated with empty arrays, synced live to Supabase!)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);

  // Deep linking selection state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Toast trigger utility
  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto prune
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth synchronization subscriptions
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        getOrCreateProfile(session.user).then(profile => {
          setUser(profile);
          addToast(`Synced profile node: ${profile.username}`, 'success');
        });
      }
    });

    // Subscribe to updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        getOrCreateProfile(session.user).then(profile => {
          setUser(profile);
          addToast(`Session authenticated: ${profile.username}`, 'success');
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch real database records from Supabase
  const loadDatabaseData = async () => {
    setLoading(true);
    try {
      const [items, dbPosts, dbTickets, dbCreators] = await Promise.all([
        fetchMarketplaceItems(),
        fetchCommunityPosts(),
        fetchSupportTickets(user?.email),
        fetchCreators()
      ]);

      setMarketplaceItems(items || []);
      setPosts(dbPosts || []);
      setTickets(dbTickets || []);
      setCreators(dbCreators || []);
    } catch (err) {
      console.warn('Supabase offline or tables unmigrated, rendering high-fidelity memory cache:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, [user]);

  // Real-time synchronization for all database changes across any visitor sessions
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channelName = `public-db-changes-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          // Reload the fresh database data silently on any database mutation event
          loadDatabaseData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Search result deep link selector
  const handleSearchSelect = (type: 'resource' | 'creator' | 'support', id: string) => {
    if (type === 'resource') {
      setActiveTab('marketplace');
      setSelectedItemId(id);
      addToast(`Opened resource specification details`, 'success');
    } else if (type === 'creator') {
      setActiveTab('creators');
      addToast(`Focused on creator spotlight: ${id}`, 'info');
    } else if (type === 'support') {
      setActiveTab('support');
      addToast(`Opened support tickets module`, 'info');
    }
  };

  // Copy-paste developer helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Developer dependency copy success!', 'premium');
  };

  if (!isSupabaseConfigured && !isSandbox) {
    return (
      <div className="min-h-screen text-slate-100 font-sans selection:bg-brand-purple/30 bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Cyber overlay grid */}
        <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
        
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/60 border border-red-500/25 backdrop-blur-2xl relative z-10 shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6 animate-pulse">
            <Lock className="w-8 h-8" />
          </div>
          
          <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-black">SYSTEM CONFIGURATION ERROR</span>
          <h2 className="text-2xl font-display font-black text-white mt-2 uppercase">Supabase Offline</h2>
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            The platform is running in <b>production-only database mode</b>. No mockup databases are allowed. All features require direct authentication & real-time synchronization.
          </p>
          
          <div className="w-full mt-6 p-4.5 bg-black/40 border border-slate-900 rounded-2xl text-left flex flex-col gap-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">REQUIRED ENVIRONMENT VARIABLES:</span>
            <div className="flex flex-col gap-1.5 font-mono text-[10px]">
              <div className="flex justify-between p-1 bg-slate-900/50 rounded border border-slate-800">
                <span className="text-slate-400">VITE_SUPABASE_URL</span>
                <span className="text-red-400 font-bold">MISSING</span>
              </div>
              <div className="flex justify-between p-1 bg-slate-900/50 rounded border border-slate-800">
                <span className="text-slate-400">VITE_SUPABASE_ANON_KEY</span>
                <span className="text-red-400 font-bold">MISSING</span>
              </div>
            </div>
          </div>
          
          <div className="w-full mt-5 text-left">
            <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Quick Setup Guide</h4>
            <ul className="list-decimal list-inside text-[11px] text-slate-500 mt-2 space-y-1">
              <li>Open your project settings or <code>.env</code> file.</li>
              <li>Provide your secure Supabase API credentials.</li>
              <li>Apply schema migrations via your terminal query logs.</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              localStorage.setItem('isSandboxMode', 'true');
              setIsSandbox(true);
              addToast('Launched interactive local database sandbox!', 'success');
            }}
            className="w-full mt-6 py-3 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono text-xs font-bold tracking-wider uppercase border border-violet-500/30 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Terminal className="w-4 h-4 animate-pulse" />
            Launch Sandbox Demo
          </motion.button>
        </div>
        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  if (user && !user.isActive) {
    return (
      <div className="min-h-screen text-slate-100 font-sans selection:bg-brand-purple/30 bg-slate-950 flex flex-col relative overflow-x-hidden">
        <ProfileSetup
          user={user}
          onComplete={(updatedUser) => {
            setUser(updatedUser);
            loadDatabaseData();
          }}
          addToast={addToast}
          onLogout={async () => {
            if (isSupabaseConfigured) {
              await supabase.auth.signOut();
            }
            setUser(null);
            addToast('Logged out of system node.', 'info');
          }}
        />
        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-brand-purple/30 bg-slate-950 flex flex-col relative overflow-x-hidden">
      
      {/* Sandbox mode alert banner */}
      {isSandbox && !isSupabaseConfigured && (
        <div className="bg-gradient-to-r from-amber-600/10 via-yellow-600/15 to-amber-600/10 border-b border-amber-500/20 text-center py-2 px-4 relative z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs font-mono text-amber-300">
            <div className="flex items-center gap-2 mx-auto">
              <Database className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>
                ⚡ App running in <b>Sandbox Demo Mode (Offline)</b>. Connect your secure Supabase credentials in settings to enable cross-device live sync.
              </span>
            </div>
            <button 
              onClick={() => {
                addToast('Secure offline storage active. To connect a live Supabase DB, declare VITE_SUPABASE_URL in settings.', 'info');
              }}
              className="px-2.5 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-[10px] uppercase font-bold text-amber-200 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer"
            >
              Credentials Status
            </button>
          </div>
        </div>
      )}
      
      {/* Cinematic animated custom 3D Voxel Engine Canvas render background */}
      <VoxelWorldCanvas weather={weather} theme={theme} />
      
      {/* Cyber overlay grid */}
      <div className="absolute inset-0 cyber-grid opacity-30 mix-blend-overlay pointer-events-none -z-10" />

      {/* Global AAA Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        setUser={setUser}
        notifications={notifications}
        setNotifications={setNotifications}
        messages={messages}
        setMessages={setMessages}
        theme={theme}
        setTheme={setTheme}
        weather={weather}
        setWeather={setWeather}
        onSearchSelect={handleSearchSelect}
        marketplaceItems={marketplaceItems}
        creators={creators}
        addToast={addToast}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Core View Area Router */}
      <main className="flex-grow z-10">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOME (Living ecosystem + Interactive Widgets) */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-12 pb-20"
            >
              {/* Massive cinematic animated world section */}
              <Hero
                theme={theme}
                weather={weather}
                user={user}
                setUser={setUser}
                setActiveTab={setActiveTab}
                addToast={addToast}
              />

              {/* HANDCRAFTED PRESTIGE OVERVIEW BENTO DASHBOARD GRID */}
              <section className="max-w-7xl mx-auto px-6 w-full text-left">
                {/* Supabase realtime status banner */}
                <div className="mb-8 p-4 bg-slate-900/50 border border-slate-900 rounded-3xl backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                      <Database className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-brand-cyan uppercase tracking-widest font-bold">SUPABASE DEPLOYMENT INSTANCE</span>
                      <h4 className="text-xs font-sans font-bold text-slate-200 mt-0.5">Connected Real-time Database Cluster</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="h-10 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-sans font-bold text-slate-300 rounded-xl transition-all uppercase"
                    >
                      Authenticate Node
                    </button>
                  </div>
                </div>

                <div className="mb-8">
                  <span className="text-xs font-mono text-brand-purple uppercase tracking-widest font-bold">PLATFORM MATRIX</span>
                  <h3 className="text-2xl font-display font-extrabold text-white uppercase mt-1">Platform Hub Summary</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* BENTO CARD 1: Trending resources spotlight */}
                  <div className="md:col-span-2 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none" />
                    <div className="flex justify-between items-center mb-5 border-b border-slate-900/60 pb-3">
                      <span className="text-xs font-mono text-brand-cyan uppercase tracking-widest font-bold">🔥 Trending Artifacts</span>
                      <button 
                      onClick={() => setActiveTab('marketplace')}
                        className="text-[10px] font-mono text-slate-500 hover:text-brand-cyan transition-colors"
                      >
                        View All
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {marketplaceItems.slice(0, 3).map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => handleSearchSelect('resource', item.id)}
                          className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-900/80 hover:border-brand-cyan/20 cursor-pointer flex justify-between items-center transition-all group/item"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.bannerGradient} flex items-center justify-center text-sm shadow-md flex-shrink-0`}>
                              📦
                            </div>
                            <div className="flex flex-col truncate max-w-[200px] sm:max-w-xs">
                              <span className="text-xs font-sans font-black text-slate-200 group-hover/item:text-brand-cyan transition-colors">{item.title}</span>
                              <span className="text-[9px] font-mono text-slate-500 mt-0.5 capitalize">Category: {item.category.replace('-', ' ')}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono">
                            <span className="text-brand-gold flex items-center gap-0.5">★ {item.rating}</span>
                            <span className="text-slate-400">{item.price === 0 ? 'FREE' : `$${item.price}`}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BENTO CARD 2: Top ranking creator card spotlight */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl relative overflow-hidden text-left flex flex-col justify-between">
                    <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none" />
                    <div className="mb-4">
                      <span className="text-xs font-mono text-brand-gold uppercase tracking-widest font-bold">👑 Creator Spotlight</span>
                      
                      <div className="flex items-center gap-3 mt-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/10">
                          🧙‍♂️
                        </div>
                        <div className="flex flex-col">
                          <h4 className="text-sm font-sans font-black text-slate-200">Darkthemaster</h4>
                          <span className="text-[10px] text-slate-500 font-sans mt-0.5">Adventure Overhauls</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                        Pioneering Minecraft narrative mechanisms. Unlocked achievements list: Voxel Master, Gold Quality, and Million Club licenses.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('creators')}
                      className="w-full h-10 bg-slate-950 hover:bg-slate-900 border border-slate-900/80 text-[10px] font-sans font-bold text-slate-300 hover:text-white uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all mt-4"
                    >
                      Browse Top Creators <ArrowRight className="w-3.5 h-3.5 text-brand-purple" />
                    </button>
                  </div>

                </div>
              </section>
            </motion.div>
          )}

          {/* TAB 2: MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="pb-20"
            >
              <Marketplace
                items={marketplaceItems}
                setItems={setMarketplaceItems}
                user={user}
                setUser={setUser}
                addToast={addToast}
                selectedItemId={selectedItemId}
                setSelectedItemId={setSelectedItemId}
              />
            </motion.div>
          )}

          {/* TAB 4: COMMUNITY BROADCAST FEED */}
          {activeTab === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="pb-20"
            >
              <Community
                posts={posts}
                setPosts={setPosts}
                user={user}
                setUser={setUser}
                addToast={addToast}
              />
            </motion.div>
          )}

          {/* TAB 5: VERIFIED CREATORS HUB */}
          {activeTab === 'creators' && (
            <motion.div
              key="creators"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="pb-20"
            >
              <Creators
                creators={creators}
                setCreators={setCreators}
                user={user}
                addToast={addToast}
              />
            </motion.div>
          )}

          {/* TAB 6: SUPPORT FAQS & CHAT BOT TICKETING */}
          {activeTab === 'support' && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="pb-20"
            >
              <Support
                tickets={tickets}
                setTickets={setTickets}
                user={user}
                setUser={setUser}
                addToast={addToast}
              />
            </motion.div>
          )}

          {/* TAB 7: SAAS ANALYTICS SYSTEM */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="pb-20"
            >
              <Dashboard
                user={user}
                setUser={setUser}
                items={marketplaceItems}
                addToast={addToast}
              />
            </motion.div>
          )}

          {/* TAB 8: PROMOTIONS ACTIVATOR SYSTEM */}
          {activeTab === 'promotions' && (
            <motion.div
              key="promotions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="pb-20"
            >
              <Promotions
                user={user}
                setUser={setUser}
                addToast={addToast}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Futuristic platform metadata footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-8 px-6 backdrop-blur-xl relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-500">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="text-slate-400 font-bold tracking-wider">DARKLEAKER NETWORK INC. © 2026</span>
          <p className="text-[10px] text-slate-600 font-sans mt-0.5">High-fidelity safe Minecraft compilers & resource platforms.</p>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center">
          <span className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1 rounded border border-slate-900">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
            ONLINE TELEMETRY: 99.98%
          </span>
          <span className="text-[10px] uppercase text-slate-600">
            SECURE TLS-256
          </span>
        </div>
      </footer>

      {/* Global slide sliding Toasts hub notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Cyber Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} addToast={addToast} setUser={setUser} />

    </div>
  );
}
