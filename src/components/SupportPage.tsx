import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ExternalLink, HelpCircle as HelpIcon, Terminal, MessageSquare, AlertCircle } from 'lucide-react';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'WHAT IS DARKLEAKER AND HOW DOES IT WORK?',
      a: 'DARKLEAKER is a specialized high-performance directory for Minecraft files (configurations, scripts, maps, templates). Users can catalog setups pointing to external Mediafire mirrors, ensuring infinite repository caching without local database blockages.'
    },
    {
      q: 'WHY ARE THE FILE LINKS RESTRICTED TO MEDIAFIRE?',
      a: 'To maximize bandwidth speeds and enforce disk safety without exceeding local server storage limitations, we mandate external delivery links from Mediafire exclusively. Supabase local storage is reserved purely for listings database records.'
    },
    {
      q: 'HOW DO I GET MY MINECRAFT PLUGINS/CONFIG APPROVED?',
      a: 'After you upload a setup, administrators receive a deployment notification log. Staff executes strict performance analysis, security auditing, and download source checks. If cleared, verification shifts to approved instantly.'
    },
    {
      q: 'HOW DO WE SUBMIT AN APPEAL OR GET SYSTEM ISSUES SOLVED?',
      a: 'To maintain pristine responsive times, we dismantled standard web ticket forms. All user support appeals, report notifications, and account troubleshooting are handled manually inside the Discord Support hub.'
    }
  ];

  const guideSteps = [
    {
      num: 'Ⅰ',
      title: 'JOIN SUPPORT HUB',
      desc: 'Join our verified support guild: discord.gg/ZqWZnZm7P6'
    },
    {
      num: 'Ⅱ',
      title: 'LOCATE HELPDESK UNIT',
      desc: 'Find the #support-tickets channel. Click to initialize a private server-side ticket.'
    },
    {
      num: 'Ⅲ',
      title: 'SUBMIT PERTINENT DETAILS',
      desc: 'List your Minecraft username, listing IDs, logs, or appeals context in the discord channel.'
    },
    {
      num: 'Ⅳ',
      title: 'STAFF RESOLUTION',
      desc: 'An operator will review the logs manually to correct credentials or reinstate deleted profiles.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-16 px-4 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header section */}
      <div className="border-b border-[#111] pb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-primary font-mono text-xs tracking-widest uppercase mb-1">
            <span>DARKLEAKER SUPPORT DESK</span>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">SUPPORT HELPDESK</h1>
        </div>

        <a
          href="https://discord.gg/ZqWZnZm7P6"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
        >
          <span>Join Support Guild</span>
          <ExternalLink className="w-4 h-4 text-white" />
        </a>
      </div>

      {/* Side by side: Open Ticket Guide & FAQs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ticket Guide (Col Span 5) */}
        <div className="lg:col-span-5 bg-[#111111]/80 border border-[#1f1f1f] p-6 rounded-lg space-y-6">
          <div className="border-b border-[#1f1f1f] pb-3">
            <span className="text-xs text-primary font-mono uppercase font-bold tracking-widest block">No Web Form Tickets</span>
            <h3 className="font-display font-black text-base text-white uppercase tracking-wider mt-1">OPEN TICKET GUIDE</h3>
          </div>

          <p className="text-gray-400 text-xs leading-relaxed font-sans">
            DARKLEAKER uses a localized Discord Ticket System to speed up resolutions. Rest easy knowing you communicate with actual Minecraft programmers, not generic bots.
          </p>

          <div className="space-y-4">
            {guideSteps.map((s, i) => (
              <div key={i} className="flex gap-3.5 bg-[#050505]/40 border border-[#1c1c1c] p-3.5 rounded-sm">
                <span className="text-primary font-display font-black text-sm">{s.num}</span>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">{s.title}</h4>
                  <p className="text-[10px] text-gray-500 leading-normal font-sans">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs Section (Col Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="font-display font-black text-lg text-white uppercase tracking-wider border-b border-[#111] pb-3">
            FREQUENTLY ENCOUNTERED QUESTIONS
          </h3>

          <div className="space-y-3">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="border border-[#1f1f1f] bg-[#111111]/30 rounded-sm overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-4 focus:bg-[#111]/80 text-left font-display font-bold text-xs text-white uppercase tracking-wider transition-colors outline-none"
                  >
                    <span>{f.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 border-t border-[#1f1f1f]/35 text-xs text-gray-400 leading-relaxed font-sans">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Notice Banner */}
          <div className="p-4 bg-primary/5 border border-primary/25 rounded text-xs font-mono text-gray-400 space-y-1.5 leading-normal">
            <div className="flex items-center gap-1.5 text-primary uppercase font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Security Protocols Notice:</span>
            </div>
            <p className="font-sans text-[11px]">
              Minecraft configurations or Skripts uploaded on this platform must not contain backdoors, payload injectors, malicious commands execution vectors, or compiled executable code formats. Violation of this rule results in permanent profiles bans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
