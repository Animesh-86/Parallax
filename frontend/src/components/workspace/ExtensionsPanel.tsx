import React, { useState } from 'react';
import { Puzzle, Search, Package, Sparkles, Clock, Lock, ShieldCheck } from 'lucide-react';

export function ExtensionsPanel() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-[#09090B] text-white">
      {/* Search Placeholder */}
      <div className="p-3 border-b border-white/5 bg-black/20">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10" />
          <input 
            type="text" 
            placeholder="Search the marketplace..."
            disabled
            className="w-full bg-white/5 border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none cursor-not-allowed opacity-50"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="relative">
           <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-full animate-pulse" />
           <div className="relative w-20 h-20 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
              <Puzzle className="w-10 h-10 text-[#D4AF37] animate-bounce" />
           </div>
           <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#D4AF37] text-black text-[10px] font-bold rounded-full">
              BETA
           </div>
        </div>

        <div className="space-y-2">
           <h3 className="text-lg font-bold bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Extensions Marketplace</h3>
           <p className="text-xs text-white/40 leading-relaxed max-w-[200px] mx-auto">
             We are currently auditing the first batch of Parallax-certified plugins for safety and performance.
           </p>
        </div>

        <div className="w-full space-y-2">
           {[
             { label: 'Safety Audit', icon: ShieldCheck, status: 'In Progress' },
             { label: 'Sandbox Integration', icon: Lock, status: 'Testing' },
             { label: 'Dev Marketplace', icon: Package, status: 'Planning' }
           ].map((item) => (
             <div key={item.label} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg opacity-60">
                <div className="flex items-center gap-2">
                   <item.icon className="w-3.5 h-3.5 text-[#D4AF37]" />
                   <span className="text-[11px]">{item.label}</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tighter text-white/20">{item.status}</span>
             </div>
           ))}
        </div>

        <div className="pt-4 flex flex-col items-center gap-2">
           <div className="flex items-center gap-1 text-[10px] text-[#D4AF37] font-bold">
              <Clock className="w-3 h-3" />
              COMING SOON Q3 2026
           </div>
           <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold hover:bg-white/10 transition-colors opacity-40 cursor-not-allowed">
              NOTIFY ME
           </button>
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40">
        <div className="flex items-center gap-2 text-[10px] text-white/20 italic">
          <Sparkles className="w-3 h-3" />
          <span>The next generation of modular development is almost here.</span>
        </div>
      </div>
    </div>
  );
}
