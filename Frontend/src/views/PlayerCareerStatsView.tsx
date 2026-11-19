import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Position } from '../types';

export const PlayerCareerStatsView: React.FC = () => {
  const { clubConfig, players, setSelectedPlayerId, setActivePage, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Position>('all');
  const [sortColumn, setSortColumn] = useState<string>('tries');
  const [sortAsc, setSortAsc] = useState(false);
  const [dossierPlayerId, setDossierPlayerId] = useState<string | null>(null);

  // Totals
  const totalChuckers = players.reduce((sum, p) => sum + p.chuckersPlayed, 0);
  const totalTries = players.reduce((sum, p) => sum + p.tries, 0);

  // Honors leaders
  const topTryScorer = [...players].sort((a, b) => b.tries - a.tries)[0];
  const topChuckersWon = [...players].sort((a, b) => b.chuckersWon - a.chuckersWon)[0];
  const topMvpLeader = [...players].sort((a, b) => b.mvps - a.mvps)[0];

  // Filtering & Sorting
  const filteredPlayers = players.filter((p) => {
    const matchesRole = roleFilter === 'all' || p.position === roleFilter;
    const matchesSearch =
      p.nickname.toLowerCase().includes(search.toLowerCase()) ||
      p.fullName.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    switch (sortColumn) {
      case 'caps':
        valA = a.caps;
        valB = b.caps;
        break;
      case 'chuckers':
        valA = a.chuckersPlayed;
        valB = b.chuckersPlayed;
        break;
      case 'won':
        valA = a.chuckersPlayed > 0 ? a.chuckersWon / a.chuckersPlayed : 0;
        valB = b.chuckersPlayed > 0 ? b.chuckersWon / b.chuckersPlayed : 0;
        break;
      case 'tries':
        valA = a.tries;
        valB = b.tries;
        break;
      case 'rate':
        valA = a.caps > 0 ? a.tries / a.caps : 0;
        valB = b.caps > 0 ? b.tries / b.caps : 0;
        break;
      case 'mvps':
        valA = a.mvps;
        valB = b.mvps;
        break;
      default:
        valA = a.tries;
        valB = b.tries;
    }

    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(false);
    }
  };

  const selectedDossier = players.find((p) => p.id === dossierPlayerId);

  const exportMasterCSV = () => {
    const headers = [
      'Jersey',
      'Nickname',
      'Full Name',
      'Position',
      'Caps',
      'Chuckers Played',
      'Chuckers Won',
      'Win Percentage',
      'Total Tries',
      'Tries Per Match',
      'MVPs',
      'Current Unit'
    ];

    const rows = players.map((p) => [
      p.jerseyNumber,
      `"${p.nickname}"`,
      `"${p.fullName}"`,
      p.position,
      p.caps,
      p.chuckersPlayed,
      p.chuckersWon,
      p.chuckersPlayed > 0 ? `${((p.chuckersWon / p.chuckersPlayed) * 100).toFixed(1)}%` : '0%',
      p.tries,
      p.caps > 0 ? (p.tries / p.caps).toFixed(2) : '0',
      p.mvps,
      p.team === 'red' ? 'Team Red' : p.team === 'black' ? 'Team Black' : 'Reserve Pool'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `career_stats_ledger_${clubConfig.clubName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Master Stats CSV downloaded');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Ledger Header */}
      <section className="relative w-full bg-[#0e0e12] py-8 border-b border-[#2a292e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="font-mono text-[11px] uppercase tracking-widest text-rose-500 font-bold">
                  OFFICIAL ARCHIVE • WEDNESDAY TOUCH
                </span>
              </div>
              <h1 className="font-headline text-3xl sm:text-5xl uppercase tracking-tight text-white">
                CAREER STATS LEDGER
              </h1>
              <p className="text-xs sm:text-sm text-[#ac8889] max-w-2xl mt-1">
                Complete Historical Records, Chuckers Won &amp; Honors (5-a-Side Wednesday League). Auto-calculated telemetry verified by Matchday Officials.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={exportMasterCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2a292e] hover:bg-rose-600 text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-colors shadow-sm border border-rose-500/30"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Export Ledger (.CSV)
              </button>
              <div className="px-3 py-2 bg-[#1b1b1f] text-[#ac8889] font-mono text-[11px] uppercase tracking-widest rounded-sm border border-[#2a292e]">
                Updated: Rnd #{clubConfig.matchdayCycle}
              </div>
            </div>
          </div>

          {/* 4 Telemetry Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1f1f23] p-4 rounded-sm border-l-2 border-rose-500 flex flex-col justify-between shadow-sm border border-[#2a292e]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#ac8889]">
                  Recorded Ledger
                </span>
                <span className="material-symbols-outlined text-rose-500 text-lg">event_available</span>
              </div>
              <div className="my-2">
                <span className="font-headline text-3xl text-white">{clubConfig.matchdayCycle - 1}</span>
                <span className="font-headline text-sm text-rose-500 uppercase ml-1">Days</span>
              </div>
              <span className="text-[11px] text-[#ac8889]">Total matchdays contested</span>
            </div>

            <div className="bg-[#1f1f23] p-4 rounded-sm border-l-2 border-rose-500 flex flex-col justify-between shadow-sm border border-[#2a292e]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#ac8889]">
                  Round Volumes
                </span>
                <span className="material-symbols-outlined text-rose-500 text-lg">timer</span>
              </div>
              <div className="my-2">
                <span className="font-headline text-3xl text-white">
                  {totalChuckers}
                </span>
                <span className="font-headline text-sm text-rose-500 uppercase ml-1">Chuckers</span>
              </div>
              <span className="text-[11px] text-[#ac8889]">3 × 12min format strict tracking</span>
            </div>

            <div className="bg-[#1f1f23] p-4 rounded-sm border-l-2 border-rose-500 flex flex-col justify-between shadow-sm border border-[#2a292e]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#ac8889]">
                  Try Telemetry
                </span>
                <span className="material-symbols-outlined text-rose-500 text-lg">sports_score</span>
              </div>
              <div className="my-2">
                <span className="font-headline text-3xl text-white">{totalTries}</span>
                <span className="font-headline text-sm text-rose-500 uppercase ml-1">Tries</span>
              </div>
              <span className="text-[11px] text-[#ac8889]">
                {totalChuckers > 0 ? (totalTries / totalChuckers).toFixed(2) : '0.00'} tries per chucker average
              </span>
            </div>

            <div className="bg-[#1f1f23] p-4 rounded-sm border-l-2 border-rose-500 flex flex-col justify-between shadow-sm border border-[#2a292e]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#ac8889]">
                  Squad Roster
                </span>
                <span className="material-symbols-outlined text-rose-500 text-lg">group</span>
              </div>
              <div className="my-2">
                <span className="font-headline text-3xl text-white">{players.length}</span>
                <span className="font-headline text-sm text-rose-500 uppercase ml-1">Athletes</span>
              </div>
              <span className="text-[11px] text-[#ac8889]">Red / Black rotational pool</span>
            </div>
          </div>
        </div>
      </section>

      {/* Honors & Leaders Podium */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-rose-500 font-mono text-[11px] uppercase tracking-widest font-bold">
              <span className="material-symbols-outlined text-lg">military_tech</span>
              <span>SEASON TITLES &amp; ALL-TIME APEX</span>
            </div>
            <h2 className="font-headline text-2xl uppercase text-white">Honors &amp; Leaders Podium</h2>
          </div>
          <span className="hidden sm:inline font-mono text-[10px] uppercase text-[#ac8889]">
            Criteria: Min. 10 Caps Played
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Top Try Scorer */}
          <div className="bg-[#1f1f23] p-5 rounded-sm shadow-lg flex flex-col justify-between border border-rose-500/20 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[10px] uppercase tracking-wider rounded-sm font-bold">
                TOP TRY SCORER
              </span>
              <span className="material-symbols-outlined text-rose-500 text-xl">verified</span>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className="w-14 h-14 rounded-sm bg-[#0e0e12] border border-rose-500/40 flex items-center justify-center font-headline text-xl text-rose-500 font-bold shrink-0">
                {topTryScorer ? `#${topTryScorer.jerseyNumber}` : '--'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline text-lg uppercase text-white truncate leading-tight">
                  {topTryScorer ? `"${topTryScorer.nickname}"` : 'Pending Data'}
                </span>
                <span className="text-xs text-[#ac8889] truncate">
                  {topTryScorer ? `${topTryScorer.fullName} • ${topTryScorer.position}` : 'No try scorers registered yet'}
                </span>
                {topTryScorer && (
                  <span className="font-mono text-[10px] text-rose-400 uppercase mt-0.5 font-bold">
                    {topTryScorer.team === 'black' ? 'Team Black' : 'Team Red'}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#0e0e12] p-3 rounded-sm mt-4 flex items-center justify-between border border-[#2a292e]">
              <div className="flex flex-col">
                <span className="font-headline text-4xl text-rose-500 leading-none">
                  {topTryScorer?.tries || 0}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#ac8889]">
                  Career Tries
                </span>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-headline text-base text-white">
                  {topTryScorer && topTryScorer.caps > 0
                    ? (topTryScorer.tries / topTryScorer.caps).toFixed(2)
                    : '0.00'}
                </div>
                <div className="text-[10px] text-[#ac8889]">Tries / Matchday</div>
                <div className="text-[10px] text-[#ac8889]">{topTryScorer?.caps || 0} Caps</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-1">
              <span className="text-xs text-[#ac8889]">Record Strike Rate</span>
              <button
                onClick={() => topTryScorer && setDossierPlayerId(topTryScorer.id)}
                className="text-rose-500 hover:text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Card 2: Most Chuckers Won */}
          <div className="bg-[#1f1f23] p-5 rounded-sm shadow-lg flex flex-col justify-between border border-rose-500/20 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[10px] uppercase tracking-wider rounded-sm font-bold">
                MOST CHUCKERS WON
              </span>
              <span className="material-symbols-outlined text-rose-500 text-xl">trophy</span>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className="w-14 h-14 rounded-sm bg-[#0e0e12] border border-rose-500/40 flex items-center justify-center font-headline text-xl text-white font-bold shrink-0">
                {topChuckersWon ? `#${topChuckersWon.jerseyNumber}` : '--'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline text-lg uppercase text-white truncate leading-tight">
                  {topChuckersWon ? `"${topChuckersWon.nickname}"` : 'Pending Data'}
                </span>
                <span className="text-xs text-[#ac8889] truncate">
                  {topChuckersWon ? `${topChuckersWon.fullName} • ${topChuckersWon.position}` : 'No chucker wins logged yet'}
                </span>
                {topChuckersWon && (
                  <span className="font-mono text-[10px] text-rose-400 uppercase mt-0.5 font-bold">
                    {topChuckersWon.team === 'black' ? 'Team Black' : 'Team Red'}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#0e0e12] p-3 rounded-sm mt-4 flex items-center justify-between border border-[#2a292e]">
              <div className="flex flex-col">
                <span className="font-headline text-4xl text-white leading-none">
                  {topChuckersWon?.chuckersWon || 0}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#ac8889]">
                  Chuckers Won
                </span>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-headline text-base text-rose-500">
                  {topChuckersWon && topChuckersWon.chuckersPlayed > 0
                    ? `${((topChuckersWon.chuckersWon / topChuckersWon.chuckersPlayed) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
                <div className="text-[10px] text-[#ac8889]">True Win Efficiency</div>
                <div className="text-[10px] text-[#ac8889]">
                  {topChuckersWon?.chuckersPlayed || 0} Chuckers
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-1">
              <span className="text-xs text-[#ac8889]">Differential: Positive Net</span>
              <button
                onClick={() => topChuckersWon && setDossierPlayerId(topChuckersWon.id)}
                className="text-rose-500 hover:text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Card 3: Most MVPs Awarded */}
          <div className="bg-[#1f1f23] p-5 rounded-sm shadow-lg flex flex-col justify-between border border-rose-500/20 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[10px] uppercase tracking-wider rounded-sm font-bold">
                MOST MVPS AWARDED
              </span>
              <span className="material-symbols-outlined text-rose-500 text-xl">hotel_class</span>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className="w-14 h-14 rounded-sm bg-[#0e0e12] border border-rose-500/40 flex items-center justify-center font-headline text-xl text-rose-500 font-bold shrink-0">
                {topMvpLeader ? `#${topMvpLeader.jerseyNumber}` : '--'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline text-lg uppercase text-white truncate leading-tight">
                  {topMvpLeader ? `"${topMvpLeader.nickname}"` : 'Pending Data'}
                </span>
                <span className="text-xs text-[#ac8889] truncate">
                  {topMvpLeader ? `${topMvpLeader.fullName} • ${topMvpLeader.position}` : 'No MVP honors logged yet'}
                </span>
                {topMvpLeader && (
                  <span className="font-mono text-[10px] text-rose-400 uppercase mt-0.5 font-bold">
                    {topMvpLeader.team === 'black' ? 'Team Black' : 'Team Red'}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#0e0e12] p-3 rounded-sm mt-4 flex items-center justify-between border border-[#2a292e]">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-headline text-4xl text-rose-500 leading-none">
                    {topMvpLeader?.mvps || 0}
                  </span>
                  <span className="material-symbols-outlined text-rose-500 text-2xl">star</span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#ac8889]">
                  Matchday MVPs
                </span>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-headline text-base text-white">
                  {topMvpLeader && topMvpLeader.caps > 0
                    ? `${((topMvpLeader.mvps / topMvpLeader.caps) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
                <div className="text-[10px] text-[#ac8889]">MVP Frequency / App</div>
                <div className="text-[10px] text-[#ac8889]">{topMvpLeader?.caps || 0} Apps</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-1">
              <span className="text-xs text-[#ac8889]">Offload &amp; Try Leader</span>
              <button
                onClick={() => topMvpLeader && setDossierPlayerId(topMvpLeader.id)}
                className="text-rose-500 hover:text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Master Player Ledger Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-12">
        <div className="bg-[#1b1b1f] rounded-sm p-4 shadow-xl border border-[#2a292e] flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 text-xl">dataset</span>
                <span className="font-headline text-xl uppercase text-white">Master Player Ledger</span>
              </div>
              <span className="text-xs text-[#ac8889]">
                Filtered by {clubConfig.clubName} 5-a-Side standard regulations
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 min-w-0">
              <div className="relative w-full sm:w-60 sm:min-w-[240px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#ac8889] text-base">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search player or nickname..."
                  className="w-full bg-[#131317] text-white pl-9 pr-3 py-1.5 rounded-sm text-xs border border-[#353439] outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-start overflow-x-auto bg-[#131317] p-0.5 rounded-sm border border-[#2a292e]">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1 text-xs font-mono uppercase rounded-sm font-bold ${
                    roleFilter === 'all'
                      ? 'bg-rose-600 text-white'
                      : 'text-[#ac8889] hover:text-white'
                  }`}
                >
                  All ({players.length})
                </button>
                <button
                  onClick={() => setRoleFilter('LINK')}
                  className={`px-3 py-1 text-xs font-mono uppercase rounded-sm font-bold ${
                    roleFilter === 'LINK'
                      ? 'bg-rose-600 text-white'
                      : 'text-[#ac8889] hover:text-white'
                  }`}
                >
                  Links
                </button>
                <button
                  onClick={() => setRoleFilter('MIDDLE')}
                  className={`px-3 py-1 text-xs font-mono uppercase rounded-sm font-bold ${
                    roleFilter === 'MIDDLE'
                      ? 'bg-rose-600 text-white'
                      : 'text-[#ac8889] hover:text-white'
                  }`}
                >
                  Middles
                </button>
                <button
                  onClick={() => setRoleFilter('WING')}
                  className={`px-3 py-1 text-xs font-mono uppercase rounded-sm font-bold ${
                    roleFilter === 'WING'
                      ? 'bg-rose-600 text-white'
                      : 'text-[#ac8889] hover:text-white'
                  }`}
                >
                  Wings
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1f1f23] text-[#ac8889] font-mono text-[11px] uppercase tracking-wider border-b border-[#2a292e]">
                  <th className="p-3">Player</th>
                  <th className="p-3">Role</th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-rose-500 transition-colors"
                    onClick={() => handleSort('caps')}
                  >
                    Caps {sortColumn === 'caps' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-rose-500 transition-colors"
                    onClick={() => handleSort('chuckers')}
                  >
                    Chuckers {sortColumn === 'chuckers' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-rose-500 transition-colors"
                    onClick={() => handleSort('won')}
                  >
                    Won (Win %) {sortColumn === 'won' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-rose-500 transition-colors"
                    onClick={() => handleSort('tries')}
                  >
                    Tries {sortColumn === 'tries' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-rose-500 transition-colors"
                    onClick={() => handleSort('rate')}
                  >
                    Tries/Cap {sortColumn === 'rate' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-rose-500 transition-colors"
                    onClick={() => handleSort('mvps')}
                  >
                    MVPs {sortColumn === 'mvps' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="p-3 text-center">Unit</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a292e]">
                {sortedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[#ac8889]">
                      No players registered yet or matching criteria.
                    </td>
                  </tr>
                ) : (
                  sortedPlayers.map((player) => {
                    const winPercent =
                      player.chuckersPlayed > 0
                        ? ((player.chuckersWon / player.chuckersPlayed) * 100).toFixed(1)
                        : '0.0';
                    const triesPerCap =
                      player.caps > 0 ? (player.tries / player.caps).toFixed(2) : '0.00';

                    return (
                      <tr
                        key={player.id}
                        className="hover:bg-[#1f1f23] transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#0e0e12] border border-[#2a292e] flex items-center justify-center font-mono text-xs text-rose-500 font-bold shrink-0">
                              #{player.jerseyNumber}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-headline text-sm uppercase text-white font-bold">
                                "{player.nickname}"
                              </span>
                              <span className="text-[11px] text-[#ac8889]">{player.fullName}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-[#131317] text-white font-mono text-[10px] uppercase rounded border border-[#2a292e]">
                            {player.position}
                          </span>
                        </td>

                        <td className="p-3 text-center font-headline text-sm text-white">
                          {player.caps}
                        </td>

                        <td className="p-3 text-center text-white font-mono">
                          {player.chuckersPlayed}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-headline text-sm text-white">
                              {player.chuckersWon}
                            </span>
                            <div className="w-16 bg-[#2a292e] h-1 rounded-full overflow-hidden mt-0.5">
                              <div
                                className="bg-rose-600 h-full"
                                style={{ width: `${Math.min(100, Number(winPercent))}%` }}
                              ></div>
                            </div>
                            <span className="font-mono text-[9px] text-[#ac8889]">{winPercent}%</span>
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 bg-rose-950/60 text-rose-400 font-headline text-sm font-bold rounded border border-rose-500/30">
                            {player.tries}
                          </span>
                        </td>

                        <td className="p-3 text-center text-white font-mono">{triesPerCap}</td>

                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#131317] text-rose-400 font-headline text-xs rounded border border-[#2a292e]">
                            <span className="material-symbols-outlined text-xs">star</span>
                            {player.mvps}
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded font-bold ${
                              player.team === 'red'
                                ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30'
                                : player.team === 'black'
                                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                : 'bg-[#131317] text-[#ac8889] border border-[#2a292e]'
                            }`}
                          >
                            {player.team === 'red' ? 'Team Red' : player.team === 'black' ? 'Team Black' : 'Pool'}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => setDossierPlayerId(player.id)}
                            className="px-2.5 py-1 bg-[#2a292e] hover:bg-rose-600 text-white font-headline text-[11px] uppercase tracking-wider rounded-sm transition-colors border border-[#353439]"
                          >
                            Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 text-[#ac8889] text-xs font-mono">
            <span>
              Showing {sortedPlayers.length} of {players.length} Registered Athletes
            </span>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <span className="text-white">Active Balance:</span>
              <span className="text-rose-400 font-bold">
                Red: {players.filter((p) => p.team === 'red').length}
              </span>
              <span>•</span>
              <span className="text-zinc-300 font-bold">
                Black: {players.filter((p) => p.team === 'black').length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Player Dossier Slide-Over Drawer */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setDossierPlayerId(null)}
          ></div>

          <div className="relative ml-auto w-full max-w-lg bg-[#1b1b1f] border-l border-[#2a292e] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto z-10">
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#2a292e]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500">badge</span>
                  <span className="font-mono text-xs uppercase tracking-widest text-rose-400 font-bold">
                    {clubConfig.clubName} • VERIFIED DOSSIER
                  </span>
                </div>
                <button
                  onClick={() => setDossierPlayerId(null)}
                  className="p-1 text-[#ac8889] hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Player Card */}
              <div className="bg-[#1f1f23] p-4 rounded-sm flex items-center gap-4 border border-rose-500/20">
                <div className="w-16 h-16 rounded bg-[#0e0e12] border border-rose-500/40 flex items-center justify-center font-headline text-2xl text-rose-500 font-bold shrink-0">
                  #{selectedDossier.jerseyNumber}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline text-xl uppercase text-white">
                      "{selectedDossier.nickname}"
                    </h3>
                    <span className="px-2 py-0.5 bg-[#131317] font-mono text-[10px] text-rose-400 uppercase rounded border border-rose-500/30">
                      {selectedDossier.team.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-[#ac8889]">{selectedDossier.fullName}</span>
                  <span className="font-mono text-[10px] text-[#ac8889] uppercase mt-1">
                    Position: {selectedDossier.position} • {selectedDossier.roleSpecialty}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#131317] p-3 rounded-sm border border-[#2a292e] flex flex-col">
                  <span className="font-mono text-[10px] uppercase text-[#ac8889]">Caps</span>
                  <span className="font-headline text-2xl text-white mt-1">{selectedDossier.caps}</span>
                  <span className="text-[10px] text-[#ac8889]">{selectedDossier.chuckersPlayed} Chuckers</span>
                </div>

                <div className="bg-[#131317] p-3 rounded-sm border border-[#2a292e] flex flex-col">
                  <span className="font-mono text-[10px] uppercase text-[#ac8889]">Tries</span>
                  <span className="font-headline text-2xl text-rose-500 mt-1">{selectedDossier.tries}</span>
                  <span className="text-[10px] text-[#ac8889]">
                    {selectedDossier.caps > 0 ? (selectedDossier.tries / selectedDossier.caps).toFixed(2) : 0} / Match
                  </span>
                </div>

                <div className="bg-[#131317] p-3 rounded-sm border border-[#2a292e] flex flex-col">
                  <span className="font-mono text-[10px] uppercase text-[#ac8889]">Won</span>
                  <span className="font-headline text-2xl text-white mt-1">{selectedDossier.chuckersWon}</span>
                  <span className="text-[10px] text-[#ac8889]">
                    {selectedDossier.chuckersPlayed > 0
                      ? `${((selectedDossier.chuckersWon / selectedDossier.chuckersPlayed) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>

                <div className="bg-[#131317] p-3 rounded-sm border border-[#2a292e] flex flex-col">
                  <span className="font-mono text-[10px] uppercase text-[#ac8889]">MVPs</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="font-headline text-2xl text-rose-500">{selectedDossier.mvps}</span>
                    <span className="material-symbols-outlined text-rose-500 text-sm">star</span>
                  </div>
                  <span className="text-[10px] text-[#ac8889]">Match Honors</span>
                </div>
              </div>

              {/* Physical Biometrics */}
              <div className="bg-[#131317] p-3 rounded-sm border border-[#2a292e] flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#ac8889]">
                  Physical Biometrics &amp; Velocity
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#1f1f23] p-2 rounded-sm">
                    <span className="text-[10px] text-[#ac8889] block font-mono">HEIGHT</span>
                    <span className="font-headline text-sm text-white">{selectedDossier.heightCm || 180} CM</span>
                  </div>
                  <div className="bg-[#1f1f23] p-2 rounded-sm">
                    <span className="text-[10px] text-[#ac8889] block font-mono">WEIGHT</span>
                    <span className="font-headline text-sm text-white">{selectedDossier.weightKg || 80} KG</span>
                  </div>
                  <div className="bg-[#1f1f23] p-2 rounded-sm">
                    <span className="text-[10px] text-[#ac8889] block font-mono">SPEED INDEX</span>
                    <span className="font-headline text-sm text-rose-500 font-bold">{selectedDossier.speedIndex || 9.0} / 10</span>
                  </div>
                </div>
              </div>

              {/* Tactical Notes */}
              <div className="bg-[#131317] p-3 rounded-sm border border-[#2a292e] flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#ac8889]">
                  Tactical Scouting Notes
                </span>
                <p className="text-xs text-white leading-relaxed">
                  {selectedDossier.tacticalNotes || 'Solid contributor in both transition attack and defensive 5m recovery.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 flex items-center gap-3 border-t border-[#2a292e] mt-6">
              <button
                onClick={() => {
                  setSelectedPlayerId(selectedDossier.id);
                  setActivePage('player-hub');
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-colors text-center font-bold"
              >
                View Full Player Hub
              </button>
              <button
                onClick={() => setDossierPlayerId(null)}
                className="px-4 py-2 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase rounded-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
