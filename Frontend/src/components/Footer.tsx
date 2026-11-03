import React from 'react';
import { useApp } from '../context/AppContext';
import { GardensLogo } from './GardensLogo';

export const Footer: React.FC = () => {
  const { clubConfig } = useApp();

  return (
    <footer className="w-full bg-[#0e0e12] border-t border-[#2a292e]/60 mt-12 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <GardensLogo size="sm" className="w-8 h-8" />
          <span className="font-headline text-lg uppercase tracking-wider text-rose-500 font-bold">
            {clubConfig.clubName}
          </span>
          <span className="text-xs text-[#ac8889] hidden sm:inline">
            Official 5-a-Side Wednesday Touch Operations &amp; Matchday Roster
          </span>
        </div>

        {/* Tactical Rules Telemetry */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono uppercase tracking-wider text-[#ac8889]">
          <span>Round Rules: 3 × 12min Chuckers</span>
          <span className="hidden sm:inline">•</span>
          <span>Squad Cap: 14 Players</span>
          <span className="hidden sm:inline">•</span>
          <span>Rolling Substitutions</span>
        </div>

        {/* Copyright */}
        <div className="text-xs text-[#ac8889]/80 font-mono">
          © {new Date().getFullYear()} {clubConfig.clubName}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};
