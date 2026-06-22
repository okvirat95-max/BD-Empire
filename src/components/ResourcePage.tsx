import React, { useState, useEffect } from 'react';
import { Download, Eye, Star, Calendar, ShieldCheck, ExternalLink, MessageSquare, CornerDownRight, Sparkles, Terminal } from 'lucide-react';
import { Resource, Review, Profile } from '../types';
import { getResourceById, getReviews, addReview, incrementResourceDownload, incrementResourceView, subscribeToRealtime, getDownloadStatisticsForResource } from '../lib/db';

interface ResourcePageProps {
  resourceId: string;
  currentProfile: Profile | null;
  setPath: (path: string) => void;
}

export default function ResourcePage({ resourceId, currentProfile, setPath }: ResourcePageProps) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadStats, setDownloadStats] = useState({ downloadsToday: 0, downloadsLast24h: 0 });
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  // Form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const loadResourceDetails = async () => {
    try {
      const res = await getResourceById(resourceId);
      if (res) {
        setResource(res);
        const revs = await getReviews(resourceId);
        setReviews(revs);
        
        const statsObj = await getDownloadStatisticsForResource(resourceId);
        setDownloadStats(statsObj);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resourceId) {
      // Increment views count exactly once per session/visit
      incrementResourceView(resourceId);
      loadResourceDetails();

      const unsub = subscribeToRealtime('resources', () => loadResourceDetails());
      const unsubReviews = subscribeToRealtime('reviews', () => loadResourceDetails());
      return () => {
        unsub();
        unsubReviews();
      };
    }
  }, [resourceId]);

  const handleDownload = async () => {
    if (!resource) return;
    try {
      // 1. Create download_logs record & Increment downloads_count
      await incrementResourceDownload(resource.id);
      
      // Update local state instantly so numbers increase
      setResource(prev => prev ? { ...prev, downloads: prev.downloads + 1 } : null);
      setDownloadStats(prev => ({
        downloadsToday: prev.downloadsToday + 1,
        downloadsLast24h: prev.downloadsLast24h + 1
      }));
      
      // 2. Show success notification
      setDownloadNotification("Download logged successfully. Redirecting to resource download page...");
      
      // 3. Redirect after 2 seconds
      setTimeout(() => {
        setDownloadNotification(null);
        window.open(resource.mediafire_url, '_blank', 'noopener,noreferrer');
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) {
      setReviewError('You must be connected with Discord to submit a review.');
      return;
    }
    if (!comment.trim()) {
      setReviewError('Please write feedback comments before submitting.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    try {
      const savedReview = await addReview({
        resource_id: resourceId,
        user_id: currentProfile.id,
        rating,
        comment: comment.trim(),
      });
      if (savedReview) {
        setComment('');
        setRating(5);
        // Refresh reviews list
        loadResourceDetails();
      }
    } catch (err: any) {
      setReviewError(err.message || 'Failed to publish review. Have you already reviewed this item?');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary border-r-2 animate-spin" />
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Compiling catalog file...</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-6">
        <Terminal className="w-12 h-12 text-primary mx-auto" />
        <h3 className="font-display font-black text-2xl text-white uppercase">RESOURCE RECONSTRUCTION RANGE ERROR</h3>
        <p className="text-gray-400 font-sans text-sm">
          Could not locate a Minecraft marketplace item matching ID key <span className="font-mono text-white text-xs">{resourceId}</span>.
        </p>
        <button
          onClick={() => setPath('#/marketplace')}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-display font-bold text-xs uppercase"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  // Calculate Average Rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  return (
    <div className="py-6 space-y-8 animate-fade-in">
      {/* 1. Header Path Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
          <a href="#/" onClick={(e) => { e.preventDefault(); setPath('#/'); }} className="hover:text-white">DARKLEAKER</a>
          <span>/</span>
          <a href="#/marketplace" onClick={(e) => { e.preventDefault(); setPath('#/marketplace'); }} className="hover:text-white">MARKETPLACE</a>
          <span>/</span>
          <span className="text-primary truncate">{resource.title.toUpperCase()}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Resource Specs and Description (Col span 8) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Visual Title Card */}
          <div className="bg-[#111111]/80 border border-[#1f1f1f] rounded-lg p-6 flex flex-col md:flex-row gap-6">
            <div className="w-32 h-32 bg-[#050505] rounded-md border border-[#1f1f1f] flex-shrink-0 flex flex-col items-center justify-center relative overflow-hidden">
              {resource.thumbnail_url ? (
                <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-full object-cover" />
              ) : (
                <Terminal className="w-8 h-8 text-primary" />
              )}
            </div>

            <div className="flex-grow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#ff0000]/10 text-primary border border-[#ff0000]/20 uppercase rounded">
                    {resource.category}
                  </span>
                  
                  {resource.is_premium && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase rounded flex items-center gap-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Premium Asset
                    </span>
                  )}

                  {resource.is_featured && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase rounded">
                      Featured
                    </span>
                  )}
                </div>

                <h1 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight mb-2">
                  {resource.title}
                </h1>

                <div className="flex items-center gap-4 text-xs font-mono text-gray-500 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Uploaded: {new Date(resource.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span>Rating: {avgRating} ({reviews.length} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Tags panel */}
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {resource.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] font-mono bg-[#1a1a1a] text-gray-400 border border-[#222] rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description Content */}
          <div className="bg-[#111111]/40 border border-[#1f1f1f] rounded-lg p-6 space-y-6">
            <h3 className="font-display font-black text-lg text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-3">
              Description / Installation Instructions
            </h3>
            
            <p className="text-gray-300 font-sans text-sm leading-relaxed whitespace-pre-wrap">
              {resource.description}
            </p>
          </div>

          {/* Reviews Thread Section */}
          <div className="bg-[#111111]/40 border border-[#1f1f1f] rounded-lg p-6 space-y-8">
            <h3 className="font-display font-black text-lg text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-3 flex items-center justify-between">
              <span>REVIEWS AND RATINGS</span>
              <span className="text-xs font-mono text-gray-500 uppercase">{reviews.length} total posts</span>
            </h3>

            {/* Write a review module */}
            {currentProfile ? (
              <form onSubmit={submitFeedback} className="bg-[#0c0c0c] border border-[#1f1f1f] p-4 rounded-sm space-y-4">
                <span className="text-xs font-mono text-primary uppercase tracking-widest block font-bold">Write Your Evaluation</span>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono">Select Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setRating(stars)}
                        className="text-gray-600 hover:text-yellow-400 transition-colors"
                      >
                        <Star className={`w-5 h-5 ${stars <= rating ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <textarea
                    rows={3}
                    placeholder="Provide constructive feedback... How was the setup installation? Was the config optimized?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-[#111] border border-[#1f1f1f] focus:border-primary/40 rounded-sm p-3 text-white text-xs outline-none placeholder-gray-600"
                  />
                  {reviewError && (
                    <p className="text-red-500 font-mono text-[11px]">{reviewError}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-display font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Evaluation'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-[#0d0d0d] border border-[#1f1f1f] border-dashed p-4 text-center rounded-sm text-xs font-mono text-gray-500 uppercase">
                Connect your Discord Account above to submit resource rankings!
              </div>
            )}

            {/* Reviews Thread List */}
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map(rev => (
                  <div key={rev.id} className="p-4 border-b border-[#1a1a1a] last:border-b-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img 
                          src={rev.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
                          alt="reviewer" 
                          className="w-6 h-6 rounded-full border border-[#1f1f1f]"
                        />
                        <div className="flex flex-col text-[11px] font-mono leading-tight">
                          <span className="text-white hover:underline cursor-pointer">{rev.profiles?.username || 'Buyer'}</span>
                          <span className="text-gray-600">{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-300 leading-relaxed pl-8">
                      {rev.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center font-mono text-xs text-gray-600 py-4 uppercase">
                  No evaluations posted for this minecraft asset yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Metadata & Fast Action Box (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Action Download Board */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-6 space-y-6">
            <h3 className="font-display font-black text-sm text-white uppercase tracking-widest border-b border-[#1f1f1f] pb-3">
              ACQUISITION CONTROL
            </h3>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary/95 text-white font-display font-black text-sm tracking-wider uppercase rounded-sm border border-primary/20 shadow-lg shadow-primary/10 hover:shadow-primary/25 transition-all duration-300"
            >
              <Download className="w-5 h-5" />
              <span>DOWNLOAD RESOURCE</span>
            </button>

            {/* Delivery Details */}
            <div className="space-y-3 font-mono text-[11px] border-t border-[#1a1a1a] pt-4">
              <div className="flex justify-between items-center text-gray-500">
                <span>Distribution Provider:</span>
                <span className="text-white flex items-center gap-1.5 hover:underline cursor-pointer" onClick={() => window.open(resource.mediafire_url, '_blank')}>
                  MediaFire CDN <ExternalLink className="w-3 h-3 text-red-500" />
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Total Downloads:</span>
                <span className="text-white">{resource.downloads}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Downloads Today:</span>
                <span className="text-emerald-400 font-bold">{downloadStats.downloadsToday}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Downloads Last 24h:</span>
                <span className="text-primary font-bold">{downloadStats.downloadsLast24h}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Total Pageviews:</span>
                <span className="text-white">{resource.views}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>File Security Check:</span>
                <span className="text-green-500 uppercase flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Clear
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Resource License:</span>
                <span className="text-white">Commercial share-alike</span>
              </div>
            </div>
          </div>

          {/* Author Board */}
          <div className="bg-[#111111]/40 border border-[#1f1f1f] rounded-lg p-6 space-y-4">
            <h3 className="font-display font-black text-xs text-white uppercase tracking-widest border-b border-[#1f1f1f] pb-3">
              AUTHOR / BUILDER
            </h3>

            {resource.profiles && (
              <div className="flex items-center gap-3">
                <img
                  src={resource.profiles.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'}
                  alt={resource.profiles.username}
                  className="w-10 h-10 rounded-full border border-primary/20 cursor-pointer"
                  onClick={() => setPath(`#/profile/${resource.profiles?.id}`)}
                />
                <div className="flex flex-col">
                  <span 
                    className="text-white font-bold text-sm leading-tight hover:text-primary cursor-pointer transition-colors"
                    onClick={() => setPath(`#/profile/${resource.profiles?.id}`)}
                  >
                    {resource.profiles.username}
                  </span>
                  {resource.profiles.is_premium ? (
                    <span className="text-[10px] text-primary font-mono uppercase tracking-widest">Premium Developer</span>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-mono uppercase">Minecraft Builder</span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (resource.profiles) {
                  setPath(`#/profile/${resource.profiles.id}`);
                }
              }}
              className="w-full mt-2 py-2 bg-[#1c1c1c] hover:bg-[#252525] text-gray-300 font-display font-semibold text-xs tracking-wider uppercase rounded-sm border border-[#2c2c2c]"
            >
              Examine Developer Portfolio
            </button>
          </div>
        </div>
      </div>

      {downloadNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in animate-duration-200">
          <div className="bg-[#0b0b0b] border border-primary/40 p-6 rounded-lg shadow-xl shadow-primary/20 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary animate-bounce">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-white uppercase tracking-wider text-sm">SECURE LINK RESOLVED</h3>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              {downloadNotification}
            </p>
            <div className="w-full bg-[#151515] h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-2000 linear" style={{ width: '100%', animation: 'progress 2s linear forwards' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
