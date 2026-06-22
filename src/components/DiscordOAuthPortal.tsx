import React, { useState } from 'react';
import { Shield, Sparkles, User, Info, Check, LogIn } from 'lucide-react';
import { loginDiscordUser } from '../lib/db';

export default function DiscordOAuthPortal() {
  const [discordId, setDiscordId] = useState('382103405908230144');
  const [username, setUsername] = useState('DarkleakerOwner');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const portalAvatars = [
    'https://raw.githubusercontent.com/Ansh-Pradhan/DARKLEAKER/main/admin_avatar.png',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200'
  ];

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordId.trim() || !username.trim()) {
      alert('Must supply both a realistic Discord ID & Username handles');
      return;
    }
    setLoading(true);
    try {
      const avatar = portalAvatars[avatarIndex];
      await loginDiscordUser(discordId.trim(), username.trim(), avatar);
      
      // Post success back to the opener window
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
        setTimeout(() => {
          window.close();
        }, 300);
      } else {
        // Fallback redirection if loaded directly
        window.location.hash = '#/dashboard';
      }
    } catch (e: any) {
      alert(e?.message || 'Authorization failed');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (id: string, name: string, avIndex: number) => {
    setDiscordId(id);
    setUsername(name);
    setAvatarIndex(avIndex);
  };

  return (
    <div className="min-h-screen bg-[#2f3136] text-[#dcddde] font-sans flex flex-col justify-between select-none">
      {/* Header Panel */}
      <div className="bg-[#202225] border-b border-[#18191c] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center font-black text-white text-base">
            D
          </div>
          <span className="font-bold text-white text-[15px] tracking-wide">Discord Developer Portal</span>
        </div>
        <span className="text-xs text-[#b9bbbe] font-mono select-all">v10 API Auth System</span>
      </div>

      {/* Main Core Form */}
      <div className="max-w-[480px] w-full mx-auto p-8 bg-[#36393f] border border-[#232428] rounded-md shadow-2xl my-auto space-y-6">
        <div className="text-center space-y-2">
          <img
            src="https://raw.githubusercontent.com/Ansh-Pradhan/DARKLEAKER/main/admin_avatar.png"
            alt="DARKLEAKER"
            className="w-16 h-16 rounded-full mx-auto border-2 border-[#5865F2] p-0.5 object-cover"
          />
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">DARKLEAKER CONNECT</h2>
          <p className="text-xs text-[#b9bbbe]">
            An external platform is requesting permission to link to your Discord account.
          </p>
        </div>

        {/* Informational Connection Banner */}
        <div className="p-3 bg-[#2f3136] rounded-md border border-[#202225] text-xs space-y-1">
          <h4 className="text-[#eee] font-bold flex items-center gap-1.5 uppercase font-mono text-[10px]">
            <Info className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>AI Studio Integration Link</span>
          </h4>
          <p className="text-[#a3a6aa] leading-relaxed text-[11px]">
            To comply with the strict system constraints inside interactive iframe previews, this frame simulates real Discord OAuth flows safely. Utilizing preset or custom configurations generates fully functional profiles.
          </p>
        </div>

        {/* Preset accounts */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase text-[#b9bbbe] tracking-wider block">OAuth Preset Profiles</label>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              onClick={() => setPreset('382103405908230144', 'DarkleakerOwner', 0)}
              className={`p-2.5 text-left rounded border transition-all flex items-center justify-between ${
                discordId === '382103405908230144' 
                  ? 'bg-[#5865F2]/15 border-[#5865F2] text-white' 
                  : 'bg-[#2f3136] border-[#202225] hover:bg-[#32353b]'
              }`}
            >
              <div>
                <div className="font-semibold text-white flex items-center gap-1">
                  Owner Admin <Shield className="w-3 h-3 text-red-500" />
                </div>
                <div className="text-[10px] text-gray-400">ID: ...30144</div>
              </div>
              {discordId === '382103405908230144' && <Check className="w-4 h-4 text-[#5865F2]" />}
            </button>

            <button
              onClick={() => setPreset('589214705321873104', 'MinecrafterSteve', 1)}
              className={`p-2.5 text-left rounded border transition-all flex items-center justify-between ${
                discordId === '589214705321873104' 
                  ? 'bg-[#5865F2]/15 border-[#5865F2] text-white' 
                  : 'bg-[#2f3136] border-[#202225] hover:bg-[#32353b]'
              }`}
            >
              <div>
                <div className="font-semibold text-white flex items-center gap-1">
                  Community Member
                </div>
                <div className="text-[10px] text-gray-400">ID: ...73104</div>
              </div>
              {discordId === '589214705321873104' && <Check className="w-4 h-4 text-[#5865F2]" />}
            </button>
          </div>
        </div>

        <form onSubmit={handleAuthorize} className="space-y-4">
          <div className="space-y-4 pt-2 border-t border-[#2f3136]">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#b9bbbe] tracking-wider block mb-1.5">Discord ID (Numerical string)</label>
              <input
                type="text"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 bg-[#202225] border border-[#18191c] rounded-md focus:border-[#5865F2] focus:outline-none text-white text-sm"
                placeholder="453298103498102340"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                {discordId === '382103405908230144' ? '⚠️ OWNER ID DETECTED - Owner clearance will load.' : 'Normal Community Member profile will load.'}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#b9bbbe] tracking-wider block mb-1.5">User Handle / Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[#202225] border border-[#18191c] rounded-md focus:border-[#5865F2] focus:outline-none text-white text-sm"
                placeholder="MinecrafterMax"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[#2f3136]">
            <button
              type="button"
              onClick={() => {
                if (window.opener) window.close();
                else window.history.back();
              }}
              className="flex-1 py-2 rounded bg-transparent border border-[#dcddde]/20 hover:border-[#dcddde]/40 text-[#dcddde] text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? 'Authorizing...' : 'Authorize'}
            </button>
          </div>
        </form>
      </div>

      {/* Footer System Info */}
      <div className="text-center pb-6 text-[10px] text-[#72767d] tracking-wider uppercase">
        Discord Inc. Auth System Endpoint • Complies with security policies
      </div>
    </div>
  );
}
