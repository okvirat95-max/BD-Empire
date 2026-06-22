import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, UserX, UserCheck, Trash2, Check, X, AlertTriangle, Terminal, RefreshCw, Layers, PlusCircle, Volume2, ShieldAlert } from 'lucide-react';
import { Profile, Resource, AuditLog, Announcement } from '../types';
import { 
  getResources, 
  getAllProfiles, 
  getAuditLogs, 
  getAnnouncements, 
  updateResource, 
  deleteResource, 
  updateProfileStatus, 
  createAnnouncement, 
  deleteAnnouncement,
  subscribeToRealtime
} from '../lib/db';

interface AdminPanelProps {
  currentProfile: Profile | null;
  setPath: (path: string) => void;
}

export default function AdminPanel({ currentProfile, setPath }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'resources' | 'users' | 'logs' | 'announcements' | 'owner'>('resources');
  const [loading, setLoading] = useState(true);

  // Data arrays
  const [resources, setResources] = useState<Resource[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Rejection reason form
  const [rejectingResourceId, setRejectingResourceId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Ban user form
  const [banningProfileId, setBanningProfileId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');

  // Announcement form
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnType, setNewAnnType] = useState<'info' | 'warning' | 'success' | 'alert'>('info');

  const loadAdminDatabase = async () => {
    setLoading(true);
    try {
      // 1. Fetch resources (include all pending/approved/rejected)
      const res = await getResources({ includeUnapproved: true });
      setResources(res);

      // 2. Fetch all profiles
      const profs = await getAllProfiles();
      setProfiles(profs);

      // 3. Fetch audit logs
      const logs = await getAuditLogs();
      setAuditLogs(logs);

      // 4. Fetch announcements
      const anns = await getAnnouncements();
      setAnnouncements(anns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isAdminOrOwner = currentProfile?.role === 'admin' || currentProfile?.role === 'owner';
    if (isAdminOrOwner) {
      loadAdminDatabase();

      // Hook real-time trigger sync so modifications display instantly
      const unsub = subscribeToRealtime('resources', () => loadAdminDatabase());
      const unsubProfiles = subscribeToRealtime('profiles', () => loadAdminDatabase());
      const unsubLogs = subscribeToRealtime('audit_logs', () => loadAdminDatabase());
      const unsubAnns = subscribeToRealtime('announcements', () => loadAdminDatabase());

      return () => {
        unsub();
        unsubProfiles();
        unsubLogs();
        unsubAnns();
      };
    }
  }, [currentProfile]);

  // Auth block
  const isAdminOrOwner = currentProfile?.role === 'admin' || currentProfile?.role === 'owner';
  if (!isAdminOrOwner) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-6">
        <ShieldAlert className="w-12 h-12 text-primary mx-auto glow-red animate-pulse" />
        <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider">RESTRICTED CONTROL SECTOR</h2>
        <p className="text-gray-400 font-sans text-sm">
          Access to this terminal is restricted strictly to platform owners or authorized administrators. 
          Unlisted network telemetry actions are monitored.
        </p>
        <button
          onClick={() => setPath('#/')}
          className="px-6 py-2 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#1f1f1f] font-sans font-bold text-xs uppercase"
        >
          Return Home
        </button>
      </div>
    );
  }

  // Action methods
  const handleApprove = async (id: string) => {
    try {
      const updated = await updateResource(id, { status: 'approved', rejection_reason: null });
      if (updated) {
        alert('Minecraft resource published and approved on marketplace.');
        loadAdminDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenReject = (id: string) => {
    setRejectingResourceId(id);
    setRejectionReason('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingResourceId || !rejectionReason.trim()) return;

    try {
      const updated = await updateResource(rejectingResourceId, { 
        status: 'rejected', 
        rejection_reason: rejectionReason.trim() 
      });
      if (updated) {
        setRejectingResourceId(null);
        rejectionReason && alert('Resource rejection status filed successfully.');
        loadAdminDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteResource = async (id: string, name: string) => {
    const confirm = window.confirm(`Identify Action: Permanent deletion of "${name}"?`);
    if (!confirm) return;

    try {
      const succeeded = await deleteResource(id);
      if (succeeded) {
        alert('Permanent record purge complete.');
        loadAdminDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFeatured = async (id: string, currentlyFeatured: boolean) => {
    try {
      const updated = await updateResource(id, { is_featured: !currentlyFeatured });
      if (updated) {
        alert(updated.is_featured ? 'Asset pinned inside featured lists.' : 'Asset unpinned from featured listings.');
        loadAdminDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePremiumUser = async (profileId: string, currentlyPremium: boolean) => {
    try {
      const updated = await updateProfileStatus(profileId, { is_premium: !currentlyPremium });
      if (updated) {
        alert(updated.is_premium ? 'Premium seller license issued successfully.' : 'Premium seller status revoked.');
        loadAdminDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBan = (id: string) => {
    setBanningProfileId(id);
    setBanReason('');
  };

  const handleConfirmBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banningProfileId || !banReason.trim()) return;

    try {
      const updated = await updateProfileStatus(banningProfileId, { 
        is_banned: true, 
        banned_reason: banReason.trim() 
      });
      if (updated) {
        setBanningProfileId(null);
        alert('User account ban state activated.');
        loadAdminDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnban = async (id: string) => {
    try {
      const updated = await updateProfileStatus(id, { is_banned: false, banned_reason: null });
      if (updated) {
        alert('Account ban revoked and active clearances reinstated.');
        loadAdminDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    try {
      const added = await createAnnouncement({
        title: newAnnTitle.trim().toUpperCase(),
        content: newAnnContent.trim(),
        type: newAnnType
      });
      if (added) {
        setNewAnnTitle('');
        setNewAnnContent('');
        alert('Global announcement broadcasted to client feeds.');
        loadAdminDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const succeeded = await deleteAnnouncement(id);
      if (succeeded) {
        alert('Announcement feed notice cleaned.');
        loadAdminDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 animate-fade-in font-sans">
      {/* 1. Page Title */}
      <div className="border-b border-[#111] pb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary glow-red" />
          <div>
            <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight">OPERATIONS COMMAND</h1>
            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">DARKLEAKER DIRECTORY SECURITY UNIT</p>
          </div>
        </div>
      </div>

      {/* 2. Admin Segment Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#1f1f1f] overflow-x-auto pb-2 scrollbar-none font-mono">
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border-b-2 ${activeTab === 'resources' ? 'border-primary text-primary bg-[#111111]/30' : 'border-transparent text-gray-500 hover:text-white'}`}
        >
          Resource Moderation ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border-b-2 ${activeTab === 'users' ? 'border-primary text-primary bg-[#111111]/30' : 'border-transparent text-gray-500 hover:text-white'}`}
        >
          Profiles & Premium ({profiles.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border-b-2 ${activeTab === 'logs' ? 'border-primary text-primary bg-[#111111]/30' : 'border-transparent text-gray-500 hover:text-white'}`}
        >
          Security Audit Logs ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border-b-2 ${activeTab === 'announcements' ? 'border-primary text-primary bg-[#111111]/30' : 'border-transparent text-gray-500 hover:text-white'}`}
        >
          Announcements Control
        </button>
        {currentProfile?.role === 'owner' && (
          <button
            onClick={() => setActiveTab('owner')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border-b-2 ${activeTab === 'owner' ? 'border-amber-500 text-amber-500 bg-[#111111]/30 animate-pulse' : 'border-transparent text-amber-500/50 hover:text-amber-500'}`}
          >
            ✧ Owner Dashboard ✧
          </button>
        )}
      </div>

      {/* 3. Section Render Area */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* TAB 1: RESOURCE MODERATION */}
          {activeTab === 'resources' && (
            <div className="bg-[#111111]/40 border border-[#1f1f1f] rounded-lg p-6 space-y-6">
              <h3 className="font-display font-black text-sm text-white uppercase tracking-widest border-b border-[#1f1f1f] pb-3">
                PENDING & RUNNING MARKET RESOURCE LISTINGS
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] text-gray-500 uppercase pb-2">
                      <th className="py-3 px-4">Title & Mediafire URL</th>
                      <th className="py-3 px-4">Author Info</th>
                      <th className="py-3 px-4">Audit Status</th>
                      <th className="py-3 px-4 text-right">Moderations Panel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((res) => (
                      <tr key={res.id} className="border-b border-[#111] hover:bg-[#111111]/20 transition-colors">
                        <td className="py-4 px-4 font-sans max-w-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-sm leading-tight">{res.title}</span>
                            <span className="text-[10px] text-gray-500 mt-1">Category: <b className="uppercase">{res.category}</b> | ID: {res.id.slice(0,8)}...</span>
                            <a href={res.mediafire_url} target="_blank" rel="noreferrer" className="text-red-500 text-[10px] mt-1 truncate hover:underline block max-w-xs">
                              {res.mediafire_url}
                            </a>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-sans">
                          {res.profiles ? (
                            <div className="flex items-center gap-1.5 text-xs text-gray-300">
                              <img src={res.profiles.avatar_url || ''} alt="av" className="w-4 h-4 rounded-full" />
                              <span className="font-medium">{res.profiles.username}</span>
                            </div>
                          ) : (
                            <span className="text-gray-600">Guest</span>
                          )}
                        </td>
                        <td className="py-2 px-4 whitespace-nowrap">
                          {res.status === 'approved' ? (
                            <span className="px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/20 rounded uppercase text-[9px] font-bold">Approved</span>
                          ) : res.status === 'pending' ? (
                            <span className="px-2 py-0.5 bg-amber-500/15 text-amber-500 border border-amber-500/20 rounded uppercase text-[9px] font-bold">Pending Audit</span>
                          ) : (
                            <div className="flex flex-col gap-0.5 max-w-xs text-red-500">
                              <span className="px-2 py-0.5 bg-red-500/15 text-red-500 border border-red-500/20 rounded uppercase text-[9px] font-bold w-fit">Rejected</span>
                              <span className="text-[9px] text-gray-500 font-sans line-clamp-1">{res.rejection_reason}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Fast Pin feature */}
                            <button
                              onClick={() => handleToggleFeatured(res.id, res.is_featured)}
                              className={`p-1 px-1.5 rounded border text-[10px] transition-colors ${res.is_featured ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'border-gray-800 text-gray-500 hover:text-white'}`}
                              title={res.is_featured ? 'Unfeature item' : 'Feature item'}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>

                            {/* Approve */}
                            {res.status !== 'approved' && (
                              <button
                                onClick={() => handleApprove(res.id)}
                                className="p-1 px-1.5 border border-green-900 bg-green-950/20 text-green-400 rounded hover:bg-green-500 hover:text-black transition-colors flex items-center text-[10px] font-bold"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}

                            {/* Reject */}
                            {res.status !== 'rejected' && (
                              <button
                                onClick={() => handleOpenReject(res.id)}
                                className="p-1 px-1.5 border border-amber-900 bg-amber-950/20 text-amber-400 rounded hover:bg-amber-500 hover:text-black transition-colors flex items-center text-[10px]"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteResource(res.id, res.title)}
                              className="p-1 px-1.5 border border-red-900 bg-red-950/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILES & PREMIUM SECTOR */}
          {activeTab === 'users' && (
            <div className="bg-[#111111]/40 border border-[#1f1f1f] rounded-lg p-6 space-y-6">
              <h3 className="font-display font-black text-sm text-white uppercase tracking-widest border-b border-[#1f1f1f] pb-3">
                USER PROFILE INDEX & PREMIUM PERMISSIONS MANAGEMENT
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] text-gray-500 uppercase pb-2">
                      <th className="py-3 px-4">Avatar & Username</th>
                      <th className="py-3 px-4">Premium Seller Node</th>
                      <th className="py-3 px-4">Status Class</th>
                      <th className="py-3 px-4 text-right">Administrative Clearance actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((prof) => (
                      <tr key={prof.id} className="border-b border-[#111] hover:bg-[#111]/30 transition-colors">
                        <td className="py-4 px-4 font-sans">
                          <div className="flex items-center gap-3">
                            <img src={prof.avatar_url || ''} alt="av" className="w-8 h-8 rounded-full border border-primary/25" />
                            <div className="flex flex-col font-mono text-xs">
                              <span className="font-bold text-white hover:underline cursor-pointer" onClick={() => setPath(`#/profile/${prof.id}`)}>
                                {prof.username}
                              </span>
                              <span className="text-[10px] text-gray-500">UUID: {prof.id.slice(0,8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleTogglePremiumUser(prof.id, prof.is_premium)}
                            className={`p-1 px-3.5 text-[10px] uppercase font-bold tracking-wider rounded border transition-all duration-300 ${prof.is_premium ? 'bg-primary/10 text-primary border-primary/40 hover:bg-primary/20' : 'bg-[#000]/40 border-[#222] text-gray-500 hover:text-white hover:border-gray-500'}`}
                          >
                            {prof.is_premium ? '★ Premium Enabled' : 'Grant Premium'}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          {prof.is_banned ? (
                            <span className="px-2 py-0.5 bg-red-500/10 text-primary border border-primary/20 rounded uppercase text-[9px] font-bold">Banned</span>
                          ) : currentProfile?.role === 'owner' ? (
                            <button
                              onClick={async () => {
                                try {
                                  const updated = await updateProfileStatus(prof.id, { role: prof.role === 'admin' ? 'user' : 'admin' });
                                  if (updated) {
                                    alert(updated.role === 'admin' ? 'Admin clearance granted.' : 'Admin clearance revoked.');
                                    loadAdminDatabase();
                                  }
                                } catch (e: any) {
                                  alert(e.message);
                                }
                              }}
                              disabled={prof.role === 'owner'}
                              className={`p-1 px-3.5 text-[10px] uppercase font-bold tracking-wider rounded border transition-all duration-300 ${
                                prof.role === 'admin' 
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/40 hover:bg-indigo-500/20' 
                                  : 'bg-[#000]/40 border-[#222] text-gray-500 hover:text-white hover:border-gray-500'
                              }`}
                            >
                              {prof.role === 'admin' ? '★ Administrator' : 'Promote Admin'}
                            </button>
                          ) : prof.role === 'owner' ? (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded uppercase text-[9px] font-bold">Platform Owner</span>
                          ) : prof.role === 'admin' ? (
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded uppercase text-[9px] font-bold">Admin Operator</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded uppercase text-[9px] font-bold">Clear</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {currentProfile?.role === 'owner' ? (
                              prof.is_banned ? (
                                <button
                                  onClick={() => handleUnban(prof.id)}
                                  className="p-1 px-2.5 bg-green-950/20 text-green-400 border border-green-900 rounded hover:bg-green-500 hover:text-black transition-colors font-mono font-bold text-[10px] flex items-center gap-1"
                                >
                                  <UserCheck className="w-3.5 h-3.5" /> Lift Ban
                                </button>
                              ) : (
                                prof.role !== 'owner' && (
                                  <button
                                    onClick={() => handleOpenBan(prof.id)}
                                    className="p-1 px-2.5 bg-red-950/20 text-red-500 border border-red-900 rounded hover:bg-primary hover:text-white transition-colors font-mono font-bold text-[10px] flex items-center gap-1"
                                  >
                                    <UserX className="w-3.5 h-3.5" /> Blacklist User
                                  </button>
                                )
                              )
                            ) : (
                              <span className="text-gray-600 italic text-[10px]">Restricted</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-[#111111]/40 border border-[#1f1f1f] rounded-lg p-6 space-y-6">
              <h3 className="font-display font-black text-sm text-white uppercase tracking-widest border-b border-[#1f1f1f] pb-3 flex items-center justify-between">
                <span>SYSTEM ACTIVITY AUDIT telemetry FEED</span>
                <span className="text-[10px] font-mono text-gray-500">CHRONOLOGICAL MATRIX AUDITS</span>
              </h3>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 font-mono text-[11px] leading-relaxed">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-[#050505]/60 border border-[#1a1a1a] rounded flex items-start gap-4 hover:border-primary/20 transition-all">
                      <span className="text-gray-600 flex-shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                      
                      <div className="flex-grow">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase mr-2 ${
                          log.action.includes('ban') ? 'bg-red-500/10 text-primary border border-primary/20' : 
                          log.action.includes('premium') ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          log.action.includes('approve') ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {log.action}
                        </span>

                        <span className="text-gray-300">
                          {log.profiles?.username || 'Operator'} executed action: 
                          <span className="text-white ml-1 font-bold">{JSON.stringify(log.details)}</span>
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-600 text-xs py-10 uppercase">
                    No directory transaction telemetry files logged yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS MANAGEMENT */}
          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Form Col Span 5 */}
              <form onSubmit={handlePublishAnnouncement} className="md:col-span-5 bg-[#111111]/80 border border-[#1f1f1f] p-6 rounded-lg space-y-4">
                <h3 className="font-display font-black text-sm text-white uppercase tracking-widest border-b border-[#1f1f1f] pb-3">
                  BROADCAST NOTIFICATION
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-500 uppercase">Signal Theme *</label>
                  <select
                    value={newAnnType}
                    onChange={(e) => setNewAnnType(e.target.value as any)}
                    className="w-full bg-[#050505] border border-[#1f1f1f] p-2 text-white text-xs font-mono outline-none"
                  >
                    <option value="success">[GREEN] - Broadcast Normal / Success</option>
                    <option value="info">[BLUE] - Informative Notice</option>
                    <option value="warning">[YELLOW] - Alert warning</option>
                    <option value="alert">[RED] - Critical priority warning</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-500 uppercase">Title Header *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., SCHEDULED MAINTENANCE WINDOW"
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    className="w-full bg-[#050505] border border-[#1f1f1f] p-2 text-white text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-500 uppercase">Broadcast Payload message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Submit body content that displaying to all catalog guests..."
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    className="w-full bg-[#050505] border border-[#1f1f1f] p-2 text-white text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-mono text-xs uppercase font-extrabold tracking-widest flex items-center justify-center gap-2 border border-primary/25 rounded-sm transition-all duration-300"
                >
                  <Volume2 className="w-4 h-4" /> BROADCAST SIGNAL
                </button>
              </form>

              {/* Notice listings Col Span 7 */}
              <div className="md:col-span-7 bg-[#111111]/45 border border-[#1f1f1f] p-6 rounded-lg space-y-6">
                <h3 className="font-display font-black text-sm text-white uppercase tracking-widest border-b border-[#1f1f1f] pb-3">
                  ACTIVE NOTIFICATION FEEDS
                </h3>

                <div className="space-y-4">
                  {announcements.length > 0 ? (
                    announcements.map((ann) => (
                      <div key={ann.id} className="p-4 bg-[#050505]/40 border border-[#1a1a1a] rounded flex justify-between items-start gap-4">
                        <div className="space-y-1 flex-grow">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                            ann.type === 'alert' ? 'bg-red-500/20 text-red-500' :
                            ann.type === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-green-400'
                          }`}>
                            {ann.type}
                          </span>
                          <h4 className="text-xs font-display font-black text-white tracking-widest uppercase">{ann.title}</h4>
                          <p className="text-[11px] text-gray-400 font-sans leading-relaxed">{ann.content}</p>
                        </div>

                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="text-gray-600 hover:text-red-500 p-1 border border-transparent hover:border-[#1f1f1f] rounded transition-colors"
                          title="Purge announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center font-mono text-xs text-gray-600 py-10 uppercase">
                      No broadcast signals filed.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: OWNER DASHBOARD */}
          {activeTab === 'owner' && currentProfile?.role === 'owner' && (
            <div className="bg-[#111111]/40 border border-amber-900/30 rounded-lg p-6 space-y-6">
              <div className="border-b border-amber-900/20 pb-3 flex items-center justify-between">
                <h3 className="font-display font-black text-sm text-amber-500 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span>PLATFORM OWNER CORE TERMINAL</span>
                </h3>
                <span className="text-[10px] font-mono text-amber-500/60 font-bold bg-amber-500/10 px-2.5 py-0.5 border border-amber-500/20 uppercase">SECURE SHELL ROOT</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/40 border border-[#1f1f1f] p-5 rounded-lg space-y-4">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-gray-300">ADMINISTRATIVE ACTION PROTOCOLS</h4>
                  <p className="text-xs text-gray-500 font-sans leading-relaxed">
                    As the platform owner, you possess structural permissions of absolute authority. All admin creations, deletions, bans, and system alterations logged under this console are recorded instantly to Supabase RLS verified columns.
                  </p>
                  <ul className="text-xs font-mono text-amber-500/80 space-y-2 pt-2">
                    <li className="flex items-center gap-1.5">✦ Elevate users to Admin status via the "Profiles & Premium" tab.</li>
                    <li className="flex items-center gap-1.5">✦ Instantly blacklist malicious accounts.</li>
                    <li className="flex items-center gap-1.5">✦ Post priority broadcasts across the marketplace globally.</li>
                  </ul>
                </div>

                <div className="bg-black/40 border border-[#1f1f1f] p-5 rounded-lg space-y-4">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-gray-300">SYSTEM CORES HEALTH TELEMETRY</h4>
                  <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-left">
                    <div className="p-3 bg-[#0c0c0c] border border-amber-950/20 rounded">
                      <span className="text-[10px] text-gray-500 block uppercase">CORE ROLE</span>
                      <span className="text-xs font-black text-amber-500 uppercase tracking-widest text-center">OWNER</span>
                    </div>
                    <div className="p-3 bg-[#0c0c0c] border border-amber-950/20 rounded">
                      <span className="text-[10px] text-gray-500 block uppercase">RLS VALIDATION</span>
                      <span className="text-xs font-black text-green-500 uppercase tracking-widest text-center">ENFORCED</span>
                    </div>
                    <div className="p-3 bg-[#0c0c0c] border border-amber-950/20 rounded col-span-2">
                      <span className="text-[10px] text-gray-500 block uppercase">PRIMARY OWNER ID</span>
                      <span className="text-[10px] text-gray-400 font-bold truncate block">382103405908230144 (Discord ID Acc)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 4. MODALS ELEMENTS SUB-FIELDS FOR SPECIFICATIONS */}
      {/* Rejection Modal */}
      {rejectingResourceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form 
            onSubmit={handleConfirmReject}
            className="w-full max-w-sm bg-[#111111] border border-[#1f1f1f] rounded-lg p-6 space-y-4"
          >
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-2">
              REJECTION DISPATCH DETAILS
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-gray-500 uppercase">Reason for exclusion Check *</label>
              <textarea
                rows={4}
                required
                placeholder="e.g., Mediafire link is down or broken. Re-upload with clear configurations files."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-[#050505] border border-[#1f1f1f] rounded-sm p-2 text-white text-xs outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setRejectingResourceId(null)}
                className="px-3 py-1.5 border border-[#222] text-gray-400 uppercase font-bold"
              >
                Dismiss
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-primary text-white uppercase font-bold border border-primary/20"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ban user Modal */}
      {banningProfileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form 
            onSubmit={handleConfirmBan}
            className="w-full max-w-sm bg-[#111111] border border-[#1f1f1f] rounded-lg p-6 space-y-4"
          >
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-2">
              DISCIPLINARY EXCLUSION FILING
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-gray-500 uppercase block">Disciplinary exclusion reason *</label>
              <textarea
                rows={4}
                required
                placeholder="e.g., Uploading unauthorized backdoors in plugins schematic."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full bg-[#050505] border border-[#1f1f1f] rounded-sm p-2 text-white text-xs outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setBanningProfileId(null)}
                className="px-3 py-1.5 border border-[#222] text-gray-400 uppercase font-bold hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-primary text-white uppercase font-bold border border-primary/20"
              >
                Activate Blacklist
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
