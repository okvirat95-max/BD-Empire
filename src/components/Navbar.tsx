import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, LogIn, LogOut, Terminal, ShoppingBag, PlusCircle, LayoutDashboard, HelpCircle, User, Award } from 'lucide-react';
import { Profile } from '../types';
import { logoutUser } from '../lib/db';
import { SUPABASE_URL } from '../lib/supabase';

interface NavbarProps {
  currentProfile: Profile | null;
  activePath: string;
  setPath: (path: string) => void;
  onProfileUpdate: () => void;
  supabaseConnected: boolean;
}

export default function Navbar({ currentProfile, activePath, setPath, onProfileUpdate, supabaseConnected }: NavbarProps) {
  const handleLogout = async () => {
    await logoutUser();
    onProfileUpdate();
    setPath('#/');
  };

  const handleConnect = () => {
    const popupWidth = 580;
    const popupHeight = 680;
    const left = window.screenX + (window.innerWidth - popupWidth) / 2;
    const top = window.screenY + (window.innerHeight - popupHeight) / 2;

    let authUrl = '';
    if (!supabaseConnected) {
      authUrl = `${window.location.origin}/#/discord-auth`;
    } else {
      authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=discord&redirect_to=${encodeURIComponent(window.location.origin + '/#oauth_callback=true')}`;
    }

    const popup = window.open(
      authUrl,
      'oauth_popup',
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      alert('Authentication window blocked! Please allow popups for this site to connect your Discord account.');
    }
  };

  const navItems = [
    { label: 'Marketplace', path: '#/marketplace', icon: ShoppingBag },
    { label: 'Premium', path: '#/premium', icon: Award },
    { label: 'Support', path: '#/support', icon: HelpCircle },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#050505]/95 border-b border-[#1f1f1f] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a 
              href="#/" 
              onClick={(e) => { e.preventDefault(); setPath('#/'); }} 
              className="flex items-center gap-2 group font-display font-black text-2xl tracking-widest text-white select-none"
            >
              <Terminal className="w-6 h-6 text-primary group-hover:rotate-12 transition-transform duration-300" />
              <span>DARK<span className="text-primary glow-red">LEAKER</span></span>
            </a>

            {/* Main Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePath === item.path;
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    onClick={(e) => { e.preventDefault(); setPath(item.path); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-display font-medium text-sm transition-all duration-300 ${
                      isActive 
                        ? 'text-primary bg-primary/5 border border-primary/20' 
                        : 'text-gray-400 hover:text-white hover:bg-[#111111]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-3">
            {currentProfile ? (
              <div className="flex items-center gap-3">
                {/* Upload Button */}
                <a
                  href="#/upload"
                  onClick={(e) => { e.preventDefault(); setPath('#/upload'); }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-display font-bold text-xs tracking-wider uppercase rounded-sm border border-primary/20 shadow-lg shadow-primary/10 hover:shadow-primary/25 transition-all duration-300"
                >
                  <PlusCircle className="w-4 h-4" />
                  Upload
                </a>

                {/* Logged-In Menu Options */}
                <div className="flex items-center gap-2 bg-[#111111] p-1 rounded-md border border-[#1f1f1f]">
                  <button
                    onClick={() => setPath('#/dashboard')}
                    className={`p-2 rounded-md text-gray-400 hover:text-white transition-colors duration-300 ${activePath === '#/dashboard' ? 'bg-[#1a1a1a] text-primary' : ''}`}
                    title="Dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </button>

                  {(currentProfile.role === 'admin' || currentProfile.role === 'owner') && (
                    <button
                      onClick={() => setPath('#/admin')}
                      className={`p-2 rounded-md text-gray-400 hover:text-white transition-colors duration-300 ${activePath === '#/admin' ? 'bg-primary/10 text-primary border border-primary/20' : ''}`}
                      title="Admin Control Unit"
                    >
                      <Shield className="w-4 h-4 text-primary" />
                    </button>
                  )}

                  <button
                    onClick={() => setPath(`#/profile/${currentProfile.id}`)}
                    className={`p-2 rounded-md text-gray-400 hover:text-white transition-colors duration-300 ${activePath.startsWith('#/profile/') ? 'bg-[#1a1a1a]' : ''}`}
                    title="User Profile"
                  >
                    <User className="w-4 h-4" />
                  </button>
                </div>

                {/* User Card */}
                <div className="flex items-center gap-2 pl-2 border-l border-[#1f1f1f]">
                  <img
                    src={currentProfile.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'}
                    alt={currentProfile.username}
                    className="w-8 h-8 rounded-full border border-primary/30"
                  />
                  <div className="hidden lg:flex flex-col">
                    <span className="text-white font-semibold text-xs leading-none">{currentProfile.username}</span>
                    {currentProfile.is_premium ? (
                      <span className="text-xs text-primary font-mono font-medium tracking-widest uppercase mt-0.5 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Premium
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">Free User</span>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-primary transition-colors duration-300"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={handleConnect}
                  className="flex items-center gap-2 px-5 py-2 hover:bg-[#111111]/80 text-white font-display font-bold text-xs tracking-wider uppercase border-l-2 border-primary bg-[#0d0d0d] rounded-sm transition-all duration-300 shadow-lg hover:shadow-primary/5 active:scale-[0.98] cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-primary" />
                  Connect Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
