import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Mail, Shield, ChevronDown, Award, Zap, Sparkles, 
  Settings, Check, Volume2, VolumeX, Terminal, BookOpen, UserCheck, 
  HelpCircle, Star, Send, CloudRain, Sun, CloudLightning, Snowflake,
  Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  User, NotificationItem, MessageThread, ThemeMode, WeatherType, 
  MarketplaceItem, Creator
} from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  messages: MessageThread[];
  setMessages: React.Dispatch<React.SetStateAction<MessageThread[]>>;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  weather: WeatherType;
  setWeather: (weather: WeatherType) => void;
  onSearchSelect: (type: 'resource' | 'creator' | 'support', id: string) => void;
  marketplaceItems: MarketplaceItem[];
  creators: Creator[];
  addToast: (message: string, type: 'success' | 'info' | 'error' | 'premium') => void;
  onOpenAuth: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  setUser,
  notifications,
  setNotifications,
  messages,
  setMessages,
  theme,
  setTheme,
  weather,
  setWeather,
  onSearchSelect,
  marketplaceItems,
  creators,
  addToast,
  onOpenAuth
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setShowMessages(false);
        setActiveChatId(null);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const unreadMessagesCount = messages.filter(m => m.unread).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addToast('All notifications marked as read', 'success');
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleSendMessage = () => {
    if (!typedMessage.trim() || !activeChatId) return;

    // Append user message
    setMessages(prev => prev.map(thread => {
      if (thread.id === activeChatId) {
        const updatedMessages = [
          ...thread.messages,
          { sender: 'user' as const, text: typedMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ];
        return {
          ...thread,
          lastMessage: typedMessage,
          messages: updatedMessages,
          unread: false
        };
      }
      return thread;
    }));

    const messageText = typedMessage;
    setTypedMessage('');

    // Simulated reply from the creator
    setTimeout(() => {
      const replies = [
        "That sounds awesome! Let me sync with my build team.",
        "Thanks for the feedback, I'm working on an optimization patch right now.",
        "Yes, that version is fully compatible! Drop a rating if you like it.",
        "Let me verify your transaction on our backend. One second!"
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      setMessages(prev => prev.map(thread => {
        if (thread.id === activeChatId) {
          return {
            ...thread,
            lastMessage: randomReply,
            messages: [
              ...thread.messages,
              { sender: 'other' as const, text: randomReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ],
            unread: true
          };
        }
        return thread;
      }));

      // Trigger a direct notify
      addToast(`New message from ${messages.find(m => m.id === activeChatId)?.sender}`, 'info');
    }, 1500);
  };

  // Search indexing
  const filteredSearchItems = () => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    
    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: 'resource' | 'creator' | 'support';
      tag?: string;
    }> = [];

    // Filter resources
    marketplaceItems.forEach(item => {
      if (item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.tags.some(t => t.toLowerCase().includes(q))) {
        results.push({
          id: item.id,
          title: item.title,
          subtitle: `In ${item.category.replace('-', ' ')} • ★${item.rating}`,
          type: 'resource',
          tag: item.price === 0 ? 'FREE' : `$${item.price}`
        });
      }
    });

    // Filter creators
    creators.forEach(creator => {
      if (creator.username.toLowerCase().includes(q) || creator.specialty.toLowerCase().includes(q)) {
        results.push({
          id: creator.username,
          title: creator.username,
          subtitle: creator.specialty,
          type: 'creator',
          tag: 'CREATOR'
        });
      }
    });

    return results.slice(0, 5);
  };

  const activeChat = messages.find(m => m.id === activeChatId);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 border-b border-slate-900 backdrop-blur-xl h-20 flex items-center px-6 lg:px-8 justify-between">
      {/* Platform Branding */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="xl:hidden p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center"
          aria-label="Toggle Mobile Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div 
          onClick={() => {
            setActiveTab('home');
            setIsMobileMenuOpen(false);
          }}
          className="cursor-pointer group flex items-center gap-2.5"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-crimson via-brand-purple to-brand-blue p-[2px] shadow-lg group-hover:shadow-brand-crimson/20 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-crimson group-hover:text-brand-purple transition-colors duration-300 animate-pulse" />
            </div>
            {/* Hologram scan layer */}
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <div className="w-full h-[2px] bg-brand-cyan/70 shadow-glow shadow-brand-cyan animate-[holo-scan_2s_infinite_linear]" />
            </div>
          </div>
          <span className="text-xl font-display font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent group-hover:from-brand-crimson group-hover:to-brand-purple transition-all duration-300">
            DARKLEAKER
          </span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="hidden xl:flex items-center gap-1">
        {['home', 'marketplace', 'community', 'creators', 'support', 'dashboard'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              id={`nav-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2 rounded-lg text-sm font-sans font-semibold tracking-wide transition-all duration-300 hover:text-white capitalize ${
                isActive ? 'text-white bg-white/5' : 'text-slate-400 hover:bg-white/[0.02]'
              }`}
            >
              {tab}
              {isActive && (
                <motion.div 
                  layoutId="activeNavIndicator"
                  className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-brand-crimson via-brand-purple to-brand-blue"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right-Side Operations Panel */}
      <div className="flex items-center gap-4">
        {/* Real-time Global Search System */}
        <div ref={searchRef} className="relative hidden md:block w-64 lg:w-72">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search resources, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full h-10 pl-10 pr-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 focus:border-brand-purple rounded-xl text-xs font-sans placeholder-slate-500 focus:outline-none transition-all duration-300 text-white"
            />
          </div>

          <AnimatePresence>
            {isSearchFocused && filteredSearchItems().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-12 left-0 right-0 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-2xl"
              >
                <div className="px-3 py-1.5 text-[10px] font-mono tracking-wider text-slate-500 uppercase border-b border-slate-900">
                  Search Matches
                </div>
                <div className="mt-1 flex flex-col gap-0.5">
                  {filteredSearchItems().map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSearchSelect(item.type, item.id);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-white/5 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-sans font-semibold text-slate-200 group-hover:text-white transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans mt-0.5">
                          {item.subtitle}
                        </span>
                      </div>
                      {item.tag && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          item.tag === 'FREE' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : item.tag === 'CREATOR'
                            ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20'
                            : 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
                        }`}>
                          {item.tag}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ambient Settings & Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-xl border border-slate-900">
          {/* Audio toggle */}
          <button 
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              addToast(audioEnabled ? 'Platform hum muted' : 'Platform synthesized hum active', 'info');
            }}
            className={`p-2 rounded-lg hover:bg-slate-800 transition-colors ${audioEnabled ? 'text-brand-cyan' : 'text-slate-500'}`}
            title="Toggle Interface Feedback Sound"
          >
            {audioEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
          </button>

          {/* Theme & Weather Controller Dropdown */}
          <div ref={themeRef} className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white flex items-center gap-1"
              title=" Evolve Environment Theme & Weather"
            >
              {weather === 'clear' && <Sun className="w-4.5 h-4.5 text-brand-gold" />}
              {weather === 'cyber-rain' && <CloudRain className="w-4.5 h-4.5 text-brand-blue" />}
              {weather === 'cosmic-snow' && <Snowflake className="w-4.5 h-4.5 text-brand-cyan animate-spin" />}
              {weather === 'portal-storm' && <CloudLightning className="w-4.5 h-4.5 text-brand-crimson" />}
              <ChevronDown className="w-3 h-3" />
            </button>

            <AnimatePresence>
              {showThemeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-2xl"
                >
                  <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2 px-1">
                    Ambient Theme
                  </div>
                  <div className="flex flex-col gap-1 mb-3">
                    {[
                      { id: 'midnight', name: 'Midnight Void', color: 'bg-brand-purple', desc: 'Neon purple & deep obsidian' },
                      { id: 'nebula', name: 'Ender Nebula', color: 'bg-brand-crimson', desc: 'Crimson & twilight nebula' },
                      { id: 'sunrise', name: 'Overworld Sunrise', color: 'bg-brand-emerald', desc: 'Emerald green & amber gold' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id as ThemeMode);
                          addToast(`Ambient theme shifted to ${t.name}`, 'info');
                        }}
                        className={`w-full text-left p-1.5 rounded-lg hover:bg-white/5 flex items-center justify-between transition-colors ${
                          theme === t.id ? 'bg-white/5 border border-slate-800' : 'border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
                          <div className="flex flex-col">
                            <span className="text-xs font-sans font-semibold text-slate-200">{t.name}</span>
                            <span className="text-[9px] text-slate-500">{t.desc}</span>
                          </div>
                        </div>
                        {theme === t.id && <Check className="w-3.5 h-3.5 text-brand-cyan" />}
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2 px-1">
                    Environment Weather
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      { id: 'clear', name: 'Clear Sky', icon: Sun, color: 'text-brand-gold' },
                      { id: 'cyber-rain', name: 'Cyber Rain', icon: CloudRain, color: 'text-brand-blue' },
                      { id: 'cosmic-snow', name: 'Cosmic Snow', icon: Snowflake, color: 'text-brand-cyan' },
                      { id: 'portal-storm', name: 'Portal Storm', icon: CloudLightning, color: 'text-brand-crimson' }
                    ].map((w) => {
                      const Icon = w.icon;
                      return (
                        <button
                          key={w.id}
                          onClick={() => {
                            setWeather(w.id as WeatherType);
                            addToast(`Atmosphere set to ${w.name}`, 'info');
                          }}
                          className={`w-full text-left p-1.5 rounded-lg hover:bg-white/5 flex items-center justify-between transition-colors ${
                            weather === w.id ? 'bg-white/5 border border-slate-800' : 'border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${w.color}`} />
                            <span className="text-xs font-sans font-medium text-slate-200">{w.name}</span>
                          </div>
                          {weather === w.id && <Check className="w-3.5 h-3.5 text-brand-cyan" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messaging Terminal Panel */}
        <div ref={messagesRef} className="relative">
          <button
            onClick={() => {
              setShowMessages(!showMessages);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 hover:text-white text-slate-400 border border-slate-900 relative transition-all duration-300"
          >
            <Mail className="w-4.5 h-4.5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-crimson text-white text-[9px] font-mono font-bold flex items-center justify-center animate-bounce shadow-lg shadow-brand-crimson/50">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showMessages && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3.5 w-80 lg:w-96 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl"
              >
                {/* Panel Header */}
                <div className="p-4 border-b border-slate-900 bg-slate-950/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4.5 h-4.5 text-brand-purple" />
                    <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">Creator Chats</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-purple/10 text-brand-purple border border-brand-purple/20 animate-pulse">
                    ENCRYPTED NODE
                  </span>
                </div>

                {activeChatId ? (
                  /* Live chat conversation sub-pane */
                  <div className="flex flex-col h-[350px]">
                    <div className="p-3 border-b border-slate-900 bg-slate-900/20 flex items-center justify-between">
                      <button 
                        onClick={() => setActiveChatId(null)}
                        className="text-[10px] font-mono text-brand-cyan hover:underline"
                      >
                        ← Back to list
                      </button>
                      <span className="text-xs font-sans font-bold text-slate-200 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${activeChat?.avatarBg} animate-ping`} />
                        {activeChat?.sender}
                      </span>
                    </div>

                    {/* Conversations content list */}
                    <div className="flex-grow p-3 overflow-y-auto flex flex-col gap-2.5">
                      {activeChat?.messages.map((m, idx) => (
                        <div 
                          key={idx}
                          className={`max-w-[80%] p-2.5 rounded-xl text-xs font-sans leading-relaxed ${
                            m.sender === 'user'
                              ? 'bg-brand-purple/20 text-purple-100 border border-brand-purple/20 self-end'
                              : 'bg-slate-900 text-slate-200 border border-slate-800 self-start'
                          }`}
                        >
                          <p>{m.text}</p>
                          <span className="text-[8px] font-mono opacity-40 mt-1 block text-right">{m.time}</span>
                        </div>
                      ))}
                    </div>

                    {/* Chat messaging input */}
                    <div className="p-3 border-t border-slate-900 bg-slate-950/80 flex gap-2">
                      <input
                        type="text"
                        placeholder="Type message..."
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-grow h-9 bg-slate-900 border border-slate-800/80 rounded-lg text-xs px-3 focus:outline-none focus:border-brand-purple text-white"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="w-9 h-9 bg-gradient-to-tr from-brand-crimson to-brand-purple rounded-lg flex items-center justify-center text-white hover:brightness-110 transition-all shadow-md active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Conversation Threads index list */
                  <div className="max-h-[350px] overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No active conversations
                      </div>
                    ) : (
                      messages.map((thread) => (
                        <button
                          key={thread.id}
                          onClick={() => {
                            setActiveChatId(thread.id);
                            // Mark read
                            setMessages(prev => prev.map(m => m.id === thread.id ? { ...m, unread: false } : m));
                          }}
                          className={`w-full p-4 flex gap-3 text-left border-b border-slate-900/50 hover:bg-white/[0.02] transition-colors relative ${
                            thread.unread ? 'bg-brand-purple/5' : ''
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl ${thread.avatarBg} flex items-center justify-center text-lg shadow-md flex-shrink-0`}>
                            {thread.avatarEmoji}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="text-xs font-sans font-extrabold text-slate-200">{thread.sender}</span>
                              <span className="text-[9px] font-mono text-slate-500">{thread.date}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate pr-4 font-sans">{thread.lastMessage}</p>
                          </div>
                          {thread.unread && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-cyan shadow-glow shadow-brand-cyan" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications Hub */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowMessages(false);
              setShowProfileMenu(false);
            }}
            className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 hover:text-white text-slate-400 border border-slate-900 relative transition-all duration-300"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-cyan text-slate-950 text-[9px] font-mono font-bold flex items-center justify-center animate-pulse shadow-lg shadow-brand-cyan/50">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3.5 w-80 lg:w-96 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl"
              >
                {/* Notification Panel Header */}
                <div className="p-4 border-b border-slate-900 bg-slate-950/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4.5 h-4.5 text-brand-cyan" />
                    <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">Alert Logs</span>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[10px] font-mono text-brand-cyan hover:underline transition-all"
                    >
                      Clear Logs
                    </button>
                  )}
                </div>

                {/* Notifications lists */}
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No system notifications
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item.id)}
                        className={`p-4 flex gap-3 text-left border-b border-slate-900/50 hover:bg-white/[0.02] cursor-pointer transition-colors relative ${
                          !item.read ? 'bg-brand-cyan/5' : ''
                        }`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${
                          item.type === 'success' ? 'bg-brand-emerald' : item.type === 'alert' ? 'bg-brand-crimson' : 'bg-brand-blue'
                        }`} />
                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="text-xs font-sans font-bold text-slate-200 leading-tight">{item.title}</span>
                            <span className="text-[8px] font-mono text-slate-500 ml-2 whitespace-nowrap">{item.date}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{item.description}</p>
                        </div>
                        {!item.read && (
                          <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Info Pane & Dropdown */}
        <div ref={profileRef} className="relative">
          {user ? (
            <>
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                  setShowMessages(false);
                }}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 bg-slate-900/60 hover:bg-slate-900 border border-slate-900 rounded-xl transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-crimson flex items-center justify-center text-base shadow shadow-purple-500/20 overflow-hidden">
                  {user.avatarUrl && (user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://')) ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" referrerpolicy="no-referrer" />
                  ) : (
                    user.avatarUrl || (user.username?.charAt(0).toUpperCase() || '?')
                  )}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-sans font-extrabold text-slate-200 max-w-[90px] truncate">{user.username}</span>
                  <span className="text-[8px] font-mono text-brand-gold tracking-widest uppercase flex items-center gap-0.5">
                    <Award className="w-2.5 h-2.5" /> VIP
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3.5 w-72 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-2xl"
                  >
                    {/* Profile Header card info */}
                    <div className="flex items-center gap-3 mb-4 border-b border-slate-900 pb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-crimson flex items-center justify-center text-2xl shadow-lg overflow-hidden">
                        {user.avatarUrl && (user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://')) ? (
                          <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" referrerpolicy="no-referrer" />
                        ) : (
                          user.avatarUrl || (user.username?.charAt(0).toUpperCase() || '?')
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-sans font-extrabold text-slate-200">{user.username}</span>
                        <span className="text-[10px] font-mono text-brand-purple tracking-widest uppercase mt-0.5">{user.rank}</span>
                      </div>
                    </div>

                    {/* Level / Experience Progression */}
                    <div className="mb-4 bg-slate-900/40 border border-slate-900 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-1.5 text-xs font-sans font-semibold">
                        <span className="text-slate-400">Level {user.level}</span>
                        <span className="text-brand-cyan font-mono">{user.xp.toLocaleString()} / {user.nextXp.toLocaleString()} XP</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-[1px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(user.xp / user.nextXp) * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-brand-crimson via-brand-purple to-brand-cyan"
                        />
                      </div>
                    </div>

                    {/* Cyber Currency Balances */}
                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                      <div className="p-2.5 rounded-xl bg-slate-900/30 border border-slate-900 flex flex-col text-left">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">DL Token Balance</span>
                        <span className="text-xs font-mono font-bold text-slate-200 mt-1 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
                          {user.tokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/30 border border-slate-900 flex flex-col text-left">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Diamonds</span>
                        <span className="text-xs font-mono font-bold text-slate-200 mt-1 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                          {user.diamonds.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Acquired badges list */}
                    <div className="mb-4 text-left">
                      <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-2">Acquired Badges</div>
                      <div className="flex flex-wrap gap-1.5">
                        {user.badges.map((b, idx) => (
                          <span 
                            key={idx}
                            className="text-[9px] font-sans font-extrabold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300"
                          >
                            🛡️ {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* VIP Promotion Card */}
                    <div className="mb-4 p-3 bg-gradient-to-tr from-brand-gold/10 to-orange-500/10 border border-brand-gold/30 rounded-xl text-left relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] font-mono bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">⚡ PREMIUM ROLE</span>
                          <h4 className="text-xs font-sans font-black text-white mt-1">Get Lifetime VIP Status</h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-brand-gold">₹200</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">
                        Unlock verified badge, exclusive modules, & double telemetry XP multiplier!
                      </p>
                      <a 
                        href="https://discord.gg/ZqWZnZm7P6"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => addToast('Opening Discord gateway for VIP role purchase...', 'success')}
                        className="w-full h-8 mt-2.5 bg-gradient-to-r from-brand-gold to-orange-500 hover:brightness-110 active:scale-95 text-[10px] font-sans font-bold text-slate-950 rounded-lg flex items-center justify-center gap-1.5 transition-all uppercase tracking-wide"
                      >
                        Buy VIP via Discord
                      </a>
                    </div>

                    {/* Sign-out button */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setUser(null);
                          setShowProfileMenu(false);
                          addToast('Logged out of session', 'info');
                          supabase.auth.signOut().catch((e) => {
                            console.warn('Silent signout error:', e);
                          });
                        }}
                        className="w-full h-10 border border-slate-900 hover:border-brand-crimson/30 hover:bg-brand-crimson/5 rounded-xl text-xs font-sans font-bold text-slate-400 hover:text-brand-crimson transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Logout Session
                      </button>
                      <button
                        onClick={() => addToast('Sandbox database reset complete', 'info')}
                        className="w-full h-8 hover:bg-white/5 rounded-lg text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-all duration-300 flex items-center justify-center gap-1"
                      >
                        <Settings className="w-3 h-3 animate-spin" /> Reset Sandbox Database
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="h-10 px-4 rounded-xl bg-gradient-to-tr from-brand-crimson to-brand-purple hover:brightness-110 active:scale-95 text-xs font-sans font-bold text-white uppercase flex items-center gap-1.5 transition-all shadow-lg shadow-brand-crimson/15 select-none"
            >
              <UserCheck className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute top-20 left-0 right-0 bg-slate-950/98 border-b border-slate-900 backdrop-blur-2xl xl:hidden z-30 overflow-hidden flex flex-col p-6 shadow-2xl text-left"
          >
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">
                Navigation Matrix
              </span>
              {['home', 'marketplace', 'community', 'creators', 'support', 'dashboard'].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-sans font-bold tracking-wide transition-all capitalize flex items-center justify-between ${
                      isActive 
                        ? 'text-white bg-gradient-to-r from-brand-crimson/20 via-brand-purple/20 to-brand-blue/20 border border-brand-purple/30' 
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <span>{tab}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-glow shadow-brand-cyan" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile User Section */}
            {user ? (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-900 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-crimson flex items-center justify-center text-lg text-white font-bold select-none shadow">
                    {user.avatarUrl && (user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://')) ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      user.avatarUrl || (user.username?.charAt(0).toUpperCase() || '?')
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-sans font-black text-white">{user.username}</span>
                    <span className="text-[9px] font-mono text-brand-cyan uppercase tracking-wider">{user.rank}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUser(null);
                    setIsMobileMenuOpen(false);
                    addToast('Logged out of session', 'info');
                    supabase.auth.signOut().catch((e) => {
                      console.warn('Silent signout error:', e);
                    });
                  }}
                  className="w-full h-9 bg-brand-crimson/10 hover:bg-brand-crimson/20 border border-brand-crimson/20 rounded-xl text-[10px] font-mono text-brand-crimson font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  Logout Session
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full h-10 bg-gradient-to-tr from-brand-crimson to-brand-purple hover:brightness-110 text-xs font-sans font-bold text-white uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg"
                >
                  <UserCheck className="w-4 h-4" /> Sign In / Register
                </button>
              </div>
            )}

            {/* Quick stats / info for mobile */}
            <div className="mt-6 pt-6 border-t border-slate-900 flex items-center justify-between">
              <div>
                <span className="text-[8px] font-mono text-brand-purple tracking-widest block uppercase">SYS_VERSION</span>
                <span className="text-xs text-slate-400 font-sans font-bold">DARKLEAKER</span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-mono text-brand-cyan tracking-widest block uppercase">DATABASE_STATUS</span>
                <span className="text-xs text-emerald-400 font-sans font-bold flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> ONLINE
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
