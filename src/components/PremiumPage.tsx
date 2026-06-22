import React from 'react';
import { Award, Sparkles, ShieldCheck, RefreshCw, Layers, ExternalLink, HelpCircle, Terminal } from 'lucide-react';

export default function PremiumPage() {
  const steps = [
    {
      num: '01',
      title: 'JOIN GUILD',
      desc: 'Join the authenticated DARKLEAKER support Discord guild using of the verified invite links.'
    },
    {
      num: '02',
      title: 'OPEN BILLING TICKET',
      desc: 'Locate the billing-support category. Click to generate a secured payment and eligibility channel.'
    },
    {
      num: '03',
      title: 'MANUAL SETTLEMENT',
      desc: 'Staff coordinates secure manual settlement methods. Exchange transaction identification keys.'
    },
    {
      num: '04',
      title: 'LICENSE ACTIVATED',
      desc: 'Staff registers your UUID in the database manually. Premium permissions launch instantly!'
    }
  ];

  const benefits = [
    {
      title: 'Verified Premium Badge',
      desc: 'Stand out from standard creators. Gain the red glowing verification shield next to your author profile.'
    },
    {
      title: 'Full-Speed Link Access',
      desc: 'No cooldown intervals, script buffers, or telemetry logs. Straight link retrieval instantly.'
    },
    {
      title: 'Sell Premium Handshakes',
      desc: 'Upload premium restricted resources and offer commercial setups inside our main index directories.'
    },
    {
      title: 'Featured Priority Positioning',
      desc: 'Featured spots are reserved mostly for premium sellers. Expand download traction by x10.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-16 px-4 sm:px-6 lg:px-8 animate-fade-in">
      {/* Page Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/25 rounded-full mb-2">
          <Award className="w-4 h-4 text-primary glow-red" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-primary font-bold">MANUAL STAFF DISPATCH SYSTEM</span>
        </div>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase tracking-tight">PREMIUM LICENSE PASS</h1>
        <p className="text-gray-400 font-sans text-sm leading-relaxed">
          Unlock commercial selling capabilities, highlight verified builds, and activate high-priority visual listings. 
          Premium creator benefits backed by manual staff verification. No payment gateways, no cards on file.
        </p>
      </div>

      {/* Benefits Bento box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        {benefits.map((b, i) => (
          <div key={i} className="bg-[#111111]/60 border border-[#1f1f1f] hover:border-primary/20 rounded-lg p-6 flex gap-4 transition-all duration-300">
            <div className="p-3 bg-primary/5 rounded-full border border-primary/15 h-fit text-primary flex-shrink-0">
              <Sparkles className="w-5 h-5 flex-shrink-0" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">{b.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Premium Flow Guide (1-2-3-4 step modules) */}
      <div className="bg-[#111111]/30 border border-[#1f1f1f] rounded-lg p-8 space-y-10">
        <div className="border-b border-[#1f1f1f] pb-4 text-center md:text-left">
          <span className="text-primary font-bold font-mono text-xs tracking-widest uppercase">THE PROTOCOL DIRECTIVE</span>
          <h2 className="font-display font-black text-xl text-white uppercase tracking-wider mt-1">HOW TO ACQUIRE</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="relative space-y-3 bg-[#0d0d0d] border border-[#1f1f1f] p-5 rounded-md">
              <div className="font-display font-black text-2xl text-primary/20 absolute top-4 right-4">{s.num}</div>
              <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">{s.title}</h3>
              <p className="text-[11px] text-gray-500 font-sans leading-relaxed pt-2">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Final Action Invite Box */}
      <div className="relative bg-[#111111] overflow-hidden border-t-2 border-primary rounded-lg p-8 sm:p-12 text-center space-y-6">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px]" />
        
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">LAUNCH PREMIUM LICENSE HANDSHAKE</h2>
        <p className="text-gray-400 text-sm max-w-lg mx-auto font-sans">
          Ready to enlist as a verified Minecraft setup developer? Tap the billing anchor below to launch our Discord server and coordinate with staff in a private support channel.
        </p>

        <div className="bg-[#050505] max-w-sm mx-auto p-3 border border-[#1f1f1f] rounded text-[11px] font-mono text-gray-500">
          Manual License Rate: <b className="text-white">Coordinate with Staff</b>
        </div>

        <a
          href="https://discord.gg/ZqWZnZm7P6"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-primary hover:bg-primary/95 text-white font-display font-black text-xs tracking-widest uppercase rounded-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          <span>Purchase Premium via Discord</span>
          <ExternalLink className="w-4 h-4 text-white" />
        </a>
      </div>
    </div>
  );
}
