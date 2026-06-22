import React, { useState } from 'react';
import { Terminal, PlusCircle, AlertCircle, HelpCircle, CheckCircle } from 'lucide-react';
import { Profile } from '../types';
import { createResource } from '../lib/db';

interface UploadPageProps {
  currentProfile: Profile | null;
  setPath: (path: string) => void;
}

export default function UploadPage({ currentProfile, setPath }: UploadPageProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'plugin' | 'skript' | 'config' | 'map' | 'setup' | 'resource_pack' | 'other'>('plugin');
  const [tagsInput, setTagsInput] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [mediafireUrl, setMediafireUrl] = useState('');
  const [isPremiumToggle, setIsPremiumToggle] = useState(false);

  // Status and logs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) {
      setErrorMsg('You must be connected to a profile before publishing resources.');
      return;
    }
    if (currentProfile.is_banned) {
      setErrorMsg('Your account has been banned. Upload privileges revoked.');
      return;
    }

    // Input validations
    if (!title.trim() || title.length < 5) {
      setErrorMsg('Resource title is too short (minimum 5 characters).');
      return;
    }
    if (!description.trim() || description.length < 20) {
      setErrorMsg('Please supply a descriptive description of at least 20 characters.');
      return;
    }
    if (!mediafireUrl.trim()) {
      setErrorMsg('Mediafire download link is required.');
      return;
    }

    // Mediafire URL prefix check
    const loweredMF = mediafireUrl.toLowerCase().trim();
    if (!loweredMF.startsWith('http://') && !loweredMF.startsWith('https://')) {
      setErrorMsg('Downloads must specify a valid HTTP protocols URL.');
      return;
    }
    if (!loweredMF.includes('mediafire.com')) {
      setErrorMsg('Storage constraints mandate Mediafire links only. Links must point to mediafire.com');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Split tags comma values
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const parsedResource = await createResource({
        title: title.trim(),
        description: description.trim(),
        category,
        tags,
        thumbnail_url: thumbnailUrl.trim() || null,
        mediafire_url: mediafireUrl.trim(),
        is_premium: isPremiumToggle,
        author_id: currentProfile.id,
        is_featured: false,
      });

      if (parsedResource) {
        const isAdminOrOwner = currentProfile.role === 'admin' || currentProfile.role === 'owner';
        if (isAdminOrOwner) {
          setSuccessMsg('⚡ Resource created and auto-approved because you are an Administrator! Moving to marketplace.');
          setTimeout(() => {
            setPath(`#/resource/${parsedResource.id}`);
          }, 2000);
        } else {
          setSuccessMsg('🎉 Successfully submitted for approval! Admins will inspect and publish your resource shortly.');
          // reset inputs
          setTitle('');
          setDescription('');
          setTagsInput('');
          setThumbnailUrl('');
          setMediafireUrl('');
          setIsPremiumToggle(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Transmission failed. Failed to register database record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentProfile) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6">
        <Terminal className="w-12 h-12 text-primary mx-auto" />
        <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider">CONNECTION REQUIRED</h2>
        <p className="text-gray-400 font-sans text-sm leading-relaxed">
          Hosting Minecraft resources on the DARKLEAKER matrix requires an authenticated Discord handshake. 
          Use the client connector menu at top right to establish a session.
        </p>

        <div className="relative flex py-4 items-center max-w-sm mx-auto">
          <div className="flex-grow border-t border-[#1f1f1f]"></div>
          <span className="flex-shrink mx-3 text-[10px] text-gray-500 font-mono">OR VISIT GENERAL PUBLIC PRODUCTS</span>
          <div className="flex-grow border-t border-[#1f1f1f]"></div>
        </div>

        <button
          onClick={() => setPath('#/marketplace')}
          className="px-6 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-display font-bold text-xs uppercase"
        >
          Browse Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-fade-in">
      <div className="border-b border-[#111] pb-6">
        <div className="flex items-center gap-3">
          <PlusCircle className="w-8 h-8 text-primary glow-red" />
          <div>
            <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight">PUBLISH NEW RESOURCE</h1>
            <p className="text-gray-500 text-xs font-mono">UPLOAD CHANNEL / AUDITED BY DEFENSE DIVISION</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Core fields column */}
        <div className="md:col-span-8 space-y-6">
          <div className="bg-[#111111]/40 border border-[#1f1f1f] rounded-lg p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Resource Title *</label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="e.g., [1.20-1.21] Ultimate Factions Setup | custom items & keys"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] focus:border-primary/40 rounded-sm p-3 text-white text-sm outline-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Product Specifications & Install Notes *</label>
              <textarea
                required
                rows={10}
                placeholder="List key features, installation dependencies (such as Skript, PlaceholderAPI, dependency libraries), and commands configuration notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] focus:border-primary/40 rounded-sm p-3 text-white text-sm outline-none placeholder-gray-600 font-sans leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Settings column */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-6 space-y-6">
            <h3 className="font-display font-black text-xs text-white uppercase tracking-widest border-b border-[#1f1f1f] pb-3">
              CLASSIFICATION & HOSTING
            </h3>

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-gray-500 uppercase">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-sm p-2 text-white text-xs font-mono outline-none"
              >
                <option value="plugin">Plugin (jar)</option>
                <option value="skript">Skript (sk)</option>
                <option value="config">Configuration (yml)</option>
                <option value="map">Schematic / Map</option>
                <option value="setup">Server Setup</option>
                <option value="resource_pack">Resource Pack</option>
                <option value="other">Other Asset</option>
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-gray-500 uppercase">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="ffa, custom, kitpvp, premium"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] focus:border-primary/40 rounded-sm p-2 text-white text-xs font-mono outline-none"
              />
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-gray-500 uppercase">Thumbnail Image URL</label>
              <input
                type="url"
                placeholder="https://imgur.com/... or https://i.imgur.com/..."
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] focus:border-primary/40 rounded-sm p-2 text-white text-xs outline-none"
              />
            </div>

            {/* Mediafire Link */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-gray-500 uppercase">Mediafire URL *</label>
              <input
                type="url"
                required
                placeholder="https://www.mediafire.com/file/..."
                value={mediafireUrl}
                onChange={(e) => setMediafireUrl(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] focus:border-primary/40 rounded-sm p-2 text-white text-xs outline-none"
              />
              <span className="text-[10px] text-gray-500 font-mono italic block leading-snug">
                Owner storage space constraints prohibit local database blobs. File assets must point strictly to MediaFire folders.
              </span>
            </div>

            {/* Premium Toggle */}
            <div className="flex items-center justify-between p-3 bg-[#0d0d0d] border border-[#1f1f1f] rounded-sm">
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Premium File</span>
                <span className="text-[9px] text-gray-500 font-mono">Restricted to Premium profiles</span>
              </div>
              <input
                type="checkbox"
                checked={isPremiumToggle}
                onChange={(e) => setIsPremiumToggle(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-red-600 rounded bg-black border-red-900"
              />
            </div>

            {/* Notification logs */}
            {errorMsg && (
              <div className="p-3 bg-red-900/10 border border-primary/20 text-red-400 rounded-sm text-xs font-mono flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-900/10 border border-green-500/20 text-green-400 rounded-sm text-xs font-mono flex items-start gap-2 leading-relaxed">
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action buttons */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-display font-black text-xs tracking-widest uppercase rounded-sm cursor-pointer border border-primary/20 shadow-lg shadow-primary/10 hover:shadow-primary/25 disabled:opacity-50 transition-all duration-300"
            >
              {isSubmitting ? 'Transmitting Data...' : 'SUBMIT UPLOAD RESOURCE'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
