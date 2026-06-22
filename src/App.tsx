import React, { useState, useEffect } from 'react';
import { Terminal, Shield, RefreshCw, AlertTriangle, FileText, Check, Copy, X } from 'lucide-react';
import { getCurrentProfile, testSupabaseConnection } from './lib/db';
import { Profile } from './types';

// Importing Custom Component Chapters
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import MarketplacePage from './components/MarketplacePage';
import ResourcePage from './components/ResourcePage';
import UploadPage from './components/UploadPage';
import DashboardPage from './components/DashboardPage';
import ProfilePage from './components/ProfilePage';
import PremiumPage from './components/PremiumPage';
import SupportPage from './components/SupportPage';
import AdminPanel from './components/AdminPanel';
import DiscordOAuthPortal from './components/DiscordOAuthPortal';

export default function App() {
  const [path, setPath] = useState<string>('#/');
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Database probe indicator and SQL modal
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(true);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);

  // Load and subscribe to profile states
  const fetchSessionProfile = async () => {
    const prof = await getCurrentProfile();
    setCurrentProfile(prof);
  };

  const checkConnection = async () => {
    const connected = await testSupabaseConnection();
    setSupabaseConnected(connected);
  };

  useEffect(() => {
    checkConnection();
    fetchSessionProfile();

    // Parse initial queries and hash callbacks
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    const error = searchParams.get('error') || hashParams.get('error');
    const errorDesc = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error_code') || hashParams.get('error_code');
    const accessToken = searchParams.get('access_token') || hashParams.get('access_token');

    if (error || errorDesc) {
      const msg = errorDesc ? decodeURIComponent(errorDesc).replace(/\+/g, ' ') : error || 'Discord credentials exchange failed.';
      setOauthError(msg);
      // Clean query and hash to restore proper router environment
      window.history.replaceState(null, '', window.location.pathname);
      window.location.hash = '#/';
      setPath('#/');
    } else if (accessToken) {
      window.history.replaceState(null, '', window.location.pathname);
      window.location.hash = '#/';
      setPath('#/');
      fetchSessionProfile();
    } else {
      // Set initial hash pathway
      if (window.location.hash) {
        setPath(window.location.hash);
      } else {
        window.location.hash = '#/';
        setPath('#/');
      }
    }

    // Monitor Hash shifts
    const handleHashShift = () => {
      const h = window.location.hash || '#/';
      
      // If of error/access_token gets appended in the active window
      if (h.includes('error=') || h.includes('error_description=')) {
        const hParams = new URLSearchParams(h.substring(1));
        const errKey = hParams.get('error') || 'OAuth configuration mismatched';
        const errDescVal = hParams.get('error_description') || '';
        const combined = errDescVal ? decodeURIComponent(errDescVal).replace(/\+/g, ' ') : errKey;
        
        setOauthError(combined);
        window.history.replaceState(null, '', window.location.pathname);
        window.location.hash = '#/';
        setPath('#/');
        return;
      }
      
      setPath(h);

      // Close popup if it represents a callback success
      if (window.opener && (h.includes('access_token=') || h.includes('oauth_callback=true') || h.includes('error='))) {
        setTimeout(() => {
          try {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
            window.close();
          } catch (e) {
            console.error(e);
          }
        }, 1200);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // OAuth message handler
    const handleOauthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchSessionProfile();
      }
    };

    window.addEventListener('hashchange', handleHashShift);
    window.addEventListener('message', handleOauthMessage);

    // Immediate check
    const curHash = window.location.hash || '';
    if (window.opener && (curHash.includes('access_token=') || curHash.includes('oauth_callback=true') || curHash.includes('error='))) {
      setTimeout(() => {
        try {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
          window.close();
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }

    return () => {
      window.removeEventListener('hashchange', handleHashShift);
      window.removeEventListener('message', handleOauthMessage);
    };
  }, []);

  const handleCopySql = () => {
    const sqlScript = `-- Paste this inside Supabase SQL editor to launch DARKLEAKER instantly:
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    discord_id VARCHAR(100),
    is_premium BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user' NOT NULL, -- 'user', 'admin', 'owner'
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`;
    navigator.clipboard.writeText(sqlScript);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // 4. Custom Page Navigation Router Rendering
  const renderRouterPage = () => {
    // A. Root Home Selector
    if (path === '#/' || path === '') {
      return (
        <HomePage 
          setPath={(p) => { window.location.hash = p; setPath(p); }} 
          setSelectedResourceId={setSelectedResourceId}
          currentProfile={currentProfile}
        />
      );
    }

    // B. Marketplace Selector
    if (path === '#/marketplace') {
      return (
        <MarketplacePage 
          setPath={(p) => { window.location.hash = p; setPath(p); }} 
          setSelectedResourceId={setSelectedResourceId}
        />
      );
    }

    // C. Resource Detail Sub-path Tracker
    if (path.startsWith('#/resource/')) {
      const extractedId = path.split('#/resource/')[1];
      const targetId = extractedId || selectedResourceId;
      return (
        <ResourcePage 
          resourceId={targetId} 
          currentProfile={currentProfile}
          setPath={(p) => { window.location.hash = p; setPath(p); }}
        />
      );
    }

    // D. Upload Form Selector
    if (path === '#/upload') {
      return (
        <UploadPage 
          currentProfile={currentProfile} 
          setPath={(p) => { window.location.hash = p; setPath(p); }}
        />
      );
    }

    // E. Dashboard Selector
    if (path === '#/dashboard') {
      return (
        <DashboardPage 
          currentProfile={currentProfile} 
          setPath={(p) => { window.location.hash = p; setPath(p); }}
          setSelectedResourceId={setSelectedResourceId}
          onProfileUpdate={fetchSessionProfile}
        />
      );
    }

    // F. User Profile Detail Subpath Tracker
    if (path.startsWith('#/profile/')) {
      const extractedProfId = path.split('#/profile/')[1];
      const targetProfId = extractedProfId || selectedProfileId;
      return (
        <ProfilePage 
          profileId={targetProfId} 
          setPath={(p) => { window.location.hash = p; setPath(p); }}
          setSelectedResourceId={setSelectedResourceId}
        />
      );
    }

    // G. Premium Portal Manual Explainer
    if (path === '#/premium') {
      return <PremiumPage />;
    }

    // H. Support FAQ Desk selector
    if (path === '#/support') {
      return <SupportPage />;
    }

    // I. Administrative Operations Panel
    if (path === '#/admin') {
      return (
        <AdminPanel 
          currentProfile={currentProfile} 
          setPath={(p) => { window.location.hash = p; setPath(p); }}
        />
      );
    }

    // J. Simulated Discord OAuth Portal
    if (path === '#/discord-auth') {
      return <DiscordOAuthPortal />;
    }

    // Fallback error standard viewport
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
        <Terminal className="w-12 h-12 text-primary mx-auto" />
        <h2 className="font-display font-black text-2xl text-white uppercase">404 PATHWAY RESTRICTION</h2>
        <p className="text-gray-400 font-sans text-xs">
          The requested coordinate is out of mapping bounds on this workspace grid. Try restoring standard index coordinates.
        </p>
        <button
          onClick={() => { window.location.hash = '#/'; setPath('#/'); }}
          className="px-6 py-2 bg-primary text-white text-xs font-mono font-bold"
        >
          FORCE RETURN PORT
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-between">
      <div>
        {/* Connection Failure Failover Alert banner */}
        {!supabaseConnected && (
          <div className="bg-[#ff0000]/10 border-b border-[#ff0000]/20 py-2.5 px-4 text-center font-mono text-[11px] text-[#ffdddd] flex items-center justify-center gap-2 flex-wrap">
            <AlertTriangle className="w-4 h-4 text-primary animate-pulse" />
            <span>
              DARKLEAKER database fallbacked safely to high-speed Local Cache. 
              Live Supabase operations launch once tables are synchronized.
            </span>
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3 py-1 bg-primary text-white uppercase text-[10px] font-bold hover:bg-red-700 transition-colors ml-2"
            >
              Get SQL Schema Code
            </button>
          </div>
        )}

        {/* OAuth Dispatch Notification banner */}
        {oauthError && (
          <div className="bg-[#ff0000]/15 border-[#ff0000]/30 border-b py-3 px-4 text-center font-mono text-[11px] text-[#ffdddd] flex items-center justify-center gap-2.5 relative transition-all duration-300">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping shrink-0" />
            <span className="font-extrabold text-primary uppercase tracking-widest shrink-0">AUTH DISPATCH ERROR:</span>
            <span className="leading-snug text-left pr-6">{oauthError}</span>
            <button 
              onClick={() => setOauthError(null)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global sticky Navigation block */}
        <Navbar 
          currentProfile={currentProfile} 
          activePath={path} 
          setPath={(p) => { window.location.hash = p; setPath(p); }}
          onProfileUpdate={fetchSessionProfile}
          supabaseConnected={supabaseConnected}
        />

        {/* Core dynamic content slot */}
        <main className="pb-12 text-white">
          {renderRouterPage()}
        </main>
      </div>

      {/* Global standard copyright and diagnostics footer block */}
      <Footer setPath={(p) => { window.location.hash = p; setPath(p); }} />

      {/* Database Schema copy Modal Overlay */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#111111] border border-[#1f1f1f] rounded-lg p-6 relative space-y-4">
            <button
              onClick={() => setShowSqlModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>SUPABASE SCHEMA COORDINATES</span>
            </h3>

            <p className="text-gray-400 font-sans text-xs leading-relaxed">
              DARKLEAKER supports direct connection to your live Supabase database! 
              Paste the generated SQL codes from the root directory into your <b>Supabase SQL Editor</b> to instantly populate the tables, triggers, and Row Level Security permissions.
            </p>

            <div className="bg-[#050505] border border-[#1f1f1f] p-3 rounded font-mono text-[10px] text-gray-400 overflow-x-auto max-h-48 select-all">
              <pre>{`-- Paste inside Supabase SQL Editor:
-- Tab 1: profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    discord_id VARCHAR(100),
    is_premium BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user' NOT NULL, -- 'user', 'admin', 'owner'
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`}</pre>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#1a1a1a]">
              <span className="text-[10px] font-mono text-gray-500">COMPLETE SCHEMA FILED IN /supabase_schema.sql</span>
              <button
                onClick={handleCopySql}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white uppercase font-display font-bold text-xs tracking-wider flex items-center gap-1.5"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sqlCopied ? 'Copied script' : 'Copy setup SQL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
