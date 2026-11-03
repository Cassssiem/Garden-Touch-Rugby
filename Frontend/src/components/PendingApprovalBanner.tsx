import React from 'react';
import { useApp } from '../context/AppContext';

export const PendingApprovalBanner: React.FC = () => {
  const { currentUser, switchUserDemo, logout, setActivePage } = useApp();

  if (!currentUser || currentUser.status !== 'PENDING') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-zinc-950 border-b border-amber-500/50 px-4 py-3 text-white shadow-lg sticky top-20 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold shrink-0 animate-pulse">
            <span className="material-symbols-outlined text-base">hourglass_top</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline uppercase text-amber-300 font-bold tracking-wider">
                Registration Pending Administrator Approval
              </span>
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-mono uppercase">
                Under Review
              </span>
            </div>
            <p className="text-zinc-300 text-[11px] font-sans">
              Welcome, <strong className="text-white">{currentUser.fullName}</strong>! You will appear on the official website roster and team selection once the club admin approves your application.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              switchUserDemo('admin');
              setActivePage('admin-approvals');
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-headline text-xs uppercase tracking-wider font-bold rounded-sm shadow transition-all flex items-center gap-1"
            title="Switch to Admin mode to test accepting this application"
          >
            <span className="material-symbols-outlined text-sm">shield_person</span>
            <span>Switch to Admin &amp; Accept (Demo)</span>
          </button>
          <button
            onClick={logout}
            className="px-2.5 py-1.5 bg-[#141418] hover:bg-[#202026] text-zinc-400 hover:text-white font-mono text-[11px] rounded-sm border border-[#2a292e] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
