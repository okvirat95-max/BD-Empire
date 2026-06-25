import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, ThumbsUp, ThumbsDown, Share2, Tag, Send, 
  Sparkles, CheckCircle2, Image, Terminal, HelpCircle,
  TrendingUp, BookOpen, Shield, ShieldCheck
} from 'lucide-react';
import { CommunityPost, Comment, User } from '../types';
import { addCommunityPost, addCommunityComment, updatePostLikes, updateUserProfileStats } from '../lib/supabase';
import { checkRateLimit } from '../lib/rateLimit';

interface CommunityProps {
  posts: CommunityPost[];
  setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  addToast: (message: string, type: 'success' | 'info' | 'error' | 'premium') => void;
}

export default function Community({
  posts,
  setPosts,
  user,
  setUser,
  addToast
}: CommunityProps) {
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [postCategory, setPostCategory] = useState<'announcement' | 'showcase' | 'discussion' | 'question'>('discussion');
  
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle publishing a new community post
  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      addToast('Authenticate your profile to broadcast community updates!', 'error');
      return;
    }

    if (!newPostContent.trim()) {
      addToast('Post content description cannot be empty.', 'error');
      return;
    }

    const tagsArray = newPostTags
      .split(',')
      .map(t => t.trim().replace('#', ''))
      .filter(Boolean);

    const finalTags = tagsArray.length > 0 ? tagsArray : [postCategory, 'config', 'server'];

    const generatedPost: CommunityPost = {
      id: `post-${Date.now()}`,
      author: user.username,
      avatarEmoji: user.avatarUrl,
      avatarBg: 'bg-gradient-to-tr from-brand-purple to-brand-crimson',
      isVerified: true,
      content: newPostContent,
      tags: finalTags,
      likes: 1,
      comments: [],
      date: 'Just now',
      hasLiked: true,
      imageUrl: newPostImageUrl.trim() || undefined
    };

    // Save to Supabase
    addCommunityPost(generatedPost, user.id || 'anonymous').catch(console.error);

    setPosts(prev => [generatedPost, ...prev]);
    setNewPostContent('');
    setNewPostTags('');
    setNewPostImageUrl('');
    addToast(`Posted successfully in #${postCategory}!`, 'success');
  };

  // Toggle upvote / downvote logic
  const handleLikePost = (postId: string) => {
    let finalLikes = 0;
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        let likeDiff = 0;
        let hasLikedNow = !post.hasLiked;
        let hasDislikedNow = false;

        if (post.hasLiked) {
          likeDiff = -1;
        } else {
          likeDiff = 1;
          if (post.hasDisliked) {
            likeDiff += 1;
          }
        }

        finalLikes = post.likes + likeDiff;
        updatePostLikes(postId, finalLikes).catch(console.error);

        return {
          ...post,
          likes: finalLikes,
          hasLiked: hasLikedNow,
          hasDisliked: hasDislikedNow
        };
      }
      return post;
    }));
  };

  const handleDislikePost = (postId: string) => {
    let finalLikes = 0;
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        let likeDiff = 0;
        let hasDislikedNow = !post.hasDisliked;
        let hasLikedNow = false;

        if (post.hasDisliked) {
          likeDiff = 1;
        } else {
          likeDiff = -1;
          if (post.hasLiked) {
            likeDiff -= 1;
          }
        }

        finalLikes = post.likes + likeDiff;
        updatePostLikes(postId, finalLikes).catch(console.error);

        return {
          ...post,
          likes: finalLikes,
          hasLiked: hasLikedNow,
          hasDisliked: hasDislikedNow
        };
      }
      return post;
    }));
  };

  // Handle adding comments to feed posts
  const handleAddComment = async (postId: string) => {
    if (!user) {
      addToast('Authenticate your profile to add replies!', 'error');
      return;
    }
    if (!newCommentText.trim()) {
      addToast('Comment text content cannot be blank.', 'error');
      return;
    }

    // Comment Rate Limiting (Enterprise Hardening)
    const rateLimitCheck = await checkRateLimit('comment', user.email);
    if (!rateLimitCheck.allowed) {
      addToast(rateLimitCheck.message || 'Comment reply rate limited.', 'error');
      return;
    }

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: user.username,
      avatarEmoji: user.avatarUrl,
      avatarBg: 'bg-brand-purple',
      content: newCommentText,
      date: 'Just now',
      upvotes: 0
    };

    addCommunityComment(postId, {
      author: user.username,
      avatarEmoji: user.avatarUrl,
      avatarBg: 'bg-brand-purple',
      content: newCommentText,
      date: 'Just now',
      upvotes: 0
    }).catch(console.error);

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    setNewCommentText('');
    addToast('Replied successfully to the thread!', 'success');
  };

  // Filter posts based on active tab and search query
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery.trim() === '' || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeCategoryFilter === 'all') return true;
    if (activeCategoryFilter === 'announcements') return post.tags.includes('announcement') || post.content.toLowerCase().includes('announce');
    if (activeCategoryFilter === 'showcases') return post.tags.includes('showcase') || post.tags.includes('models') || post.imageUrl !== undefined;
    if (activeCategoryFilter === 'questions') return post.tags.includes('question') || post.content.includes('?');
    if (activeCategoryFilter === 'discussions') return post.tags.includes('discussion') || (!post.tags.includes('announcement') && !post.tags.includes('question'));

    return true;
  });

  return (
    <div id="community-section" className="w-full max-w-7xl mx-auto py-8 px-4 text-left grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN - MAIN FEED */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Sub-Tabs Filter & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-950/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-2xl">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 shrink-0">
            {[
              { id: 'all', name: 'All Topics', icon: HelpCircle },
              { id: 'announcements', name: 'Announcements', icon: ShieldCheck },
              { id: 'showcases', name: 'Showcases', icon: Sparkles },
              { id: 'questions', name: 'Questions', icon: HelpCircle },
              { id: 'discussions', name: 'Discussions', icon: MessageSquare }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeCategoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryFilter(tab.id)}
                  className={`flex items-center gap-2 h-9 px-3.5 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-brand-purple/10 border-brand-purple text-brand-purple shadow-sm'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          <div className="relative flex-grow sm:max-w-xs">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 bg-slate-900/60 border border-slate-850 focus:border-brand-purple/60 rounded-xl pl-3 pr-8 text-xs focus:outline-none text-white transition-all placeholder-slate-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px] font-mono"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Post Composition Panel */}
        <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-5 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid-dense opacity-5 pointer-events-none" />
          
          <div className="flex gap-4 items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-crimson flex items-center justify-center text-xl shadow overflow-hidden flex-shrink-0">
              {user?.avatarUrl && (user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://')) ? (
                <img src={user.avatarUrl} alt={user?.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user?.avatarUrl || (user?.username?.charAt(0).toUpperCase() || '?')
              )}
            </div>
            
            <form onSubmit={handlePublishPost} className="flex-grow flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'discussion', label: 'Discussion', col: 'hover:border-brand-purple', active: 'bg-brand-purple/10 border-brand-purple text-brand-purple' },
                  { id: 'showcase', label: 'Showcase', col: 'hover:border-brand-cyan', active: 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' },
                  { id: 'question', label: 'Ask Question', col: 'hover:border-brand-gold', active: 'bg-brand-gold/10 border-brand-gold text-brand-gold' },
                  { id: 'announcement', label: 'Announcement', col: 'hover:border-brand-crimson', active: 'bg-brand-crimson/10 border-brand-crimson text-brand-crimson' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPostCategory(cat.id as any)}
                    className={`h-7 px-3 rounded-lg border text-[10px] font-mono transition-all font-bold ${
                      postCategory === cat.id ? cat.active : 'bg-slate-900/40 border-slate-900 text-slate-500 ' + cat.col
                    }`}
                  >
                    {cat.label.toUpperCase()}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                required
                placeholder="Share a configuration showcase, ask a setup question, or post a general server announcement..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800 focus:border-brand-purple rounded-2xl p-4 text-xs focus:outline-none text-white transition-all resize-none placeholder-slate-500 font-sans"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Tags (comma separated: setup, optimal)"
                    value={newPostTags}
                    onChange={(e) => setNewPostTags(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 focus:border-brand-purple rounded-xl text-[10px] font-sans placeholder-slate-600 focus:outline-none text-white transition-colors"
                  />
                </div>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="url"
                    placeholder="Screenshot URL (optional)"
                    value={newPostImageUrl}
                    onChange={(e) => setNewPostImageUrl(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 focus:border-brand-purple rounded-xl text-[10px] font-sans placeholder-slate-600 focus:outline-none text-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-brand-purple" /> Clean markdown supported
                </span>
                <button
                  type="submit"
                  className="h-9 px-5 bg-gradient-to-tr from-brand-crimson to-brand-purple hover:brightness-110 active:scale-95 text-[10px] font-sans font-bold text-white uppercase rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Dynamic Timeline Stream Feed */}
        <div className="flex flex-col gap-6">
          <AnimatePresence>
            {filteredPosts.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-16 text-center my-4 flex flex-col items-center justify-center relative overflow-hidden">
                <MessageSquare className="w-12 h-12 text-brand-purple/40 mb-4 animate-pulse" />
                <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-widest">No Posts Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">No community conversations matched your filters or search keys. Write a custom post to start a conversation!</p>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const isAnn = post.tags.includes('announcement') || post.content.toLowerCase().includes('announce');
                const isQue = post.tags.includes('question') || post.content.includes('?');
                const isShow = post.tags.includes('showcase') || post.imageUrl !== undefined;

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-slate-950/80 border rounded-3xl p-6 backdrop-blur-2xl hover:border-slate-800 transition-all ${
                      isAnn ? 'border-brand-crimson/15' :
                      isQue ? 'border-brand-gold/15' :
                      isShow ? 'border-brand-cyan/15' : 'border-slate-900'
                    }`}
                  >
                    {/* Author profile row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl ${post.avatarBg} flex items-center justify-center text-lg shadow overflow-hidden flex-shrink-0`}>
                          {post.avatarEmoji && (post.avatarEmoji.startsWith('http://') || post.avatarEmoji.startsWith('https://')) ? (
                            <img src={post.avatarEmoji} alt={post.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            post.avatarEmoji || (post.author?.charAt(0).toUpperCase() || '?')
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-sans font-black text-slate-200">{post.author}</span>
                            {post.isVerified && (
                              <span className="text-[8px] font-mono bg-brand-cyan text-slate-950 font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 mt-0.5">{post.date}</span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-mono px-2.5 py-0.5 rounded border ${
                        isAnn ? 'bg-brand-crimson/10 border-brand-crimson/20 text-brand-crimson' :
                        isQue ? 'bg-brand-gold/10 border-brand-gold/20 text-brand-gold' :
                        isShow ? 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan' :
                        'bg-brand-purple/10 border-brand-purple/20 text-brand-purple'
                      }`}>
                        {isAnn ? 'ANNOUNCEMENT' :
                         isQue ? 'FORUM QUESTION' :
                         isShow ? 'SHOWCASE' : 'DISCUSSION'}
                      </span>
                    </div>

                    {/* Broadcast Content */}
                    <p className="text-xs text-slate-300 font-sans leading-relaxed mb-4 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Image Attachment */}
                    {post.imageUrl && (
                      <div className="mb-4 rounded-2xl overflow-hidden border border-slate-900 max-h-80 relative group bg-slate-900/20">
                        <img 
                          src={post.imageUrl} 
                          alt="Community attachment preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full max-h-80 object-cover group-hover:scale-[1.01] transition-transform duration-500"
                        />
                      </div>
                    )}

                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="text-[9px] font-sans font-extrabold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-900 uppercase"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Interactivity bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs font-mono">
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            post.hasLiked ? 'text-brand-crimson font-bold' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{post.likes}</span>
                        </button>

                        <button
                          onClick={() => handleDislikePost(post.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            post.hasDisliked ? 'text-brand-purple font-bold' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id);
                          }}
                          className={`flex items-center gap-1.5 transition-colors ${
                            activeCommentPostId === post.id ? 'text-white font-bold' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{post.comments.length} Comments</span>
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + '?post=' + post.id);
                          addToast('Thread broadcast link copied to clipboard!', 'info');
                        }}
                        className="text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share
                      </button>
                    </div>

                    {/* Inline Comment Panel */}
                    <AnimatePresence>
                      {activeCommentPostId === post.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-slate-900 flex flex-col gap-3 overflow-hidden"
                        >
                          {/* Comments list */}
                          <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                            {post.comments.length === 0 ? (
                              <p className="text-[10px] text-slate-600 font-sans italic text-center p-3.5 bg-slate-900/10 rounded-xl border border-slate-900">
                                No comments yet. Be the first to reply!
                              </p>
                            ) : (
                              post.comments.map((comment) => (
                                <div key={comment.id} className="p-3 rounded-xl bg-slate-900/30 border border-slate-900/60 flex gap-3 items-start">
                                  <div className={`w-7 h-7 rounded-lg ${comment.avatarBg} flex items-center justify-center text-sm flex-shrink-0 overflow-hidden`}>
                                    {comment.avatarEmoji && (comment.avatarEmoji.startsWith('http://') || comment.avatarEmoji.startsWith('https://')) ? (
                                      <img src={comment.avatarEmoji} alt={comment.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      comment.avatarEmoji || '💬'
                                    )}
                                  </div>
                                  <div className="flex-grow">
                                    <div className="flex justify-between text-[9px] font-sans">
                                      <span className="font-extrabold text-slate-300">{comment.author}</span>
                                      <span className="text-slate-500 font-mono">{comment.date}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed mt-0.5">{comment.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Write comment input bar */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Write a response..."
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                              className="flex-grow h-9 bg-slate-900 border border-slate-850 focus:border-brand-purple rounded-xl text-xs px-3 focus:outline-none text-white placeholder-slate-600 font-sans"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              className="h-9 px-4 bg-brand-purple/20 hover:bg-brand-purple text-brand-purple hover:text-white rounded-xl text-[10px] font-sans font-bold uppercase transition-all"
                            >
                              Reply
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT COLUMN - CLEAN COMMUNITY SIDEBAR */}
      <div className="flex flex-col gap-6">
        
        {/* Community Rules & Guidelines */}
        <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-4 text-brand-purple">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-mono uppercase tracking-widest font-black">Rules & Guidelines</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            Welcome to the DarkLeaker community! To maintain a safe and productive ecosystem, please adhere to our core protocols:
          </p>
          <ul className="flex flex-col gap-3 text-[11px] text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-brand-purple font-mono mt-0.5">01 //</span>
              <span><strong>Pristine Uploads:</strong> Only share tested, safe, and fully functional server configurations or game assets.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-purple font-mono mt-0.5">02 //</span>
              <span><strong>Respect Ownership:</strong> Do not re-upload or claim other creators' models, schematics, or scripts without permission.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-purple font-mono mt-0.5">03 //</span>
              <span><strong>Constructive Feedback:</strong> Rate products on the marketplace honestly and support community creators constructively.</span>
            </li>
          </ul>
        </div>

        {/* FAQ - Frequently Asked Questions */}
        <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl text-left relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 text-brand-cyan">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-mono uppercase tracking-widest font-black">Help Center & FAQ</span>
          </div>
          
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-[11px] font-sans font-black text-slate-200">Q: How do I become a Verified Creator?</h4>
              <p className="text-[11.5px] text-slate-400 leading-relaxed mt-1">
                Publish at least 3 high-quality configurations or assets that achieve positive ratings on our Marketplace.
              </p>
            </div>
            
            <div className="border-t border-slate-900/60 pt-3">
              <h4 className="text-[11px] font-sans font-black text-slate-200">Q: Are resources virus-scanned?</h4>
              <p className="text-[11.5px] text-slate-400 leading-relaxed mt-1">
                Absolutely. All submitted configuration payloads are scanned and verified before appearing in the public feed.
              </p>
            </div>

            <div className="border-t border-slate-900/60 pt-3">
              <h4 className="text-[11px] font-sans font-black text-slate-200">Q: How do I download purchased assets?</h4>
              <p className="text-[11.5px] text-slate-400 leading-relaxed mt-1">
                Go to the Marketplace tab, purchase with your token allowance, and click download. All configurations are downloaded as ZIP payloads.
              </p>
            </div>
          </div>
        </div>

        {/* Clickable Trending Tags List */}
        <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-5 backdrop-blur-2xl text-left">
          <span className="text-[9px] font-mono text-brand-cyan uppercase tracking-widest block mb-4 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Hot Discussion Tags
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { tag: 'announcement', count: 5 },
              { tag: 'optimal', count: 12 },
              { tag: 'config', count: 24 },
              { tag: 'paper', count: 18 },
              { tag: 'setup', count: 14 },
              { tag: 'spigot', count: 9 },
              { tag: 'performance', count: 16 }
            ].map((trend) => (
              <button
                key={trend.tag}
                onClick={() => {
                  setSearchQuery(trend.tag);
                  addToast(`Filtered feed by hashtag #${trend.tag}`, 'info');
                }}
                className="px-3 py-1.5 bg-slate-900/60 hover:bg-brand-purple/10 border border-slate-850 hover:border-brand-purple/40 text-[10px] font-mono rounded-xl text-slate-400 hover:text-white flex items-center gap-1.5 transition-all"
              >
                <span>#{trend.tag}</span>
                <span className="text-[8px] font-mono opacity-50 bg-slate-950 px-1 rounded">{trend.count}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
