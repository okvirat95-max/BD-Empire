import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, ArrowRight, Download, Eye, Star, Compass, Award, ExternalLink, HelpCircle, ShieldCheck } from 'lucide-react';
import { Resource, Profile } from '../types';
import { getResources, getAllProfiles, subscribeToRealtime, getAllReviewsCount, getDownloadStatistics } from '../lib/db';

interface HomePageProps {
  setPath: (path: string) => void;
  setSelectedResourceId: (id: string) => void;
  currentProfile: Profile | null;
}

export default function HomePage({ setPath, setSelectedResourceId, currentProfile }: HomePageProps) {
  const [latestResources, setLatestResources] = useState<Resource[]>([]);
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    resources: 0,
    downloads: 0,
    downloadsToday: 0,
    downloadsLast24h: 0,
    downloadsLast7Days: 0,
    reviews: 0,
  });

  const loadData = async () => {
    try {
      const allRes = await getResources({ sortBy: 'latest', includeUnapproved: false });
      const profiles = await getAllProfiles();
      const reviewsCount = await getAllReviewsCount();
      const downloadStats = await getDownloadStatistics();
      
      setLatestResources(allRes.slice(0, 4));
      setFeaturedResources(allRes.filter(r => r.is_featured).slice(0, 4));
      
      setStats({
        users: profiles.length, 
        resources: allRes.length,
        downloads: downloadStats.totalDownloads,
        downloadsToday: downloadStats.downloadsToday,
        downloadsLast24h: downloadStats.downloadsLast24h,
        downloadsLast7Days: downloadStats.downloadsLast7Days,
        reviews: reviewsCount, 
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Supabase or simulated Local Realtime updates
    const unsubRes = subscribeToRealtime('resources', () => loadData());
    const unsubProf = subscribeToRealtime('profiles', () => loadData());
    const unsubStats = subscribeToRealtime('statistics', () => loadData());

    return () => {
      unsubRes();
      unsubProf();
      unsubStats();
    };
  }, []);

  return (
    <div className="space-y-24 py-6">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#050505] py-20 border-b border-[#111] cyber-grid">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10" />
        
        {/* Glow effect backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20 flex flex-col items-center text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-primary uppercase">DARKLEAKER</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl tracking-tighter text-white mb-6 uppercase max-w-4xl">
            DARKLEAKER<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-primary to-rose-400 glow-red text-2xl sm:text-4xl md:text-5xl">PREMIUM MINECRAFT RESOURCES MARKETPLACE</span>
          </h1>

          <p className="text-gray-400 font-sans text-base sm:text-lg max-w-2xl leading-relaxed mb-10">
            Upload, discover and download high-quality Minecraft resources from the community.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => setPath('#/marketplace')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-display font-black text-sm tracking-wider uppercase rounded-sm hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Explore Marketplace
              <Compass className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPath('#/upload')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#111111] hover:bg-[#1a1a1a] text-white border border-[#1f1f1f] hover:border-gray-600 rounded-sm font-display font-bold text-sm tracking-wider uppercase transition-all duration-300"
            >
              Publish Resource
              <ArrowRight className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. LIVE STATISTICS TABLE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-8 bg-[#111111]/40 border border-[#1f1f1f] rounded-lg">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <span className="text-3xl sm:text-4xl font-display font-black text-white glow-red tracking-tight">{stats.resources}</span>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-2">Active Resources</span>
          </div>

          <div className="flex flex-col items-center justify-center py-4 text-center border-l border-[#1f1f1f]">
            <span className="text-3xl sm:text-4xl font-display font-black text-white glow-red tracking-tight">{stats.users}</span>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-2">Verified Builders</span>
          </div>

          <div className="flex flex-col items-center justify-center py-4 text-center border-l border-[#1f1f1f]">
            <span className="text-3xl sm:text-4xl font-display font-black text-white glow-red tracking-tight">{stats.downloads}</span>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-2">Total Downloads</span>
            <div className="flex flex-col gap-1 items-center justify-center mt-3 text-[10px] font-mono border-t border-[#1f1f1f]/60 pt-2 w-full px-2 max-w-[170px]">
              <div className="flex justify-between w-full text-gray-500">
                <span>TODAY:</span>
                <span className="text-emerald-400 font-bold">{stats.downloadsToday}</span>
              </div>
              <div className="flex justify-between w-full text-gray-500">
                <span>LAST 24H:</span>
                <span className="text-primary font-bold">{stats.downloadsLast24h}</span>
              </div>
              <div className="flex justify-between w-full text-gray-500">
                <span>LAST 7D:</span>
                <span className="text-indigo-400 font-bold">{stats.downloadsLast7Days}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-4 text-center border-l border-[#1f1f1f]">
            <span className="text-3xl sm:text-4xl font-display font-black text-white glow-red tracking-tight">{stats.reviews}</span>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-2">Resource Reviews</span>
          </div>
        </div>
      </section>

      {/* 3. FEATURED RESOURCE SPOTLIGHT */}
      {featuredResources.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary block" />
              <h2 className="font-display font-black text-2xl uppercase tracking-wider text-white">FEATURED SPOTLIGHTS</h2>
            </div>
            <button
              onClick={() => setPath('#/marketplace')}
              className="text-xs font-mono text-primary hover:text-white transition-colors duration-200 uppercase tracking-widest flex items-center gap-1"
            >
              View All Featured <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredResources.map(res => (
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
        </section>
      )}

      {/* 4. LATEST RESOURCES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary block" />
            <h2 className="font-display font-black text-2xl uppercase tracking-wider text-white">LATEST RELEASES</h2>
          </div>
          <button
            onClick={() => setPath('#/marketplace')}
            className="text-xs font-mono text-primary hover:text-white transition-colors duration-200 uppercase tracking-widest flex items-center gap-1"
          >
            Show Full Catalog <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {latestResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestResources.map(res => (
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
          <div className="flex flex-col items-center justify-center p-12 bg-[#111]/20 border border-[#1f1f1f] border-dashed rounded-lg">
            <Terminal className="w-8 h-8 text-gray-500 mb-4" />
            <p className="text-gray-400 font-mono text-sm uppercase tracking-widest mb-4">No uploads are live yet</p>
            <p className="text-gray-600 text-xs text-center max-w-sm mb-6">
              Establish the initial database connection. Add configurations, source setups, or plugins by logging inside the portal.
            </p>
            <button
              onClick={() => setPath('#/upload')}
              className="px-5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-display font-medium uppercase tracking-widest transition-colors duration-200"
            >
              Upload First Asset
            </button>
          </div>
        )}
      </section>

      {/* 5. MEMBERSHIP & DISCORD SECTIONS SIDE-BY-SIDE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PREMIUM PASS */}
        <div className="relative overflow-hidden bg-[#111111]/60 border border-primary/20 rounded-lg p-8 flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-primary bg-primary/10 border-l border-b border-primary/20 tracking-wider">
            MANUAL APPROVALS
          </div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-6 h-6 text-primary glow-red" />
              <h3 className="font-display font-black text-xl text-white uppercase tracking-wider">Premium Access License</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Gain exclusive commercial authorization. Host premium resource links, tag premium setups, eliminate download delays, and receive the legendary Discord <span className="text-primary font-bold">Premium Builder</span> badge.
            </p>
            <ul className="space-y-2 mb-8 text-xs font-mono text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Verified Seller Status
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Unfiltered Premium Badges
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Featured Spotlights Priority
              </li>
            </ul>
          </div>

          <button
            onClick={() => setPath('#/premium')}
            className="w-full py-3 bg-primary/20 hover:bg-primary text-primary hover:text-white font-display font-bold text-xs uppercase tracking-wider transition-all duration-300 border border-primary/30"
          >
            Aquire Premium Access
          </button>
        </div>

        {/* COMMUNITY SECTION */}
        <div className="bg-[#111111]/40 border border-[#1f1f1f] rounded-lg p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Terminal className="w-6 h-6 text-indigo-500" />
              <h3 className="font-display font-black text-xl text-white uppercase tracking-wider">Discord Tech Space</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Meet 2,500+ Minecraft developers, administrators, and server owners. Share setups, exchange Skript templates, receive live download feedback, and request premium payouts directly from active builders.
            </p>
            <div className="bg-[#050505] p-3 border border-[#1f1f1f] rounded flex items-center justify-between text-xs font-mono mb-8">
              <span className="text-gray-500">Guild Link:</span>
              <span className="text-indigo-400 hover:underline">discord.gg/ZqWZnZm7P6</span>
            </div>
          </div>

          <a
            href="https://discord.gg/ZqWZnZm7P6"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold text-xs uppercase text-center tracking-wider transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <span>Launch Support Server</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
}

// Internal reusable card module to prevent repetition and keep design unified
export function ResourceCard({ resource, onClick }: { resource: Resource; onClick: () => void; key?: any }) {
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'plugin': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'skript': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'config': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'map': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'setup': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'resource_pack': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col justify-between bg-[#111111]/80 hover:bg-[#151515] hover:scale-[1.02] border border-[#1f1f1f] hover:border-primary/40 rounded-md cursor-pointer transition-all duration-300 shadow-lg hover:shadow-[#ff0000]/10"
    >
      <div>
        {/* Thumbnail Screen */}
        <div className="relative aspect-video w-full overflow-hidden bg-black/40 border-b border-[#1f1f1f]">
          {resource.thumbnail_url ? (
            <img 
              src={resource.thumbnail_url} 
              alt={resource.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center font-mono text-[9px] text-gray-600 gap-1 select-none">
              <Terminal className="w-5 h-5" />
              <span>{resource.category.toUpperCase()} MATRIX</span>
            </div>
          )}

          {/* Badges wrapper */}
          <div className="absolute top-2 left-2 flex gap-1 z-10">
            <span className={`px-2 py-0.5 text-[9px] font-mono font-black border uppercase tracking-wider rounded ${getCategoryColor(resource.category)}`}>
              {resource.category}
            </span>
          </div>

          <div className="absolute top-2 right-2 flex gap-1 z-10">
            {resource.is_premium && (
              <span className="px-2 py-0.5 text-[9px] font-mono font-black border border-primary bg-primary/20 text-white rounded uppercase tracking-wider flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-primary" /> Premium
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4">
          <h3 className="font-display font-medium text-white group-hover:text-primary leading-tight line-clamp-1 mb-1 transition-colors duration-200">
            {resource.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 leading-normal mb-4 font-sans">
            {resource.description}
          </p>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="p-4 pt-0 border-t border-[#1a1a1a]/40 mt-auto">
        <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 pt-3">
          <div className="flex items-center gap-1.5 truncate max-w-[100px]">
            <img 
              src={resource.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
              alt="author" 
              className="w-4 h-4 rounded-full border border-gray-800"
            />
            <span className="truncate hover:text-white">{resource.profiles?.username || 'Steve'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5" title="Downloads">
              <Download className="w-3 h-3 text-primary" /> {resource.downloads}
            </span>
            <span className="flex items-center gap-0.5" title="Views">
              <Eye className="w-3 h-3" /> {resource.views}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
