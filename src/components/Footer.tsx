import React from 'react';
import { Terminal, ShieldAlert, Cpu } from 'lucide-react';

interface FooterProps {
  setPath: (path: string) => void;
}

export default function Footer({ setPath }: FooterProps) {
  return (
    <footer className="bg-[#050505] border-t border-[#1f1f1f] text-gray-500 py-12 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-display font-black text-xl tracking-widest text-white mb-4">
              <Terminal className="w-5 h-5 text-primary" />
              <span>DARK<span className="text-primary glow-red">LEAKER</span></span>
            </div>
            <p className="text-sm text-gray-400 max-w-sm mb-4 leading-relaxed">
              The high-performance Minecraft resource marketplace. Distributing verified plugins, scripts, configs, maps, and templates with rapid download speeds.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-600 bg-[#111111] p-2 border border-[#1a1a1a] rounded w-fit">
              <Cpu className="w-3.5 h-3.5 text-primary" /> 
              <span>Production Environment Active</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-display font-bold text-sm text-white tracking-wider uppercase mb-4">Market</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#/marketplace" onClick={(e) => { e.preventDefault(); setPath('#/marketplace'); }} className="hover:text-white transition-colors duration-200">
                  Browse Resources
                </a>
              </li>
              <li>
                <a href="#/premium" onClick={(e) => { e.preventDefault(); setPath('#/premium'); }} className="hover:text-primary transition-colors duration-200">
                  Premium Pass
                </a>
              </li>
              <li>
                <a href="#/upload" onClick={(e) => { e.preventDefault(); setPath('#/upload'); }} className="hover:text-white transition-colors duration-200">
                  Upload Asset
                </a>
              </li>
            </ul>
          </div>

          {/* Legal and Support */}
          <div>
            <h4 className="font-display font-bold text-sm text-white tracking-wider uppercase mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#/support" onClick={(e) => { e.preventDefault(); setPath('#/support'); }} className="hover:text-white transition-colors duration-200">
                  Discord Helpdesk
                </a>
              </li>
              <li>
                <div className="flex items-center gap-1.5 text-red-500 font-mono text-xs cursor-pointer" onClick={() => alert("All resources undergo intensive human and automated file verification audits before publication to prevent execution exploits.")}>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Files Audited
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1a1a1a] mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600 font-mono">
            &copy; {new Date().getFullYear()} DARKLEAKER. Darkleaker and this platform are independent creations and not associated with Mojang Studios or Microsoft.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-emerald-500">Node Online</span>
            <span className="text-gray-700">|</span>
            <span className="text-gray-600 hover:text-white cursor-pointer" onClick={() => setPath('#/admin')}>Admin Dashboard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
