import React, { useState, useEffect } from 'react';
import { User, Calendar, Award, Sparkles, ShoppingBag, ArrowLeft, Terminal, MessageSquare, ShieldAlert } from 'lucide-react';
import { Profile, Resource } from '../types';
import { getAllProfiles, getResources } from '../lib/db';
import { ResourceCard } from './HomePage';

interface ProfilePageProps {
  profileId: string;
  setPath: (path: string) => void;
  setSelectedResourceId: (id: string) => void;
}

export default function ProfilePage({ profileId, setPath, setSelectedResourceId }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authorResources, setAuthorResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const allProfiles = await getAllProfiles();
      const matched = allProfiles.find(p => p.id === profileId);
      
      if (matched) {
        setProfile(matched);
        const catalog = await getResources({ includeUnapproved: false });
        const owned = catalog.filter(r => r.author_id === profileId);
        setAuthorResources(owned);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      loadProfileData();
    }
  }, [profileId]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary border-r-2 animate-spin" />
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Searching records cache...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-6">
        <ShieldAlert className="w-12 h-12 text-primary mx-auto" />
        <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider">PROFILE RETRIEVAL EXCEPTION</h2>
        <p className="text-gray-400 font-sans text-sm">
          The requested profile with ID <span className="font-mono text-xs text-white">{profileId}</span> is absent from our indices or could have been purged.
        </p>
        <button
          onClick={() => setPath('#/')}
          className="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-display font-bold text-xs uppercase"
        >
          Return Home
        </button>
      </div>
    );
  }

  const cumulativeDownloads = authorResources.reduce((acc, curr) => acc + (curr.downloads || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 animate-fade-in">
      {/* Return Button */}
      <button
        onClick={() => setPath('#/marketplace')}
        className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4 text-primary" /> RETURN TO INDEX
      </button>

      {/* Cyber Profile Header */}
      <div className="bg-[#111111]/80 border border-[#1f1f1f] rounded-lg p-8 relative overflow-hidden flex flex-col md:flex-row items-center md:items-stretch gap-8">
        {/* Glow behind avatar */}
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-[60px]" />

        {/* Avatar Area */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <div className="relative">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'}
              alt={profile.username}
              className="w-24 h-24 rounded-full border-2 border-primary/40 object-cover bg-black"
            />
            {profile.is_premium && (
              <div className="absolute -bottom-1 -right-1 p-1 bg-primary text-white rounded-full border border-black shadow" title="Premium Access License">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Account Metadata Detail */}
        <div className="flex-grow flex flex-col justify-between text-center md:text-left space-y-4">
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-white font-display font-black text-2xl uppercase tracking-wider">{profile.username}</h1>
              <div className="flex gap-2 justify-center md:justify-start">
                {profile.role === 'owner' && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-mono text-[9px] tracking-wider uppercase font-extrabold flex items-center animate-pulse">
                    PLATFORM OWNER
                  </span>
                )}
                {profile.role === 'admin' && (
                  <span className="px-2 py-0.5 bg-red-500/10 text-primary border border-primary/20 rounded font-mono text-[9px] tracking-wider uppercase font-extrabold flex items-center">
                    PLATFORM OPERATOR
                  </span>
                )}
                {profile.is_premium && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-mono text-[9px] tracking-wider uppercase font-semibold">
                    PREMIUM MEMBER
                  </span>
                )}
              </div>
            </div>

            {/* Account Details and Social Sync */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 text-[11px] font-mono text-gray-500">
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Enlisted: {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Discord Handle: <b className="text-white">@{profile.username.toLowerCase()}</b></span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1.5Col font-bold text-gray-400">
                <span>Verification State: <b className="text-green-500 uppercase">Passed</b></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center justify-center md:justify-start gap-6 border-t border-[#1f1f1f]/60 pt-4">
            <div className="flex flex-col">
              <span className="text-lg font-display font-black text-white">{authorResources.length}</span>
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Approved Resources</span>
            </div>
            <div className="flex flex-col border-l border-[#1f1f1f] pl-6">
              <span className="text-lg font-display font-black text-white">{cumulativeDownloads}</span>
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Cumulative Hits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Author Catalog Showcase */}
      <section className="space-y-6">
        <h3 className="font-display font-black text-lg text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-3">
          APPROVED CATALOG SUBMISSIONS
        </h3>

        {authorResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {authorResources.map(res => (
              <ResourceCard
                key={res.id}
                resource={res}
                onClick={() => {
                  setSelectedResourceId(res.id);
                  setPath(`#/resource/${res.id}`);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 border border-[#1f1f1f] rounded-lg text-center font-mono text-xs text-gray-600 uppercase border-dashed">
            This developer has not published approved resources yet.
          </div>
        )}
      </section>
    </div>
  );
}
