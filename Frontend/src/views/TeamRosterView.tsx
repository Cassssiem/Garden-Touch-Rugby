import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { useApp } from '../context/AppContext';
import { Player } from '../types';

interface TeamRosterViewProps {
  redPlayers: Player[];
  blackPlayers: Player[];
  onClose: () => void;
}

export const TeamRosterView: React.FC<TeamRosterViewProps> = ({
  redPlayers,
  blackPlayers,
  onClose,
}) => {
  const { clubConfig, showToast } = useApp();
  const rosterRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const exportRosterImage = async () => {
    if (!rosterRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(rosterRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0e0e12',
      });
      const link = document.createElement('a');
      const clubName = clubConfig.clubName.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
      link.download = `${clubName || 'Club'}_Team_Rosters.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Team roster image exported.');
    } catch {
      showToast('Could not export the team roster image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderRoster = (team: 'red' | 'black', roster: Player[]) => (
    <section className="min-w-0 rounded border border-[#2a292e] bg-[#1b1b1f] p-2.5">
      <header className="mb-1.5 flex items-center justify-between border-b border-[#2a292e] px-0.5 pb-1.5">
        <h2 className={`font-headline text-xs font-bold uppercase ${team === 'red' ? 'text-rose-500' : 'text-zinc-200'}`}>
          Team {team === 'red' ? 'Red' : 'Black'} Roster
        </h2>
        <span className="font-mono text-[9px] uppercase text-[#ac8889]">
          {roster.length}/9 players
        </span>
      </header>
      <div className="space-y-1">
        {roster.length > 0 ? roster.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between gap-3 rounded-sm bg-[#111115] px-2 py-1 text-xs">
            <span className="font-headline uppercase text-white">
              {player.nickname} {index === 0 && <span className="font-bold text-rose-500">[C]</span>}
            </span>
            <span className="font-mono text-[9px] uppercase text-[#c88f99]">{player.position}</span>
          </div>
        )) : (
          <div className="rounded-sm bg-[#111115] px-2 py-2 text-xs italic text-[#ac8889]">
            No players assigned.
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Team rosters"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[#353439] bg-[#0e0e12] p-2.5 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close team rosters"
          className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#55545b] bg-[#25252b] text-white shadow-lg hover:bg-rose-600"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
        <div ref={rosterRef} className="rounded bg-[#0e0e12] p-1.5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {renderRoster('red', redPlayers)}
          {renderRoster('black', blackPlayers)}
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={exportRosterImage}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-sm border border-rose-500/40 bg-rose-600 px-3.5 py-2 font-headline text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-rose-500 disabled:cursor-wait disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">download</span>
            {isExporting ? 'Exporting...' : 'Export Image'}
          </button>
        </div>
      </div>
    </div>
  );
};
