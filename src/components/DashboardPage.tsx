import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Award, Settings, Trash2, Edit3, ShoppingBag, Eye, Calendar, Sparkles, AlertTriangle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { Profile, Resource } from '../types';
import { getResources, deleteResource, updateResource, subscribeToRealtime } from '../lib/db';

interface DashboardPageProps {
  currentProfile: Profile | null;
  setPath: (path: string) => void;
  setSelectedResourceId: (id: string) => void;
  onProfileUpdate: () => void;
}

export default function DashboardPage({ currentProfile, setPath, setSelectedResourceId, onProfileUpdate }: DashboardPageProps) {
  const [userResources, setUserResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit fields modal
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMediafire, setEditMediafire] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const loadDashboard = async () => {
    if (!currentProfile) return;
    setLoading(true);
    try {
      // Fetch all resources, including unapproved so they can track their submissions
      const allRes = await getResources({ includeUnapproved: true });
      const userOwned = allRes.filter(r => r.author_id === currentProfile.id);
      setUserResources(userOwned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    
    const unsub = subscribeToRealtime('resources', () => loadDashboard());
    return () => unsub();
  }, [currentProfile]);

  const handleDelete = async (resourceId: string, titleName: string) => {
    const confirm = window.confirm(`Identify Action: Are you absolutely certain you intend to permanently delete "${titleName}"?`);
    if (!confirm) return;

    try {
      const succeeded = await deleteResource(resourceId);
      if (succeeded) {
        setUserResources(prev => prev.filter(r => r.id !== resourceId));
        alert('Resource inventory record deleted successfully.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (res: Resource) => {
    setEditingResource(res);
    setEditTitle(res.title);
    setEditDesc(res.description);
    setEditMediafire(res.mediafire_url);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;

    if (!editTitle.trim() || !editDesc.trim() || !editMediafire.trim()) {
      alert('All fields are mandatory.');
      return;
    }

    if (!editMediafire.toLowerCase().includes('mediafire.com')) {
      alert('Valid Mediafire link required.');
      return;
    }

    setEditSaving(true);
    try {
      const updated = await updateResource(editingResource.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        mediafire_url: editMediafire.trim()
      });
      if (updated) {
        setEditingResource(null);
        loadDashboard();
        alert('Product registration updated successfully.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update asset. Check schema policies.');
    } finally {
      setEditSaving(false);
    }
  };

  if (!currentProfile) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6">
        <LayoutDashboard className="w-12 h-12 text-primary mx-auto" />
        <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider">SECURE DASHBOARD ACCESS BLOCKED</h2>
        <p className="text-gray-400 font-sans text-sm">
          A secure Discord session handshakes is required to compute dashboard telemetry. Use the connection gateway above.
        </p>
        <button
          onClick={() => setPath('#/')}
          className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-display font-bold text-xs uppercase"
        >
          Return Home
        </button>
      </div>
    );
  }

  // Calculate Cumulative Dashboard Stats
  const totalDownloads = userResources.reduce((acc, curr) => acc + (curr.downloads || 0), 0);
  const totalViews = userResources.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const approvedCount = userResources.filter(r => r.status === 'approved').length;
  const pendingCount = userResources.filter(r => r.status === 'pending').length;

  return (
    <div className="py-6 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
      {/* 1. Header Row */}
      <div className="border-b border-[#111] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-mono text-xs tracking-widest uppercase mb-1">
            <span>DASHBOARD METRICS PORTAL</span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          </div>
          <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight">MY PORTAL</h1>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setPath('#/upload')}
          className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-display font-bold text-xs tracking-wide uppercase rounded-sm shadow-xl shadow-primary/15 hover:shadow-primary/25 transition-all duration-300 border border-primary/25"
        >
          Publish New Config
        </button>
      </div>

      {/* 2. Overview bento stats layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-[#111111]/80 border border-[#1f1f1f] rounded-lg p-6 flex items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 font-mono text-[9px] text-[#444] tracking-widest uppercase">
            STATUS UNIT
          </div>

          <img
            src={currentProfile.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'}
            alt={currentProfile.username}
            className="w-16 h-16 rounded-full border-2 border-primary/20 bg-black/40"
          />

          <div className="flex-grow">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-display font-black text-lg uppercase tracking-wider">{currentProfile.username}</h2>
              {currentProfile.is_premium && (
                <span className="p-1 bg-primary/15 border border-primary/30 rounded text-primary text-[9px] font-mono tracking-widest uppercase flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 fill-primary" /> Premium
                </span>
              )}
            </div>
            
            <p className="text-gray-500 text-xs font-mono mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Established Account: {new Date(currentProfile.created_at).toLocaleDateString()}
            </p>

            {/* Quick action profile edit simulated fallback */}
            <button
              onClick={() => {
                alert("Simulated discord profile sync.\nYour avatar matches your Discord Guild Profile metadata automatically!");
              }}
              className="text-[9px] font-mono text-gray-500 hover:text-white underline mt-3 block uppercase tracking-wider transition-colors"
            >
              Force Sync Discord Profile Meta
            </button>
          </div>
        </div>

        {/* Stat Counter Views */}
        <div className="bg-[#111111]/40 border border-[#1f1f1f] rounded-lg p-6 flex flex-col justify-between">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block mb-4">Cumulative Downloads</span>
          <div>
            <span className="text-4xl font-display font-black text-white glow-red">{totalDownloads}</span>
            <span className="text-xs text-gray-400 font-mono italic block mt-1">across all setups</span>
          </div>
        </div>

        {/* Stat Page Views */}
        <div className="bg-[#111111]/40 border border-[#1f1f1f] rounded-lg p-6 flex flex-col justify-between">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block mb-4">Product Pageviews</span>
          <div>
            <span className="text-4xl font-display font-black text-white">{totalViews}</span>
            <span className="text-xs text-gray-400 font-mono italic block mt-1">all visual hits</span>
          </div>
        </div>
      </div>

      {/* 3. My Uploads Table representation */}
      <section className="bg-[#111111]/30 border border-[#1f1f1f] rounded-lg p-6 space-y-6">
        <h3 className="font-display font-black text-lg text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-3 flex items-center justify-between">
          <span>UPLOADED MINECRAFT RESOURCE INVENTORY</span>
          <span className="text-xs font-mono text-gray-500 uppercase">{userResources.length} total releases</span>
        </h3>

        {loading ? (
          <div className="py-12 flex justify-center">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : userResources.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1f1f1f] text-gray-500 uppercase tracking-wider pb-3">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stats</th>
                  <th className="py-3 px-4">Audit Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userResources.map((res) => (
                  <tr key={res.id} className="border-b border-[#111] hover:bg-[#111]/30 transition-colors">
                    <td className="py-4 px-4 font-sans max-w-xs">
                      <div className="flex flex-col">
                        <span 
                          onClick={() => {
                            if (res.status === 'approved') {
                              setSelectedResourceId(res.id);
                              setPath(`#/resource/${res.id}`);
                            } else {
                              alert(`This item has status: [${res.status.toUpperCase()}]. It remains offline until administrative audit.`);
                            }
                          }}
                          className={`font-semibold hover:text-primary transition-colors hover:underline ${res.status === 'approved' ? 'cursor-pointer text-white' : 'text-gray-500 cursor-not-allowed'}`}
                        >
                          {res.title}
                        </span>
                        <span className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                          Created {new Date(res.created_at).toLocaleDateString()} | 
                          <span className="text-indigo-400 hover:underline cursor-pointer" onClick={() => window.open(res.mediafire_url, '_blank')}> Mediafire Direct link</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 border border-[#1f1f1f] bg-[#050505] rounded text-gray-400 text-[10px] uppercase">
                        {res.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 text-[11px] text-gray-400">
                        <span>DLs: <b className="text-white">{res.downloads}</b></span>
                        <span>Views: <b className="text-white">{res.views}</b></span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {res.status === 'approved' ? (
                        <span className="px-2 py-0.5 select-none bg-green-500/10 text-green-400 border border-green-500/20 rounded uppercase text-[9px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : res.status === 'pending' ? (
                        <span className="px-2 py-0.5 select-none bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded uppercase text-[9px] font-bold inline-flex items-center gap-1 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Pending Audit
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-0.5 select-none bg-red-500/10 text-red-500 border border-red-500/20 rounded uppercase text-[9px] font-bold w-fit">
                            Rejected
                          </span>
                          {res.rejection_reason && (
                            <span className="text-[10px] text-gray-500 max-w-xs">{res.rejection_reason}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditing(res)}
                          className="p-1 px-2 border border-gray-800 hover:border-gray-500 hover:bg-[#1a1a1a] rounded text-gray-400 hover:text-white transition-all flex items-center gap-1 text-[10px]"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(res.id, res.title)}
                          className="p-1 px-2 border border-red-950/40 hover:border-red-500 hover:bg-primary/10 rounded text-red-400 transition-all flex items-center gap-1 text-[10px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-600 font-mono text-xs uppercase space-y-4">
            <p>You have not uploaded any Minecraft assets under this discord credentials.</p>
            <p className="text-[10px] text-gray-500 font-sans max-w-md mx-auto leading-relaxed">
              Publish config files, Java plugins, scripts, server setups, schematics, or resource packs to establish your portfolio statistics instantly.
            </p>
            <button
              onClick={() => setPath('#/upload')}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold uppercase tracking-widest text-[10px]"
            >
              Publish First Asset
            </button>
          </div>
        )}
      </section>

      {/* 4. MODAL ELEMENT FOR INLINE EDITS */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form 
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg bg-[#111111] border border-[#1f1f1f] rounded-lg p-6 relative space-y-5"
          >
            <button
              type="button"
              onClick={() => setEditingResource(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-black text-base text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-3">
              EDIT RESOURCE REGISTRATION
            </h3>

            {/* Editing Warning if published */}
            {editingResource.status === 'approved' && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/20 rounded-sm text-[11px] font-mono text-amber-500 flex items-start gap-1.5 leading-snug uppercase">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Notice: Modifying details of active approved catalogs will remain online unless flagged during auditing.</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-500 uppercase block">Product Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#050505] border border-[#1f1f1f] rounded-sm p-2 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-500 uppercase block">Mediafire URL Link</label>
                <input
                  type="url"
                  required
                  value={editMediafire}
                  onChange={(e) => setEditMediafire(e.target.value)}
                  className="w-full bg-[#050505] border border-[#1f1f1f] rounded-sm p-2 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-500 uppercase block">Description / Changelogs</label>
                <textarea
                  rows={6}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-[#050505] border border-[#1f1f1f] rounded-sm p-2 text-white text-xs font-sans leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#1a1a1a]">
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="px-4 py-2 border border-[#222] text-gray-400 hover:text-white uppercase font-display font-medium text-xs transition-colors"
              >
                Dismiss
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="px-5 py-2 bg-primary hover:bg-primary/95 text-white uppercase font-display font-bold text-xs tracking-wider border border-primary/20 disabled:opacity-50"
              >
                {editSaving ? 'Saving Updates...' : 'Commit Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
