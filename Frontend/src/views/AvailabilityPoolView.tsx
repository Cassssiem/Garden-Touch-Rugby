import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlayerStatus, Position } from '../types';
import { AddPlayerModal } from '../components/AddPlayerModal';

export const AvailabilityPoolView: React.FC = () => {
  const {
    clubConfig,
    players,
    togglePlayerStatus,
    setPlayerStatus,
    deletePlayer,
    setActivePage,
    setSelectedPlayerId,
    currentUser,
  } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN';

  const [filter, setFilter] = useState<'all' | PlayerStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const nextWednesday = (() => {
    const date = new Date();
    const daysAhead = (3 - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + daysAhead);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  })();
  const [availabilityDate, setAvailabilityDate] = useState(
    /^\d{4}-\d{2}-\d{2}$/.test(clubConfig.nextMatchdayDate) ? clubConfig.nextMatchdayDate : nextWednesday
  );
  const weeklyStatus = (player: (typeof players)[number]): PlayerStatus =>
    player.availabilityByDate?.[availabilityDate] || 'pending';

  // Filtered player roster
  const availableCount = players.filter((p) => weeklyStatus(p) === 'available').length;
  const pendingCount = players.filter((p) => weeklyStatus(p) === 'pending').length;
  const unavailableCount = players.filter((p) => weeklyStatus(p) === 'unavailable').length;

  const filteredPlayers = players.filter((player) => {
    const matchesFilter = filter === 'all' || weeklyStatus(player) === filter;
    const matchesSearch =
      player.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.position.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const quorumTarget = 18;
  const quorumPercent = Math.min(100, Math.round((availableCount / quorumTarget) * 100));
  const slotsOpen = Math.max(0, quorumTarget - availableCount);

  // CSV export handler
  const exportAvailabilityCSV = () => {
    const headers = ['Jersey', 'Nickname', 'Full Name', 'Position', 'Status', 'Caps', 'Tries', 'Wins'];
    const rows = players.map((p) => [
      p.jerseyNumber,
      `"${p.nickname}"`,
      `"${p.fullName}"`,
      p.position,
      weeklyStatus(p).toUpperCase(),
      p.caps,
      p.tries,
      p.chuckersWon,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `availability_pool_round_${clubConfig.matchdayCycle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Telemetry & Operational Banner */}
      <section className="w-full bg-[#0e0e12] border-b border-[#2a292e]/60 px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* Stage Indicator & Title Line */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-[11px] uppercase tracking-widest rounded-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  POOL OPEN • CUT-OFF 20:00 MON
                </span>
                <span className="text-[#ac8889] font-mono text-[11px] tracking-widest uppercase">
                  MATCHDAY CYCLE #{clubConfig.matchdayCycle}
                </span>
              </div>
              <h1 className="font-headline text-3xl sm:text-5xl uppercase tracking-tight text-white mt-1">
                MONDAY POOL <span className="text-rose-500">REGISTRATION</span>
              </h1>
              <p className="text-sm text-[#ac8889]">
                Wednesday Matchday • 9v9 Clash (3 Games) • 18 Players (9 per side), No Subs
              </p>
            </div>

          </div>

          {/* KPI Telemetry Grid (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Squad Quorum */}
            <div className="bg-[#1f1f23] p-4 rounded-sm border-l-2 border-rose-500 flex flex-col justify-between shadow-sm border border-[#2a292e]">
              <div className="flex items-center justify-between text-[#ac8889]">
                <span className="font-mono text-[11px] uppercase tracking-wider">Squad Quorum</span>
                <span className="material-symbols-outlined text-rose-500 text-lg">group</span>
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="font-headline text-4xl text-white">{availableCount}</span>
                <span className="font-headline text-sm text-[#ac8889]">/ 18 PLAYERS</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="w-full bg-[#353439] h-2 rounded-sm overflow-hidden flex">
                  <div
                    className="bg-rose-600 h-full transition-all duration-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]"
                    style={{ width: `${quorumPercent}%` }}
                  ></div>
                </div>
                <span className="font-mono text-[10px] text-rose-400 uppercase tracking-wide">
                  {quorumPercent}% Target Met • {slotsOpen} Slots Open
                </span>
              </div>
            </div>

            {/* KPI 2: Target Format */}
            <div className="bg-[#1f1f23] p-4 rounded-sm border-l-2 border-white/60 flex flex-col justify-between shadow-sm border border-[#2a292e]">
              <div className="flex items-center justify-between text-[#ac8889]">
                <span className="font-mono text-[11px] uppercase tracking-wider">Target Format</span>
                <span className="material-symbols-outlined text-white text-lg">sports_rugby</span>
              </div>
              <div className="my-2">
                <div className="font-headline text-lg uppercase text-white leading-tight">9v9 • NO SUBS</div>
                <div className="text-xs text-[#ac8889]">Team Red vs Team Black (3 Chuckers)</div>
              </div>
              <div className="font-mono text-[10px] text-[#ac8889] uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                9 Players Per Team
              </div>
            </div>

            {/* KPI 3: Unresponsive */}
            <div className="bg-[#1f1f23] p-4 rounded-sm border-l-2 border-[#ac8889] flex flex-col justify-between shadow-sm border border-[#2a292e]">
              <div className="flex items-center justify-between text-[#ac8889]">
                <span className="font-mono text-[11px] uppercase tracking-wider">Unresponsive</span>
                <span className="material-symbols-outlined text-[#ac8889] text-lg">hourglass_top</span>
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="font-headline text-4xl text-white/80">{pendingCount}</span>
                <span className="font-headline text-sm text-[#ac8889]">PLAYERS</span>
              </div>
              <div className="font-mono text-[10px] text-[#ac8889] uppercase tracking-wide">
                Awaiting Confirmation
              </div>
            </div>

            {/* KPI 4: Confirmed Out */}
            <div className="bg-[#1f1f23] p-4 rounded-sm border-l-2 border-rose-400 flex flex-col justify-between shadow-sm border border-[#2a292e]">
              <div className="flex items-center justify-between text-[#ac8889]">
                <span className="font-mono text-[11px] uppercase tracking-wider">Unavailable</span>
                <span className="material-symbols-outlined text-rose-400 text-lg">block</span>
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="font-headline text-4xl text-rose-400">{unavailableCount}</span>
                <span className="font-headline text-sm text-[#ac8889]">WITHDRAWN</span>
              </div>
              <div className="font-mono text-[10px] text-[#ac8889] uppercase tracking-wide">
                Work Travel / Injury Sidelined
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Controls & Filters Bar */}
      <section className="w-full bg-[#1b1b1f] border-b border-[#2a292e] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm transition-colors ${
                filter === 'all'
                  ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.35)]'
                  : 'bg-[#1f1f23] text-[#ac8889] hover:text-white'
              }`}
            >
              All Squad ({players.length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm transition-colors ${
                filter === 'available'
                  ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.35)]'
                  : 'bg-[#1f1f23] text-[#ac8889] hover:text-white'
              }`}
            >
              Available ({availableCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm transition-colors ${
                filter === 'pending'
                  ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.35)]'
                  : 'bg-[#1f1f23] text-[#ac8889] hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('unavailable')}
              className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm transition-colors ${
                filter === 'unavailable'
                  ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.35)]'
                  : 'bg-[#1f1f23] text-[#ac8889] hover:text-white'
              }`}
            >
              Unavailable ({unavailableCount})
            </button>
          </div>

          {/* Search & Add Actions */}
          <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
            <label className="flex flex-col gap-1 shrink-0 font-mono text-[9px] uppercase text-[#ac8889]">
              Wednesday Pool
              <input
                type="date"
                value={availabilityDate}
                onChange={(event) => setAvailabilityDate(event.target.value)}
                className="bg-[#131317] text-white border border-[#353439] text-xs px-2 py-1.5 rounded-sm outline-none focus:border-rose-500"
              />
            </label>
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#ac8889] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search player by nickname or surname..."
                className="w-full bg-[#131317] text-white border border-[#353439] placeholder-[#ac8889]/60 text-xs pl-9 pr-3 py-2 rounded-sm outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-colors shadow-sm font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span className="hidden sm:inline">+ Add Player</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Player Roster Grid Section */}
      <section className="w-full px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* View Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-headline text-lg uppercase text-white">Registered Squad Members</span>
              <span className="px-2 py-0.5 bg-[#1f1f23] border border-[#2a292e] text-[#ac8889] font-mono text-[11px] uppercase rounded-sm">
                {players.length} Total In Pool
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase text-[#ac8889]">
              <span>Sort By: <strong className="text-white">Hierarchy</strong></span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Position Matrix: <strong className="text-rose-500">Active</strong></span>
            </div>
          </div>

          {/* Empty state if 0 players */}
          {players.length === 0 ? (
            <div className="bg-[#1b1b1f] border border-[#2a292e] p-12 rounded-sm text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#2a292e] flex items-center justify-center text-rose-500">
                <span className="material-symbols-outlined text-3xl">group_off</span>
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <h3 className="font-headline text-xl uppercase text-white">No Players Registered in Pool</h3>
                <p className="text-sm text-[#ac8889]">
                  All games and players have been cleared. Register squad members or connect your backend to manage Wednesday touch rosters.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm flex items-center gap-2 shadow font-bold"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  + Add Your First Player
                </button>
              </div>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="bg-[#1b1b1f] border border-[#2a292e] p-8 rounded-sm text-center text-[#ac8889]">
              No players matching the filter "{filter}" or search "{searchTerm}".
            </div>
          ) : (
            /* Player Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPlayers.map((player) => {
                const playerWeeklyStatus = weeklyStatus(player);
                const isAvail = playerWeeklyStatus === 'available';
                const isPending = playerWeeklyStatus === 'pending';

                return (
                  <div
                    key={player.id}
                    className={`bg-[#1f1f23] border p-4 rounded-sm flex flex-col justify-between gap-4 shadow-sm transition-all duration-200 ${
                      isAvail
                        ? 'border-[#353439]/70 hover:border-rose-500/50'
                        : isPending
                        ? 'border-[#2a292e] opacity-90'
                        : 'border-rose-950/60 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar / Number Box */}
                      <div
                        onClick={() => {
                          setSelectedPlayerId(player.id);
                          setActivePage('player-hub');
                        }}
                        className={`relative w-16 h-16 shrink-0 rounded-sm overflow-hidden bg-[#0e0e12] ring-1 cursor-pointer flex items-center justify-center ${
                          isAvail
                            ? 'ring-rose-500/40 text-rose-500'
                            : isPending
                            ? 'ring-[#353439] text-[#ac8889]'
                            : 'ring-rose-900/50 text-rose-400'
                        }`}
                        title="Click to view player dossier"
                      >
                        {player.avatarUrl ? (
                          <img src={player.avatarUrl} alt={player.nickname} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">sports_rugby</span>
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 px-1 bg-[#0e0e12] text-rose-500 font-mono text-[10px] leading-tight font-bold">
                          #{player.jerseyNumber}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            onClick={() => {
                              setSelectedPlayerId(player.id);
                              setActivePage('player-hub');
                            }}
                            className="font-headline text-base text-white truncate uppercase hover:text-rose-400 cursor-pointer transition-colors"
                          >
                            {player.nickname}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-headline uppercase rounded-sm border ${
                              player.position === 'MIDDLE'
                                ? 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                                : player.position === 'LINK'
                                ? 'bg-rose-900/20 text-rose-300 border-rose-400/20'
                                : 'bg-[#2a292e] text-white border-[#353439]'
                            }`}
                          >
                            {player.position}
                          </span>
                        </div>
                        <span className="text-xs text-[#ac8889] truncate">{player.fullName}</span>
                        <span className="font-mono text-[10px] text-[#ac8889] uppercase mt-1 tracking-wider truncate">
                          {player.roleSpecialty}
                        </span>
                      </div>
                    </div>

                    {/* Season Telemetry Mini */}
                    <div className="grid grid-cols-3 gap-1 bg-[#131317] p-1.5 rounded-sm text-center border border-[#2a292e]">
                      <div className="flex flex-col">
                        <span className="font-headline text-sm text-white leading-tight">{player.caps}</span>
                        <span className="font-mono text-[9px] text-[#ac8889] uppercase">Apps</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline text-sm text-rose-500 leading-tight font-bold">
                          {player.tries}
                        </span>
                        <span className="font-mono text-[9px] text-[#ac8889] uppercase">Tries</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline text-sm text-white leading-tight">
                          {player.chuckersWon}
                        </span>
                        <span className="font-mono text-[9px] text-[#ac8889] uppercase">Wins</span>
                      </div>
                    </div>

                    {/* Status & Toggle Action */}
                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-[11px] uppercase ${
                          isAvail
                            ? 'bg-rose-950/40 border border-rose-500/40 text-rose-400'
                            : isPending
                            ? 'bg-[#2a292e] text-[#ac8889]'
                            : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isAvail ? 'check_circle' : isPending ? 'schedule' : 'cancel'}
                        </span>
                        {playerWeeklyStatus}
                      </span>

                      {/* Admin controls: Only Admin can toggle availability and delete players */}
                      {isAdmin ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => togglePlayerStatus(player.id, availabilityDate)}
                            className="px-2 py-1 bg-[#2a292e] hover:bg-rose-600 hover:text-white text-[#e4e1e7] font-headline text-[11px] uppercase rounded-sm transition-colors font-bold"
                            title="Cycle status: Available -> Pending -> Unavailable (Admin)"
                          >
                            Toggle
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove ${player.nickname} from squad?`)) {
                                deletePlayer(player.id);
                              }
                            }}
                            className="w-6 h-6 flex items-center justify-center text-[#ac8889] hover:text-rose-400 hover:bg-[#2a292e] rounded-sm transition-colors"
                            title="Remove player (Admin Only)"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-[#ac8889]/60 italic">
                          Admin managed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Tactical Formation Simulation & Selector Handoff Checklist */}
      <section className="hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Tactical Pitch Miniature */}
          <div className="lg:col-span-7 bg-[#1b1b1f] border border-[#2a292e] p-5 rounded-sm shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-rose-500 font-bold">
                  Tactical Formation Simulation
                </span>
                <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono text-[10px] uppercase rounded-sm">
                  9v9 Flow
                </span>
              </div>
              <span className="font-mono text-xs text-[#ac8889] uppercase">
                9 Players Per Side (70m x 50m)
              </span>
            </div>

            {/* Pitch graphic */}
            <div className="w-full h-44 bg-[#0a0a0e] border border-[#2a292e] rounded-sm relative overflow-hidden flex items-center justify-around px-4">
              <svg
                className="absolute inset-0 w-full h-full text-[#2a292e] opacity-40 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line stroke="currentColor" strokeDasharray="4 4" strokeWidth="2" x1="5%" x2="5%" y1="0" y2="100%" />
                <line stroke="currentColor" strokeDasharray="4 4" strokeWidth="2" x1="95%" x2="95%" y1="0" y2="100%" />
                <line stroke="currentColor" strokeWidth="2" x1="50%" x2="50%" y1="0" y2="100%" />
                <circle cx="50%" cy="50%" fill="none" r="28" stroke="currentColor" strokeWidth="1.5" />
              </svg>

              {/* Tokens: W - L - M - L - W */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-9 h-9 rounded-sm bg-rose-600 text-white font-headline text-lg flex items-center justify-center font-bold shadow-[0_0_10px_rgba(225,29,72,0.4)]">
                  W
                </div>
                <span className="font-mono text-[10px] uppercase text-rose-400">Wing</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-9 h-9 rounded-sm bg-rose-600 text-white font-headline text-lg flex items-center justify-center font-bold shadow-[0_0_10px_rgba(225,29,72,0.4)]">
                  L
                </div>
                <span className="font-mono text-[10px] uppercase text-rose-400">Link</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-10 h-10 rounded-sm bg-white text-black font-headline text-lg flex items-center justify-center font-bold shadow-[0_0_14px_rgba(255,255,255,0.6)] scale-110">
                  M
                </div>
                <span className="font-mono text-[10px] uppercase text-white font-bold">Middle</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-9 h-9 rounded-sm bg-rose-600 text-white font-headline text-lg flex items-center justify-center font-bold shadow-[0_0_10px_rgba(225,29,72,0.4)]">
                  L
                </div>
                <span className="font-mono text-[10px] uppercase text-rose-400">Link</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-9 h-9 rounded-sm bg-rose-600 text-white font-headline text-lg flex items-center justify-center font-bold shadow-[0_0_10px_rgba(225,29,72,0.4)]">
                  W
                </div>
                <span className="font-mono text-[10px] uppercase text-rose-400">Wing</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[#ac8889] text-xs">
              <span>
                Active Squad Balance: <strong className="text-white">{availableCount} Available</strong> (Yields 2 teams with subs)
              </span>
              <span className="text-rose-500 font-mono text-[11px] uppercase font-bold">
                Equitable Rotation Optimal
              </span>
            </div>
          </div>

          {/* Action Protocol Checklist */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-[#1f1f23] border border-[#2a292e] p-5 rounded-sm shadow-md flex flex-col gap-4">
              <div className="flex items-center gap-2 text-rose-500">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
                <span className="font-headline text-base uppercase text-white">Selector Handoff Checklist</span>
              </div>

              <ul className="flex flex-col gap-2 text-xs text-[#ac8889]">
                <li className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-base ${availableCount >= 10 ? 'text-emerald-400' : 'text-[#ac8889]'}`}>
                    {availableCount >= 10 ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>Minimum 10 players confirmed (Target reached: <strong className="text-white">{availableCount}</strong>)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
                  <span>Middle &amp; Link depth configured across both units</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ac8889] text-base">radio_button_unchecked</span>
                  <span>Pending players ({pendingCount}) will auto-default to standby at 20:00</span>
                </li>
              </ul>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setActivePage('team-selection')}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm shadow-[0_4px_16px_rgba(225,29,72,0.35)] transition-colors text-center font-bold"
                >
                  Lock Roster &amp; Proceed to Team Selection
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
                <button
                  onClick={exportAvailabilityCSV}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm transition-colors border border-[#353439]"
                >
                  <span className="material-symbols-outlined text-sm text-rose-500">download</span>
                  Export Monday Availability CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add Player Modal */}
      {isAddModalOpen && <AddPlayerModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
};
