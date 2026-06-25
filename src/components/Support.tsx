import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, MessageSquare, ChevronDown, ChevronUp, Search, 
  HelpCircle, MessageCircle, FileText, Send, CheckCircle2, 
  Settings, Clock, Sparkles, BookOpen, AlertCircle, ShieldAlert,
  Paperclip, Activity, Flame, ShieldCheck, Check, Info
} from 'lucide-react';
import { SupportTicket, FREQUENT_QUESTIONS, User } from '../types';
import { 
  addSupportTicket, addSupportMessage, closeSupportTicket,
  fetchTicketLogs, addTicketLog, fetchTicketAttachments, addTicketAttachment,
  updateUserProfileStats
} from '../lib/supabase';
import { checkRateLimit } from '../lib/rateLimit';

interface SupportProps {
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  addToast: (message: string, type: 'success' | 'info' | 'error' | 'premium') => void;
}

export default function Support({
  tickets,
  setTickets,
  user,
  setUser,
  addToast
}: SupportProps) {
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [searchFaqQuery, setSearchFaqQuery] = useState('');
  const [expandedFaqIdx, setExpandedFaqIdx] = useState<number | null>(null);
  
  // Create ticket states
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState<SupportTicket['category']>('Bug Report');

  // Active typing chat
  const [typedChat, setTypedChat] = useState('');

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  // Ticket attachments and logs states
  const [activeTicketLogs, setActiveTicketLogs] = useState<any[]>([]);
  const [activeTicketAttachments, setActiveTicketAttachments] = useState<any[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isSyncingDiscord, setIsSyncingDiscord] = useState(false);

  // Load ticket logs & attachments on change
  useEffect(() => {
    if (activeTicketId) {
      fetchTicketLogs(activeTicketId).then(setActiveTicketLogs);
      fetchTicketAttachments(activeTicketId).then(setActiveTicketAttachments);
    } else {
      setActiveTicketLogs([]);
      setActiveTicketAttachments([]);
    }
  }, [activeTicketId]);

  // Filter FAQ accordions
  const filteredFaqs = FREQUENT_QUESTIONS.filter(faq => 
    faq.q.toLowerCase().includes(searchFaqQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchFaqQuery.toLowerCase())
  );

  // Handle opening a new ticket
  const handleOpenTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      addToast('Authenticate your profile to submit support tickets!', 'error');
      return;
    }

    if (!ticketTitle.trim()) {
      addToast('Ticket summary cannot be empty.', 'error');
      return;
    }

    // Ticket Creation Rate Limiting (Enterprise Hardening)
    const rateLimitCheck = await checkRateLimit('ticket', user.email);
    if (!rateLimitCheck.allowed) {
      addToast(rateLimitCheck.message || 'Ticket creation rate limited.', 'error');
      return;
    }

    const ticketId = `DL-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTicket: SupportTicket = {
      id: ticketId,
      title: ticketTitle,
      category: ticketCategory,
      status: 'OPEN',
      date: new Date().toISOString(),
      messages: [
        {
          id: 'msg-init',
          sender: 'DARKLEAKER Bot',
          avatarBg: 'bg-brand-crimson',
          avatarEmoji: '🔮',
          text: `Greetings ${user.username}! Thank you for opening a support ticket regarding "${ticketTitle}". A verified specialist or AI moderator has been dispatched to this node. Please type your logs or describe the situation in detail.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    try {
      await addSupportTicket(newTicket, user.email || 'anonymous@darkleaker.net');
      await addTicketLog(ticketId, `Ticket created with category "${ticketCategory}"`, user.username);
      
      const updatedLogs = await fetchTicketLogs(ticketId);
      setActiveTicketLogs(updatedLogs);

      setTickets(prev => [newTicket, ...prev]);
      setIsCreatingTicket(false);
      setTicketTitle('');
      setActiveTicketId(ticketId);
      addToast(`Support ticket ${ticketId} initialized!`, 'success');
    } catch (err: any) {
      console.error(err);
      addToast(`Failed to initialize ticket on backend: ${err.message}`, 'error');
    }
  };

  // Chat message send handler with dynamic automated support response
  const handleSendChatMessage = async () => {
    if (!user) {
      addToast('Authenticate your profile to reply to support tickets!', 'error');
      return;
    }
    if (!typedChat.trim() || !activeTicketId) return;

    const userMsgId = `chat-${Date.now()}`;
    const messageText = typedChat;

    const userMsgObj = {
      sender: user.username,
      avatarBg: 'bg-gradient-to-tr from-brand-purple to-brand-crimson',
      avatarEmoji: user.avatarUrl,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      await addSupportMessage(activeTicketId, userMsgObj);
      await addTicketLog(activeTicketId, `User sent support query`, user.username);

      setTickets(prev => prev.map(t => {
        if (t.id === activeTicketId) {
          return {
            ...t,
            status: 'IN_PROGRESS',
            messages: [
              ...t.messages,
              {
                id: userMsgId,
                ...userMsgObj
              }
            ]
          };
        }
        return t;
      }));

      setTypedChat('');

      const updatedLogs = await fetchTicketLogs(activeTicketId);
      setActiveTicketLogs(updatedLogs);

      setTimeout(async () => {
        let botResponse = '';
        const textLower = messageText.toLowerCase();

        if (textLower.includes('download') || textLower.includes('purchase') || textLower.includes('token') || textLower.includes('price')) {
          botResponse = "I have checked our transaction registry ledger. Your license tokens are verified. If the zip download link fails, please logout, delete cookies, clear cache, and try initiating the download from the marketplace card panel again.";
        } else if (textLower.includes('bug') || textLower.includes('crash') || textLower.includes('error') || textLower.includes('java') || textLower.includes('fail')) {
          botResponse = "Thank you for the error trace and logs. I have queued this debug pattern directly to our automated compiler debugger. If you are running Java 17+, please verify that you are using paper-build v2.1 configs.";
        } else if (textLower.includes('appeal') || textLower.includes('ban') || textLower.includes('block')) {
          botResponse = "Your appeal application has been successfully filed in our staff telemetry portal. Our core administrators will verify your server login logs. Expect an update on this node within 4-12 hours.";
        } else {
          botResponse = "Acknowledged. I have logged your diagnostic description. An elite platform moderator has been alerted and will review these specifications. If you have additional screenshot logs, please drop them below.";
        }

        const botMsgObj = {
          sender: 'DARKLEAKER Bot',
          avatarBg: 'bg-brand-crimson',
          avatarEmoji: '🔮',
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        await addSupportMessage(activeTicketId, botMsgObj);
        await addTicketLog(activeTicketId, `DARKLEAKER Bot replied to user support thread`, 'DARKLEAKER Bot');

        setTickets(prev => prev.map(t => {
          if (t.id === activeTicketId) {
            return {
              ...t,
              status: 'WAITING',
              messages: [
                ...t.messages,
                {
                  id: `bot-${Date.now()}`,
                  ...botMsgObj
                }
              ]
            };
          }
          return t;
        }));

        const finalLogs = await fetchTicketLogs(activeTicketId);
        setActiveTicketLogs(finalLogs);

        addToast(`New support reply synced on ticket ${activeTicketId}`, 'info');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      addToast(`Failed to send message: ${err.message}`, 'error');
    }
  };

  // Close ticket toggle
  const handleCloseTicket = async (id: string) => {
    try {
      await closeSupportTicket(id);
      await addTicketLog(id, 'Ticket closed', user?.username || 'System');
      
      const updatedLogs = await fetchTicketLogs(id);
      setActiveTicketLogs(updatedLogs);

      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'CLOSED' as const } : t));
      addToast(`Support ticket ${id} flagged as CLOSED`, 'info');
    } catch (err: any) {
      console.error(err);
      addToast(`Failed to close ticket: ${err.message}`, 'error');
    }
  };

  // Handle attachment file selection upload
  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !activeTicketId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    addToast(`Processing file attachment "${file.name}"...`, 'info');

    try {
      // Format file size
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const sizeStr = `${sizeMB} MB`;

      // Simulating secure cloud upload storage
      const mockStorageUrl = `https://storage.darkleaker.net/attachments/${activeTicketId}/${encodeURIComponent(file.name)}`;

      await addTicketAttachment(activeTicketId, file.name, file.type || 'text/plain', sizeStr, mockStorageUrl);
      await addTicketLog(activeTicketId, `Attached file "${file.name}" (${sizeStr})`, user.username);

      // Reload attachments and logs
      const updatedAttachments = await fetchTicketAttachments(activeTicketId);
      const updatedLogs = await fetchTicketLogs(activeTicketId);
      setActiveTicketAttachments(updatedAttachments);
      setActiveTicketLogs(updatedLogs);

      addToast(`Attached file "${file.name}" to ticket node successfully!`, 'success');
    } catch (err: any) {
      console.error(err);
      addToast(`File attachment upload failed: ${err.message}`, 'error');
    } finally {
      setIsUploadingAttachment(false);
      // Reset input value
      if (e.target) e.target.value = '';
    }
  };

  // Handle Discord instant ticket sync
  const handleSyncDiscord = async () => {
    if (!user || !activeTicketId) return;
    setIsSyncingDiscord(true);
    addToast('Synchronizing ticket node with Discord support channel...', 'info');

    try {
      // Simulating a real multi-step webhook dispatch sequence
      await new Promise(resolve => setTimeout(resolve, 800));
      addToast('Authenticating with Discord developer guild...', 'info');
      await new Promise(resolve => setTimeout(resolve, 800));
      addToast('Sending secure payload to staff webhook logger...', 'info');
      await new Promise(resolve => setTimeout(resolve, 800));

      await addTicketLog(activeTicketId, 'Synced ticket data to Discord #staff-support channel', 'Discord Bot');
      
      const updatedLogs = await fetchTicketLogs(activeTicketId);
      setActiveTicketLogs(updatedLogs);

      addToast('Successfully mirrored ticket to Discord! Core team has been pinger-notified.', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(`Discord synchronization node failed: ${err.message}`, 'error');
    } finally {
      setIsSyncingDiscord(false);
    }
  };

  return (
    <div id="support-section" className="w-full max-w-7xl mx-auto py-10 px-4 text-left grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: ACTIVE SUPPORT TICKETS DASHBOARD (Column 1-2) */}
      <div className="lg:col-span-2 flex flex-col gap-8">
        
        <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-900 z-10 relative">
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-5 h-5 text-brand-purple" />
              <div>
                <h3 className="text-lg font-display font-bold text-slate-200">Support Ticket Center</h3>
                <p className="text-xs text-slate-500">Submit appeals, bug logs, and verify licenses with agents.</p>
              </div>
            </div>

            <button
              onClick={() => setIsCreatingTicket(!isCreatingTicket)}
              className="h-10 px-4 rounded-xl bg-gradient-to-tr from-brand-crimson to-brand-purple hover:brightness-110 text-xs font-sans font-bold text-white uppercase flex items-center gap-1.5 transition-all shadow-lg shadow-brand-crimson/15 select-none"
            >
              <Plus className="w-4 h-4" />
              {isCreatingTicket ? 'Browse Dashboard' : 'Open Support Ticket'}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isCreatingTicket ? (
              /* Create support ticket form criteria */
              <motion.div
                key="create-ticket-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-1 z-10 relative"
              >
                <form onSubmit={handleOpenTicketSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Ticket Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value as any)}
                      className="h-11 bg-slate-900 border border-slate-800 focus:border-brand-purple rounded-xl text-xs px-3.5 focus:outline-none text-white capitalize"
                    >
                      <option value="Bug Report">🐜 Bug Report</option>
                      <option value="Appeals">🛡️ Ban Appeal</option>
                      <option value="Marketplace Inquiry">🛒 Marketplace Inquiry</option>
                      <option value="Creator Verification">🏗️ Creator Verification</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Brief Summary Topic</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SQLite database pool connection leak crash logs"
                      value={ticketTitle}
                      onChange={(e) => setTicketTitle(e.target.value)}
                      className="h-11 bg-slate-900 border border-slate-800 focus:border-brand-purple rounded-xl text-xs px-4 focus:outline-none text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-900">
                    <button
                      type="button"
                      onClick={() => setIsCreatingTicket(false)}
                      className="h-10 px-4 border border-slate-850 hover:bg-white/5 text-xs font-sans font-bold text-slate-400 rounded-xl uppercase transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-10 px-5 bg-gradient-to-r from-brand-crimson to-brand-purple hover:brightness-110 text-xs font-sans font-bold text-white rounded-xl uppercase transition-all"
                    >
                      Deploy Support Node
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : activeTicketId && activeTicket ? (
              /* Live ticket conversations chat */
              <motion.div
                key="live-ticket-chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[520px] z-10 relative"
              >
                {/* Left Columns (2/3): Chat Messages and Entry Field */}
                <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
                  <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-2xl flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTicketId(null)}
                        className="text-xs font-mono text-brand-cyan hover:underline flex items-center gap-1"
                      >
                        ← Back
                      </button>
                      <div className="h-4 w-[1px] bg-slate-800" />
                      <span className="text-xs font-sans font-bold text-slate-200 truncate max-w-[150px] sm:max-w-none">
                        Ticket {activeTicket.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {activeTicket.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleCloseTicket(activeTicket.id)}
                          className="h-7 px-3 border border-brand-crimson/30 hover:bg-brand-crimson/10 text-brand-crimson rounded-lg text-[9px] font-mono uppercase transition-all"
                        >
                          Close Ticket
                        </button>
                      )}
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        activeTicket.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' :
                        activeTicket.status === 'CLOSED' ? 'bg-red-500/10 text-red-400' :
                        activeTicket.status === 'IN_PROGRESS' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {activeTicket.status}
                      </span>
                    </div>
                  </div>

                  {/* Chats messages streams scrolling view */}
                  <div className="flex-grow overflow-y-auto p-4 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col gap-3 mb-3">
                    {activeTicket.messages.map((m) => (
                      <div 
                        key={m.id}
                        className={`max-w-[85%] p-3 rounded-2xl text-xs font-sans leading-relaxed flex flex-col gap-1 ${
                          user && m.sender === user.username
                            ? 'bg-brand-purple/10 text-purple-100 border border-brand-purple/20 self-end'
                            : 'bg-slate-900/60 text-slate-200 border border-slate-900 self-start'
                        }`}
                      >
                        <div className="flex justify-between items-center gap-4 text-[9px] font-mono opacity-50 mb-1">
                          <span className="font-bold flex items-center gap-1.5">
                            <span className="w-4.5 h-4.5 rounded-md overflow-hidden inline-flex items-center justify-center bg-slate-800 text-[10px] flex-shrink-0">
                              {m.avatarEmoji && (m.avatarEmoji.startsWith('http://') || m.avatarEmoji.startsWith('https://')) ? (
                                <img src={m.avatarEmoji} alt={m.sender} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                m.avatarEmoji || '👤'
                              )}
                            </span>
                            <span>{m.sender}</span>
                          </span>
                          <span>{m.time}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chat message send inputs */}
                  {activeTicket.status === 'CLOSED' ? (
                    <div className="p-3 bg-red-950/10 border border-brand-crimson/15 rounded-2xl text-center text-[11px] text-red-300 font-sans">
                      This support node has been closed.
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type diagnostic message or query..."
                        value={typedChat}
                        onChange={(e) => setTypedChat(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        className="flex-grow h-11 bg-slate-900 border border-slate-850 focus:border-brand-purple rounded-xl text-xs px-4 focus:outline-none text-white placeholder-slate-600"
                      />
                      
                      {/* File attachment upload trigger */}
                      <input
                        type="file"
                        id="ticket-file-input"
                        className="hidden"
                        onChange={handleAttachmentChange}
                        disabled={isUploadingAttachment}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('ticket-file-input')?.click()}
                        disabled={isUploadingAttachment}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border text-slate-400 hover:text-white transition-all ${
                          isUploadingAttachment 
                            ? 'bg-slate-900 border-slate-850 opacity-50 cursor-not-allowed animate-pulse' 
                            : 'bg-slate-900 border-slate-850 hover:border-slate-700 active:scale-95'
                        }`}
                        title="Attach crash report or screenshot"
                      >
                        <Paperclip className="w-4.5 h-4.5" />
                      </button>

                      <button
                        onClick={handleSendChatMessage}
                        className="w-11 h-11 bg-gradient-to-tr from-brand-crimson to-brand-purple rounded-xl flex items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all shadow-md"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Column (1/3): Attachments, Activity Log & Webhook Integrations */}
                <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
                  {/* Discord Support integration sync panel */}
                  <div className="bg-indigo-950/20 border border-indigo-900/35 rounded-2xl p-4 text-left relative overflow-hidden flex-shrink-0">
                    <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest block">Core Integration</span>
                    <h4 className="text-xs font-sans font-black text-slate-200 mt-1">Discord Support Sync</h4>
                    <p className="text-[10px] text-indigo-200/70 leading-relaxed font-sans mt-1">
                      Mirror this ticket summary & active status to your server moderators in our Discord channel.
                    </p>

                    <button
                      type="button"
                      onClick={handleSyncDiscord}
                      disabled={isSyncingDiscord}
                      className={`w-full h-8 bg-brand-blue hover:brightness-110 text-[9px] font-sans font-bold text-white uppercase rounded-lg mt-3 flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        isSyncingDiscord ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSyncingDiscord ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-3.5 h-3.5" />
                          <span>Sync Ticket to Discord</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Attachments view */}
                  <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-4 flex flex-col flex-shrink-0 min-h-[120px]">
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-900/60">
                      <Paperclip className="w-3.5 h-3.5 text-brand-cyan" />
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Ticket Attachments</span>
                    </div>

                    <div className="flex-grow overflow-y-auto max-h-[110px] flex flex-col gap-1.5 pr-0.5">
                      {activeTicketAttachments.length === 0 ? (
                        <span className="text-[9px] text-slate-600 font-sans italic my-auto text-center">No crash reports or logs attached.</span>
                      ) : (
                        activeTicketAttachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-slate-850 rounded-xl flex items-center justify-between text-left group transition-all"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 group-hover:text-brand-cyan transition-colors" />
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-[9px] font-sans font-bold text-slate-300 truncate max-w-[110px]">{att.file_name}</span>
                                <span className="text-[7.5px] font-mono text-slate-500">{att.file_size}</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity">view</span>
                          </a>
                        ))
                      )}
                    </div>
                  </div>

                  {/* System Event Logs Activity Telemetry */}
                  <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-4 flex flex-col flex-grow min-h-[160px]">
                    <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-slate-900/60">
                      <Activity className="w-3.5 h-3.5 text-brand-purple" />
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Activity Telemetry</span>
                    </div>

                    <div className="flex-grow overflow-y-auto max-h-[140px] flex flex-col gap-2.5 pr-0.5">
                      {activeTicketLogs.length === 0 ? (
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-600 font-sans italic my-auto justify-center">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span>Loading event timeline...</span>
                        </div>
                      ) : (
                        activeTicketLogs.map((log) => (
                          <div key={log.id} className="flex gap-2 text-left relative pl-1">
                            <div className="w-[1px] bg-slate-800 absolute left-[4.5px] top-2.5 bottom-[-14px] last:hidden" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-brand-purple flex-shrink-0 z-10 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-[9px] font-sans text-slate-300 font-medium leading-tight">{log.action}</span>
                              <div className="flex items-center gap-1 text-[7.5px] font-mono text-slate-500 mt-0.5">
                                <span>by {log.performed_by}</span>
                                <span>•</span>
                                <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Support center dashboard tickets list */
              <motion.div key="tickets-dashboard" className="flex flex-col gap-3 z-10 relative">
                {tickets.length === 0 ? (
                  <div className="text-center p-12 text-slate-500 text-xs font-sans">
                    No active support nodes initialized. Use "Open Support Ticket" above.
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveTicketId(t.id)}
                      className="p-4 bg-slate-900/20 hover:bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                          <FileText className="w-4.5 h-4.5" />
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-sans font-black text-slate-200">{t.title}</span>
                            <span className="text-[9px] font-mono text-slate-500">#{t.id}</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 mt-1">Category: {t.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          t.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' :
                          t.status === 'CLOSED' ? 'bg-red-500/10 text-red-400' :
                          t.status === 'IN_PROGRESS' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {t.status}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* FAQ COLLAPSIBLE ACCORDION LIST */}
        <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl text-left">
          <div className="flex items-center gap-2.5 mb-5 border-b border-slate-900 pb-4">
            <HelpCircle className="w-5 h-5 text-brand-cyan" />
            <div>
              <h3 className="text-lg font-display font-bold text-slate-200">Knowledge Base / FAQs</h3>
              <p className="text-xs text-slate-500">Instantly browse core solutions compiled by administrators.</p>
            </div>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search solutions database..."
              value={searchFaqQuery}
              onChange={(e) => setSearchFaqQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-900/60 border border-slate-800/80 focus:border-brand-purple rounded-xl text-xs font-sans focus:outline-none text-white placeholder-slate-600 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            {filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedFaqIdx === idx;
              return (
                <div 
                  key={idx}
                  className="border border-slate-900 rounded-2xl overflow-hidden bg-slate-900/10 hover:bg-slate-900/20 transition-all"
                >
                  <button
                    onClick={() => setExpandedFaqIdx(isExpanded ? null : idx)}
                    className="w-full p-4 flex justify-between items-center text-xs font-sans font-bold text-slate-200 hover:text-white transition-colors text-left focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="px-4 pb-4 text-xs text-slate-400 font-sans leading-relaxed border-t border-slate-950 pt-2.5 bg-slate-950/20">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* RIGHT SIDEBAR: DISCORD SUPPORT CHANNELS (Column 3) */}
      <div className="flex flex-col gap-6">
        
        {/* Support Service SLA Card */}
        <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-5 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
          
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mb-4">Support Response Matrix</span>
          
          <div className="flex flex-col gap-4 text-left">
            {[
              { l: 'Priority Bug Report', t: 'Verified Developers', s: '< 15 Mins Response' },
              { l: 'Ban Appeals', t: 'Lead Administrators', s: '< 1 Hour Response' },
              { l: 'Licensing Inquiry', t: 'Finance Node Agents', s: 'Immediate Response' }
            ].map((sla, idx) => (
              <div key={idx} className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl">
                <span className="text-[10px] font-sans font-extrabold text-slate-200">{sla.l}</span>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mt-1">
                  <span>Handler: {sla.t}</span>
                  <span className="text-brand-cyan font-bold">{sla.s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discord instant ticketing widget */}
        <div className="bg-gradient-to-tr from-indigo-950/75 to-indigo-900/40 border border-indigo-900/50 rounded-3xl p-5 backdrop-blur-2xl text-left relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col">
            <span className="text-[9px] font-mono text-brand-cyan uppercase tracking-widest">Platform Discord Direct</span>
            <h4 className="text-sm font-sans font-black text-white mt-0.5">Discord Ticketing Hub</h4>
            <p className="text-xs text-indigo-200 leading-relaxed font-sans mt-1.5">
              Prefer Discord chat? Click below to instantly spawn an active Discord ticket channel linked to our server moderators.
            </p>

            <button
              onClick={() => {
                addToast('Spawning Discord ticket module...', 'success');
                const w = window.open('https://discord.gg/ZqWZnZm7P6', '_blank');
                if (w) w.focus();
              }}
              className="w-full h-10 bg-brand-blue hover:brightness-110 text-[10px] font-sans font-bold text-white uppercase rounded-xl mt-4 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-blue/15"
            >
              Spawn Discord Ticket
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
