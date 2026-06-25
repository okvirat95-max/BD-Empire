import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Heart, UserPlus, Users, ArrowUpRight, Search, 
  BarChart2, Flame, ThumbsUp, Trophy, Sparkles, Filter
} from 'lucide-react';
import { Creator, User } from '../types';

interface CreatorsProps {
  creators: Creator[];
  setCreators: React.Dispatch<React.SetStateAction<Creator[]>>;
  user: User | null;
  addToast: (message: string, type: 'success' | 'info' | 'error' | 'premium') => void;
}

export default function Creators({
  creators,
  setCreators,
  user,
  addToast
}: CreatorsProps) {
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [rankingSort, setRankingSort] = useState<'downloads' | 'reputation' | 'rating'>('downloads');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle following/unfollowing creators
  const handleToggleFollow = (username: string) => {
    if (!user) {
      addToast('Authenticate your profile to follow creators!', 'error');
      return;
    }
    const isFollowing = followedCreators.includes(username);
    
    if (isFollowing) {
      setFollowedCreators(prev => prev.filter(name => name !== username));
      setCreators(prev => prev.map(c => {
        if (c.username === username) {
          return { ...c, followers: c.followers - 1 };
        }
        return c;
      }));
      addToast(`Unfollowed creator: ${username}`, 'info');
    } else {
      setFollowedCreators(prev => [...prev, username]);
      setCreators(prev => prev.map(c => {
        if (c.username === username) {
          return { ...c, followers: c.followers + 1 };
        }
        return c;
      }));
      addToast(`Now following ${username}! Stay synchronized with their updates.`, 'success');
    }
  };

  // Filter & Sort Lead list
  const filteredCreators = creators.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedLeaderboard = [...creators].sort((a, b) => {
    if (rankingSort === 'downloads') return b.downloads - a.downloads;
    if (rankingSort === 'reputation') return b.reputation - a.reputation;
    return b.rating - a.rating;
  });

  return (
    <div id="creators-section" className="w-full max-w-7xl mx-auto py-10 px-4 text-left">
      
      {/* Header section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-10">
        <div>
          <span className="text-xs font-mono text-brand-purple uppercase tracking-widest font-bold">PLATFORM ELITES</span>
          <h2 className="text-3xl font-display font-extrabold text-white uppercase mt-1">Creator Hub</h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5">Meet verified Java engineers and world-builders driving modular gaming mechanics.</p>
        </div>

        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search verified creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 focus:border-brand-purple rounded-xl text-xs font-sans placeholder-slate-500 focus:outline-none transition-all duration-300 text-white"
          />
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CREATOR DIRECTORY CARDS SHOWCASE
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {filteredCreators.length === 0 ? (
        <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-12 text-center my-6">
          <Award className="w-12 h-12 text-brand-purple/40 mx-auto mb-4 animate-pulse" />
          <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-widest">No Verified Creators Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2">The verified creator roster is empty. Be the first Java module designer to synchronize profiles and build communities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {filteredCreators.map((creator) => {
            const isFollowing = followedCreators.includes(creator.username);
            
            return (
              <div
                key={creator.username}
                className="bg-slate-950/80 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 backdrop-blur-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)] group"
              >
                {/* Decorative background grid */}
                <div className="absolute inset-0 cyber-grid-dense opacity-10 pointer-events-none" />
                
                {/* Card top banner/profile info */}
                <div className="flex justify-between items-start mb-5 z-10">
                  <div className="flex gap-4">
                    {/* Glowing cyber avatar shape */}
                    <div className={`w-14 h-14 rounded-xl ${creator.avatarBg} flex items-center justify-center text-2xl relative shadow-lg`}>
                      {creator.avatarEmoji}
                      {creator.isVerified && (
                        <span className="absolute -bottom-1.5 -right-1.5 bg-brand-cyan text-slate-950 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-950">
                          VERIFIED
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col">
                      <h3 className="text-sm font-sans font-black text-slate-200 group-hover:text-brand-cyan transition-colors flex items-center gap-1.5">
                        {creator.username}
                        <span className="text-[10px] font-mono text-brand-purple">#{creator.rank}</span>
                      </h3>
                      <span className="text-xs text-slate-400 font-sans mt-0.5">{creator.specialty}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFollow(creator.username)}
                    className={`h-9 px-4 rounded-lg text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 transition-all active:scale-95 border ${
                      isFollowing 
                        ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFollowing ? 'fill-brand-purple' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>

                {/* Bio description */}
                <p className="text-xs text-slate-400 font-sans leading-relaxed mb-5 z-10">
                  {creator.bio}
                </p>

                {/* Achievements dynamic list */}
                <div className="mb-5 z-10">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-2">Unlocked Badges</span>
                  <div className="flex flex-wrap gap-1.5">
                    {creator.achievements.map((ach) => (
                      <span 
                        key={ach}
                        className="text-[9px] font-sans font-extrabold px-2 py-0.5 rounded bg-brand-purple/5 border border-brand-purple/10 text-purple-300 flex items-center gap-1"
                      >
                        <Award className="w-3 h-3 text-brand-purple" />
                        {ach}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-900/80 z-10">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Total Downloads</span>
                    <span className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                      {creator.downloads >= 1000000 
                        ? `${(creator.downloads / 1000000).toFixed(1)}M` 
                        : creator.downloads.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Followers</span>
                    <span className="text-xs font-mono font-bold text-slate-200 mt-0.5">{creator.followers.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Reputation</span>
                    <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-brand-crimson animate-pulse" />
                      +{creator.reputation}
                    </span>
                  </div>
                </div>

                {/* Recent designs list */}
                <div className="mt-4 pt-4 border-t border-slate-900/60 z-10">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mb-2">Recent Core Assets</span>
                  <div className="flex flex-wrap gap-1.5">
                    {creator.recentAssets.map((asset) => (
                      <span 
                        key={asset}
                        className="text-[10px] font-sans font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-slate-900"
                      >
                        📁 {asset}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CREATOR LEADERBOARD & STATISTICAL COMPARATOR
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 lg:p-8 backdrop-blur-2xl relative overflow-hidden">
        {/* Hologram lines */}
        <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-brand-gold" />
            <div>
              <h3 className="text-lg font-display font-bold text-slate-200">Global Creator Rankings</h3>
              <p className="text-xs text-slate-500">Telemetry-computed ranks synchronized with downloads volume.</p>
            </div>
          </div>

          {/* Leaderboard sort options */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-900">
            {[
              { id: 'downloads', name: 'Downloads' },
              { id: 'reputation', name: 'Reputation' },
              { id: 'rating', name: 'Rating' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setRankingSort(opt.id as any);
                  addToast(`Sorting ranks by ${opt.name}`, 'info');
                }}
                className={`h-8 px-3.5 rounded-lg text-[10px] font-mono uppercase font-bold transition-all ${
                  rankingSort === opt.id 
                    ? 'bg-slate-950 border border-slate-800 text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>

        {/* Rankings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Verified Creator</th>
                <th className="py-3 px-4">Downloads Volume</th>
                <th className="py-3 px-4">Reputation Score</th>
                <th className="py-3 px-4">Star Rating</th>
                <th className="py-3 px-4 text-right">Platform Stats</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs font-mono text-slate-500">
                    No records registered in telemetry rankings yet.
                  </td>
                </tr>
              ) : (
                sortedLeaderboard.map((creator, index) => (
                  <tr 
                    key={creator.username}
                    className="border-b border-slate-900/50 hover:bg-white/[0.01] transition-colors text-xs font-sans text-slate-300 group"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-slate-400 group-hover:text-brand-cyan">
                      {index === 0 && '🥇 '}
                      {index === 1 && '🥈 '}
                      {index === 2 && '🥉 '}
                      #{index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${creator.avatarBg} flex items-center justify-center text-sm`}>
                          {creator.avatarEmoji}
                        </div>
                        <span className="font-extrabold text-slate-200 group-hover:text-white transition-colors">{creator.username}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold">
                      {creator.downloads.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-mono text-brand-crimson">
                      +{creator.reputation} REP
                    </td>
                    <td className="py-4 px-4 font-mono text-brand-gold font-bold">
                      ★ {creator.rating}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {creator.followers.toLocaleString()} Followers
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
