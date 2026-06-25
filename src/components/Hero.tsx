import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Compass, Shield, Users, ArrowUpRight, Zap, Play, Moon, Sun, CloudLightning } from 'lucide-react';
import { ThemeMode, WeatherType, User } from '../types';
import { updateUserProfileStats } from '../lib/supabase';

interface HeroProps {
  theme: ThemeMode;
  weather: WeatherType;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setActiveTab: (tab: string) => void;
  addToast: (message: string, type: 'success' | 'info' | 'error' | 'premium') => void;
}

export default function Hero({
  theme,
  weather,
  user,
  setUser,
  setActiveTab,
  addToast
}: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringCrystal, setIsHoveringCrystal] = useState(false);
  const [crystalHarvestProgress, setCrystalHarvestProgress] = useState(0);
  const [isHarvesting, setIsHarvesting] = useState(false);

  // Mouse tracking parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Normalized coordinates from -0.5 to 0.5
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Weather and Atmosphere Canvas Particle Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle Classes
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;
      angle: number;
      spinSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.angle = Math.random() * Math.PI * 2;
        this.spinSpeed = (Math.random() - 0.5) * 0.05;
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.6 + 0.2;

        if (weather === 'cyber-rain') {
          this.y = Math.random() * -50;
          this.speedY = Math.random() * 8 + 5;
          this.speedX = -1.5 - Math.random() * 1;
          this.color = 'rgba(6, 182, 212, ' + this.opacity + ')';
        } else if (weather === 'cosmic-snow') {
          this.y = Math.random() * -50;
          this.speedY = Math.random() * 1.5 + 0.8;
          this.speedX = (Math.random() - 0.5) * 1;
          this.color = 'rgba(255, 255, 255, ' + this.opacity + ')';
        } else if (weather === 'portal-storm') {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.size = Math.random() * 4 + 1.5;
          this.speedY = (Math.random() - 0.5) * 4;
          this.speedX = (Math.random() - 0.5) * 4;
          this.color = Math.random() > 0.5 
            ? 'rgba(139, 92, 246, ' + this.opacity + ')' 
            : 'rgba(255, 30, 86, ' + this.opacity + ')';
        } else {
          // Clear weather starfield drifting up
          this.y = Math.random() * height;
          this.speedY = -Math.random() * 0.4 - 0.1;
          this.speedX = (Math.random() - 0.5) * 0.2;
          this.color = theme === 'sunrise' 
            ? 'rgba(251, 191, 36, ' + this.opacity + ')' 
            : 'rgba(139, 92, 246, ' + this.opacity + ')';
        }
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += this.spinSpeed;

        if (this.y > height || this.x < 0 || this.x > width || this.y < -50) {
          this.reset();
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;

        if (weather === 'cosmic-snow') {
          // Voxel star snow
          ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        } else if (weather === 'cyber-rain') {
          // Matrix rain lines
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(this.speedX * 2, this.speedY * 2);
          ctx.strokeStyle = this.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (weather === 'portal-storm') {
          // Pulsing square sparks
          ctx.rotate(this.angle);
          ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        } else {
          // Soft dust particle
          ctx.beginPath();
          ctx.arc(0, 0, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    const particles: Particle[] = Array.from({ length: 120 }, () => new Particle());

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render futuristic cybernetic horizon grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      
      // Perspective ground drawing
      ctx.beginPath();
      for (let i = 0; i < width; i += gridSpacing) {
        ctx.moveTo(i, height * 0.65);
        ctx.lineTo(i + (i - width/2) * 1.5, height);
      }
      for (let j = height * 0.65; j < height; j += 15) {
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
      }
      ctx.stroke();

      // Draw lightning bolt sometimes in storm
      if (weather === 'portal-storm' && Math.random() > 0.995) {
        ctx.strokeStyle = 'rgba(255, 30, 86, 0.8)';
        ctx.shadowColor = 'rgba(255, 30, 86, 0.9)';
        ctx.shadowBlur = 30;
        ctx.lineWidth = 3;
        ctx.beginPath();
        let startX = Math.random() * width;
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX + (Math.random() - 0.5) * 100, height * 0.3);
        ctx.lineTo(startX + (Math.random() - 0.5) * 200, height * 0.6);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      // Draw particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [weather, theme]);

  // Crystal Core harvesting interaction handler
  const handleHarvestCore = () => {
    if (!user) {
      addToast('Authenticate your profile to harvest quantum crystal energy!', 'error');
      return;
    }
    if (isHarvesting) return;
    setIsHarvesting(true);
    addToast('Decrypting Quantum Crystal Power...', 'info');

    let current = 0;
    const interval = setInterval(() => {
      current += 4;
      setCrystalHarvestProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setIsHarvesting(false);
        setCrystalHarvestProgress(0);

        addToast('Successfully harvested! Quantum Crystal Core synchronized with database records.', 'premium');
      }
    }, 100);
  };

  return (
    <section 
      ref={containerRef}
      className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden py-16 px-6 lg:px-8 bg-slate-950"
    >
      {/* Living background simulation layers */}
      <div className={`absolute inset-0 transition-all duration-1000 ${
        theme === 'sunrise' ? 'bg-overworld-sunrise' : theme === 'nebula' ? 'bg-ender-nebula' : 'bg-midnight-void'
      }`} />
      
      {/* Scanline and holographic texture overlay */}
      <div className="absolute inset-0 cyber-grid opacity-50 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 scanlines opacity-10 pointer-events-none" />

      {/* Dynamic weather canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none z-10" 
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          AAA PARALLAX IMAGERY SYSTEM (STUNNING MINECRAFT CYBERPUNK UNIVERSE)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden hidden md:block">
        {/* Sky Clouds Layer */}
        <div className="absolute top-[10%] left-0 right-0 h-40 opacity-20 pointer-events-none">
          <div className="absolute w-64 h-8 bg-slate-800 rounded-full blur-md cloud-float-slow" />
          <div className="absolute top-10 w-96 h-12 bg-indigo-900 rounded-full blur-lg cloud-float-medium" style={{ animationDelay: '-15s' }} />
          <div className="absolute top-20 w-80 h-10 bg-brand-purple/40 rounded-full blur-md cloud-float-fast" style={{ animationDelay: '-30s' }} />
        </div>

        {/* 1. Giant Floating Island with Cyberpunk Castle (Parallax layer 3 - Slowest) */}
        <div 
          className="absolute top-[20%] right-[10%] w-[380px] h-[300px] transition-transform duration-300 pointer-events-auto"
          style={{ 
            transform: `translate(${mousePos.x * 12}px, ${mousePos.y * 12}px)`
          }}
        >
          {/* Voxel floating island base */}
          <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="castle-neon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2"/>
              </linearGradient>
              <linearGradient id="island-soil" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b"/>
                <stop offset="50%" stopColor="#0f172a"/>
                <stop offset="100%" stopColor="#020617"/>
              </linearGradient>
            </defs>

            {/* Voxel Castle Spires */}
            <g className="animate-pulse">
              {/* Castle towers */}
              <rect x="150" y="50" width="30" height="110" fill="#334155" />
              <polygon points="150,50 165,10 180,50" fill="#ff1e56" className="portal-pulse-effect" />
              
              <rect x="220" y="70" width="25" height="90" fill="#475569" />
              <polygon points="220,70 232,35 245,70" fill="#8b5cf6" />
              
              <rect x="110" y="80" width="25" height="80" fill="#475569" />
              <polygon points="110,80 122,45 135,80" fill="#3b82f6" />

              {/* Castle walls */}
              <rect x="130" y="100" width="100" height="60" fill="#1e293b" />
              {/* Glowing cyan windows */}
              <rect x="145" y="120" width="8" height="15" fill="#06b6d4" className="animate-pulse" />
              <rect x="165" y="120" width="8" height="15" fill="#06b6d4" className="animate-pulse" />
              <rect x="185" y="120" width="8" height="15" fill="#06b6d4" className="animate-pulse" />
              <rect x="205" y="120" width="8" height="15" fill="#06b6d4" className="animate-pulse" />
            </g>

            {/* Glowing neon laser spotlights from towers */}
            <line x1="165" y1="10" x2="165" y2="0" stroke="#ff1e56" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
            <line x1="232" y1="35" x2="300" y2="0" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6" />
            <line x1="122" y1="45" x2="50" y2="0" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />

            {/* Voxel Dirt/Rock Island Base */}
            <path d="M 50,160 L 350,160 L 300,240 L 250,220 L 200,260 L 150,210 L 100,230 Z" fill="url(#island-soil)" stroke="#334155" strokeWidth="3" />
            
            {/* Emerald/Neon Grass Top Layer */}
            <path d="M 45,155 Q 200,165 355,155 L 350,165 Q 200,175 50,165 Z" fill="#10b981" />
            <path d="M 120,160 L 130,175 L 140,160 M 210,160 L 215,180 L 225,160" stroke="#10b981" strokeWidth="3" fill="none" />
          </svg>

          {/* Glowing particle rings rotating around floating island */}
          <div className="absolute inset-0 rounded-full border border-dashed border-brand-cyan/20 animate-[spin_40s_infinite_linear] scale-110 pointer-events-none" />
        </div>

        {/* 2. Nether Portal on its own voxel block (Parallax layer 2 - Midground) */}
        <div 
          className="absolute bottom-[10%] left-[8%] w-[260px] h-[240px] transition-transform duration-300 pointer-events-auto"
          style={{ 
            transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`
          }}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-end">
            {/* Obsidian Portal Frame */}
            <div className="w-28 h-44 border-[14px] border-slate-900 rounded-lg relative flex items-center justify-center shadow-2xl bg-black/50 overflow-hidden">
              {/* Glowing Purple Dimensional Nether Core */}
              <div className="absolute inset-0 portal-pulse-effect bg-gradient-to-tr from-brand-purple via-pink-600 to-brand-crimson opacity-80 mix-blend-screen flex flex-col justify-between p-2">
                <div className="w-full h-1 bg-white/20 animate-pulse" />
                <div className="w-full h-1 bg-white/15 animate-ping" />
                <div className="w-full h-1 bg-white/20 animate-pulse" />
              </div>
              
              {/* Inner Portal Particles */}
              <div className="absolute inset-1 bg-purple-950/20 flex flex-wrap gap-2 justify-center items-center overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-brand-purple rounded-sm animate-ping" style={{ animationDelay: `${i * 0.3}s` }} />
                ))}
              </div>
            </div>

            {/* Glowing block details */}
            <div className="w-36 h-8 bg-slate-900 border-t border-slate-800 rounded-md flex items-center justify-around px-2 shadow-lg">
              <span className="w-2.5 h-2.5 bg-brand-crimson rounded-full animate-pulse" />
              <span className="text-[9px] font-mono text-slate-400">NETHER_GATE_01</span>
              <span className="w-2.5 h-2.5 bg-brand-purple rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* 5. Flying Cybernetic Ender Dragon (Floating parallax spline) */}
        <div 
          className="absolute top-[10%] left-[15%] w-56 h-40 dragon-bob-effect pointer-events-auto"
          style={{ 
            transform: `translate(${mousePos.x * -25}px, ${mousePos.y * -25}px)`
          }}
        >
          <svg viewBox="0 0 200 150" className="w-full h-full filter drop-shadow-[0_15px_30px_rgba(139,92,246,0.3)]">
            {/* Pixelated dragon body outline */}
            <path d="M 20,60 L 50,55 L 80,62 L 120,58 L 150,75 L 180,72" stroke="#000" strokeWidth="8" strokeLinecap="square" fill="none" />
            <path d="M 20,60 L 50,55 L 80,62 L 120,58 L 150,75 L 180,72" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="square" fill="none" className="portal-pulse-effect" />
            
            {/* Glowing violet eyes and horns */}
            <rect x="25" y="52" width="6" height="4" fill="#ff1e56" className="animate-pulse" />
            <polygon points="12,45 22,50 15,55" fill="#a78bfa" />
            
            {/* Dragon Wings with flight animation */}
            <g className="origin-center animate-[pulse_1.5s_infinite_ease-in-out]">
              <polygon points="75,60 110,15 130,55" fill="rgba(30, 27, 75, 0.95)" stroke="#8b5cf6" strokeWidth="2" />
              <polygon points="85,60 115,25 125,55" fill="rgba(255, 30, 86, 0.4)" />
            </g>
          </svg>
          {/* Cyber scan coordinates */}
          <div className="absolute -top-4 left-6 bg-slate-900/80 border border-slate-800 text-[8px] font-mono text-brand-cyan px-1.5 py-0.5 rounded">
            TARGET: DRAGON_01
          </div>
        </div>

        {/* 6. Slow Floating Cyber Cruise Ship (Bottom Right overlay) */}
        <div 
          className="absolute bottom-[20%] right-[5%] w-72 h-20 transition-transform duration-300 pointer-events-auto"
          style={{ 
            transform: `translate(${mousePos.x * -18}px, ${mousePos.y * -18}px)`
          }}
        >
          <div className="relative w-full h-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex gap-3 shadow-2xl backdrop-blur-sm hover:border-brand-cyan/40 transition-colors group">
            {/* Pulse beacon */}
            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan absolute top-2 right-2 animate-ping" />
            
            {/* Hologram visual indicator */}
            <div className="w-12 h-12 bg-gradient-to-tr from-cyan-900/50 to-brand-cyan/20 border border-brand-cyan/30 rounded-lg flex items-center justify-center text-xl shadow">
              🚀
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-widest">Cruiser Fleet #4</span>
              <span className="text-xs font-sans font-bold text-slate-200 mt-0.5">Voxel Express Cargo</span>
              <span className="text-[8px] font-mono text-slate-500 mt-1">STATUS: EN-ROUTE (94% HP)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MAIN CONTENT ZONE (CENTRAL FLOATING CTA HERO CARD)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="max-w-4xl w-full text-center relative z-20">
        
        {/* Dynamic weather/environmental notice tag */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-crimson opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-crimson"></span>
          </span>
          <span className="text-[10px] lg:text-xs font-mono uppercase tracking-widest text-slate-300">
            {weather === 'clear' && '🌌 ATMOSPHERE: OPTIMAL CYBER COLD'}
            {weather === 'cyber-rain' && '🌧️ ATMOSPHERE: DOWNLOADING RESOURCE PACKET RAIN'}
            {weather === 'cosmic-snow' && '❄️ ATMOSPHERE: DETECTED CRYOGENIC COSMIC DUST'}
            {weather === 'portal-storm' && '⚡ WARNING: DIMENSIONAL PORTAL STORM DETECTED'}
          </span>
        </motion.div>

        {/* Catchy headline: BUILD. CREATE. DOMINATE. */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white mb-6 uppercase"
        >
          Build. Create.<br />
          <span className="bg-gradient-to-r from-brand-crimson via-brand-purple to-brand-blue bg-clip-text text-transparent text-neon-glow-purple">
            Dominate.
          </span>
        </motion.h1>

        {/* Informative subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-sm sm:text-base lg:text-lg text-slate-400 font-sans max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Explore premium mods, robust plugins, schematics, and custom databases. 
          Connect with top-tier verified creators and synchronize your server telemetry in a zero-latency gaming launcher environment.
        </motion.p>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            INTERACTIVE QUANTUM HARVEST CRYSTAL WIDGET
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-12 flex justify-center"
        >
          <div 
            onClick={handleHarvestCore}
            onMouseEnter={() => setIsHoveringCrystal(true)}
            onMouseLeave={() => setIsHoveringCrystal(false)}
            className="cursor-pointer relative p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-brand-cyan/40 backdrop-blur-md max-w-sm w-full transition-all duration-300 group flex items-center gap-4 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
          >
            {/* Glowing crystal graphic */}
            <div className="relative w-14 h-14 flex items-center justify-center bg-gradient-to-tr from-brand-cyan/20 to-brand-purple/20 border border-brand-cyan/30 rounded-xl group-hover:scale-105 transition-transform">
              <span className="text-3xl animate-bounce">💎</span>
              {/* Spinning holo gears */}
              <div className="absolute inset-0 border border-dashed border-brand-cyan/40 rounded-xl animate-[spin_10s_infinite_linear]" />
            </div>

            <div className="flex-grow text-left">
              <span className="text-[9px] font-mono text-brand-cyan uppercase tracking-widest">Platform Interactive Node</span>
              <h4 className="text-xs font-sans font-extrabold text-slate-200 mt-0.5 group-hover:text-brand-cyan transition-colors">Quantum Crystal Core</h4>
              
              {isHarvesting ? (
                /* Harvest progress bar indicator */
                <div className="mt-2">
                  <div className="flex justify-between text-[8px] font-mono text-slate-500 mb-1">
                    <span>DECRYPTING SECTOR</span>
                    <span>{crystalHarvestProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-cyan" style={{ width: `${crystalHarvestProgress}%` }} />
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  {isHoveringCrystal ? '⚡ CLICK TO HARVEST TOKENS & XP!' : 'Hover to detect power levels...'}
                </p>
              )}
            </div>

            {/* Dynamic level stats overlay for harvest */}
            <ArrowUpRight className="w-4.5 h-4.5 text-slate-600 group-hover:text-brand-cyan transition-colors" />
          </div>
        </motion.div>

        {/* Majestic Call-to-Actions (CTAs) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={() => setActiveTab('marketplace')}
            className="w-full sm:w-auto h-14 px-8 bg-gradient-to-r from-brand-crimson to-brand-purple hover:brightness-110 active:scale-95 text-white rounded-xl font-sans font-bold text-sm uppercase tracking-wider shadow-lg shadow-brand-crimson/20 flex items-center justify-center gap-2.5 transition-all group"
          >
            <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
            Explore Marketplace
          </button>

          <button
            onClick={() => {
              addToast('Opening Discord portal sync...', 'success');
              // Redirect or join discord
              const w = window.open('https://discord.gg/ZqWZnZm7P6', '_blank');
              if (w) w.focus();
            }}
            className="w-full sm:w-auto h-14 px-8 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-brand-purple/40 text-slate-200 hover:text-white rounded-xl font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all group"
          >
            {/* discord custom styled icon or generic user check */}
            <Users className="w-5 h-5 text-brand-blue group-hover:scale-110 transition-transform" />
            Join Community Discord
          </button>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SAAS FOOTER TRUST WIDGETS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            { label: 'Secure Core', val: '100% Safe Scan', desc: 'SHA-256 Verified', icon: Shield, color: 'text-brand-emerald', onClick: () => addToast('Authenticate profile in the header menu to activate secure nodes!', 'info') },
            { label: 'Latency', val: '0.01ms Api Sync', desc: 'High-speed cloud servers', icon: Zap, color: 'text-brand-gold', onClick: () => addToast('Zero-latency telemetry proxy active.', 'success') },
            { label: 'Community', val: '142K+ Members', desc: 'Active daily players', icon: Users, color: 'text-brand-cyan', onClick: () => { setActiveTab('community'); addToast('Loading community broadcast timelines...', 'info'); } },
            { label: 'Ticket Hub', val: '24/7 Ticketing', desc: 'AI Assisted Replies', icon: Sparkles, color: 'text-brand-purple', onClick: () => { setActiveTab('support'); addToast('Opening AI ticketing channels...', 'info'); } }
          ].map((w, idx) => {
            const Icon = w.icon;
            return (
              <div 
                key={idx}
                onClick={w.onClick}
                className="p-3 rounded-xl bg-slate-900/35 border border-slate-900 hover:border-slate-700 cursor-pointer hover:shadow-[0_0_15px_rgba(139,92,246,0.1)] active:scale-[0.98] transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${w.color}`} />
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{w.label}</span>
                </div>
                <h5 className="text-xs font-sans font-extrabold text-slate-200">{w.val}</h5>
                <p className="text-[10px] text-slate-600 font-sans mt-0.5">{w.desc}</p>
              </div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
