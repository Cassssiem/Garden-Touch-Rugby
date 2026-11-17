import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChuckerScore, MatchResult } from '../types';

export const TeamSelectionView: React.FC = () => {
  const {
    clubConfig,
    updateClubConfig,
    players,
    setPlayers,
    matchResults,
    recordMatchResult,
    assignPlayerTeam,
    autoBalanceDraft,
    resetDraft,
    lockRoster,
    showToast,
    currentUser,
    isSelector,
    canSelectLineup,
  } = useApp();

  const hasSelectorClearance = currentUser?.role === 'ADMIN' ||
    canSelectLineup || currentUser?.role === 'SELECTOR' || !!currentUser?.isSelector;

  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const nextRound = matchResults.length > 0
    ? Math.max(...matchResults.map((match) => match.roundNumber)) + 1
    : clubConfig.matchdayCycle || 1;
  const [roundNumber, setRoundNumber] = useState(nextRound);
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [kickoffTime, setKickoffTime] = useState(clubConfig.kickoffTime || '18:30');
  const [formatNotes, setFormatNotes] = useState('Wednesday Touch 9v9 • 3 Chuckers (12 min running clock)');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [editingMatchRound, setEditingMatchRound] = useState<number | null>(null);
  const canDraftTeams = hasSelectorClearance;
  const isWednesdayMatchDate = (() => {
    const parts = matchDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return false;
    const [year, month, day] = parts;
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day &&
      date.getUTCDay() === 3;
  })();

  // Teams breakdown
  const redStarters = players.filter((p) => p.team === 'red');

  const blackStarters = players.filter((p) => p.team === 'black');

  const poolPlayers = players.filter((p) =>
    p.team === 'pool' && (p.availabilityByDate?.[matchDate] || p.status) === 'available'
  );

  const filteredPool = poolPlayers;

  // Stats calculation for Algorithmic Parity Telemetry
  const allRed = players.filter((p) => p.team === 'red');
  const allBlack = players.filter((p) => p.team === 'black');

  const redTries = allRed.reduce((sum, p) => sum + p.tries, 0);
  const blackTries = allBlack.reduce((sum, p) => sum + p.tries, 0);

  const redChuckersWon = allRed.reduce((sum, p) => sum + p.chuckersWon, 0);
  const blackChuckersWon = allBlack.reduce((sum, p) => sum + p.chuckersWon, 0);

  const redAvgCaps =
    allRed.length > 0 ? Number((allRed.reduce((sum, p) => sum + p.caps, 0) / allRed.length).toFixed(1)) : 0;
  const blackAvgCaps =
    allBlack.length > 0 ? Number((allBlack.reduce((sum, p) => sum + p.caps, 0) / allBlack.length).toFixed(1)) : 0;

  const totalTries = redTries + blackTries;
  const parity =
    totalTries > 0
      ? Number((100 - (Math.abs(redTries - blackTries) / totalTries) * 100).toFixed(1))
      : 100;

  const finalizeSelection = async () => {
    if (isFinalizing) return;

    if (!roundNumber || roundNumber < 1 || !matchDate || !kickoffTime.trim()) {
      showToast('Complete every match detail before creating the match.');
      return;
    }
    if (!isWednesdayMatchDate) {
      showToast('Match date must be a Wednesday. Please select a Wednesday date.');
      return;
    }
    if (matchResults.some((existingMatch) => existingMatch.roundNumber === roundNumber) && editingMatchRound !== roundNumber) {
      showToast(`Round #${roundNumber} already exists. Choose another round number.`);
      return;
    }
    if (allRed.length !== 9 || allBlack.length !== 9) {
      showToast('Select exactly 9 players for both Team Red and Team Black before creating the match.');
      return;
    }

    const emptyChuckers: [ChuckerScore, ChuckerScore, ChuckerScore] = [
      { chuckerNumber: 1, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
      { chuckerNumber: 2, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
      { chuckerNumber: 3, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
    ];
    const match: MatchResult = {
      roundNumber,
      date: matchDate,
      year: new Date(matchDate).getFullYear(),
      formatNotes: formatNotes.trim(),
      isPlayed: false,
      chuckers: emptyChuckers,
      redTotalTries: 0,
      blackTotalTries: 0,
      seriesWinner: 'TBA',
      seriesScore: 'TBA',
      mvpPlayerId: '',
      mvpCitation: 'Awaiting matchday kickoff',
      redScorers: {},
      blackScorers: {},
      redLineup: allRed.map((player) => player.id),
      blackLineup: allBlack.map((player) => player.id),
    };
    setIsFinalizing(true);
    try {
      await recordMatchResult(match);
      updateClubConfig({ matchdayCycle: roundNumber, nextMatchdayDate: matchDate, kickoffTime });
      lockRoster();
      setEditingMatchRound(null);
      setRoundNumber(roundNumber + 1);
      showToast(`Round #${roundNumber} ${editingMatchRound ? 'updated' : 'created'}. Teams remain displayed here; reset the draft when you’re ready for the next round.`);
    } finally {
      setIsFinalizing(false);
    }
  };

  // WhatsApp Broadcast Text
  const redList = allRed.map((p) => p.nickname).join(', ') || 'Pending draft';
  const blackList = allBlack.map((p) => p.nickname).join(', ') || 'Pending draft';
  const whatsappSnippet = `📋 ${clubConfig.clubName} WEDNESDAY TOUCH TEAMS (Round #${clubConfig.matchdayCycle}):\n🔴 TEAM RED: ${redList}\n⚫ TEAM BLACK: ${blackList}\nKickoff ${clubConfig.kickoffTime}`;

  const copyWhatsAppText = () => {
    navigator.clipboard.writeText(whatsappSnippet);
    setCopiedSnippet(true);
    showToast('WhatsApp matchday roster copied to clipboard!');
    setTimeout(() => setCopiedSnippet(false), 2200);
  };

  const loadScheduledMatch = (value: string) => {
    if (!value) {
      setEditingMatchRound(null);
      setPlayers((current) => current.map((player) => ({ ...player, team: 'pool', isSub: false })));
      return;
    }
    const match = matchResults.find((item) => item.roundNumber === Number(value));
    if (!match || match.isPlayed === true) return;
    const redIds = match.redLineup || [];
    const blackIds = match.blackLineup || [];
    setEditingMatchRound(match.roundNumber);
    setRoundNumber(match.roundNumber);
    setMatchDate(match.date);
    setPlayers((current) => current.map((player) => {
      const redIndex = redIds.indexOf(player.id);
      const blackIndex = blackIds.indexOf(player.id);
      if (redIndex >= 0) return { ...player, team: 'red', isSub: false };
      if (blackIndex >= 0) return { ...player, team: 'black', isSub: false };
      return { ...player, team: 'pool', isSub: false };
    }));
  };

  const exportTeamSheet = () => {
    const lines = [
      `${clubConfig.clubName} — Round #${roundNumber}`,
      `Wednesday ${matchDate} at ${kickoffTime}`,
      '',
      `TEAM RED: ${allRed.map((player) => `${player.nickname} (#${player.jerseyNumber})`).join(', ')}`,
      `TEAM BLACK: ${allBlack.map((player) => `${player.nickname} (#${player.jerseyNumber})`).join(', ')}`,
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Gardens_RFC_Round_${roundNumber}_Team_Sheet.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Team sheet exported.');
  };

  if (!hasSelectorClearance) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-rose-500">lock</span>
        <h1 className="font-headline text-2xl uppercase text-white mt-4">Selector Role Required</h1>
        <p className="text-sm text-[#ac8889] mt-2">
          Team Selection is available only while an administrator has temporarily assigned you the Selector role.
        </p>
      </div>
    );
  }

  const matchSetupForm = (
        <div className="flex flex-col gap-5 pb-5 mb-5 border-b border-white/10 [&_label]:tracking-[0.12em] [&_input]:!rounded-md [&_input]:!border-white/10 [&_input]:!bg-[#131318] [&_input]:!px-3.5 [&_input]:!py-2.5 [&_input]:transition-all [&_input]:hover:!border-white/20 [&_input]:focus:!border-rose-500/70 [&_input]:focus:!ring-2 [&_input]:focus:!ring-rose-500/10">
          <label className="flex flex-col gap-1.5 font-mono text-[10px] uppercase text-[#ac8889] font-bold max-w-sm">
            Edit Scheduled Match
            <select value={editingMatchRound || ''} onChange={(event) => loadScheduledMatch(event.target.value)} className="bg-[#131318] text-white border border-white/10 px-3.5 py-2.5 rounded-md outline-none">
              <option value="">Create a new match</option>
              {matchResults.filter((match) => match.isPlayed !== true).map((match) => (
                <option key={match.roundNumber} value={match.roundNumber}>Round #{match.roundNumber} — {match.date}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <label className="flex flex-col gap-1.5 font-mono text-[10px] uppercase text-[#ac8889] font-bold">Round Number<input type="number" min="1" required value={roundNumber} onChange={(e) => setRoundNumber(Number(e.target.value))} className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm font-mono outline-none" /></label>
            <label className="flex flex-col gap-1.5 font-mono text-[10px] uppercase text-[#ac8889] font-bold">
              Match Date
              <input
                type="date"
                required
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                aria-invalid={Boolean(matchDate) && !isWednesdayMatchDate}
                className={`bg-[#141418] text-white [color-scheme:light] [&::-webkit-calendar-picker-indicator]:invert border focus:border-rose-500 rounded-sm px-3 py-2 text-sm font-mono outline-none ${matchDate && !isWednesdayMatchDate ? 'border-rose-500' : 'border-[#353439]'}`}
              />
              {matchDate && !isWednesdayMatchDate && (
                <span className="normal-case text-[10px] text-rose-400">Matches can only be created on Wednesdays.</span>
              )}
            </label>
            <label className="flex flex-col gap-1.5 font-mono text-[10px] uppercase text-[#ac8889] font-bold">Kickoff Time<input type="text" required value={kickoffTime} onChange={(e) => setKickoffTime(e.target.value)} className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm font-mono outline-none" /></label>
          </div>
          <div className="hidden">
            <button type="button" className="hidden">
              <span className="material-symbols-outlined text-base">event</span>
              Confirm Details
            </button>
          </div>
        </div>
  );

  return (
    <div className="flex flex-col w-full min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(225,29,72,0.08),transparent_34%),#0e0e12]">
      {/* Top Telemetry & Balance Dashboard */}
      <section className="w-full px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-l-4 border-rose-500 pl-4 py-1">
            <div>
              <h1 className="font-headline text-3xl sm:text-4xl uppercase tracking-wider text-white leading-none">
                Team Selection
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#ac8889]">
                Complete the fixture details, build both 9-player teams with no substitutes, and finalize the match below.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)]"></span>
              Match setup in progress
            </div>
          </div>
          {/* Header Line */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-4">
            <div className="hidden">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[11px] uppercase tracking-wider rounded-sm font-bold">
                  Matchday Selector 5v5
                </span>
                <span className="px-2 py-0.5 bg-[#2a292e] text-white font-mono text-[11px] uppercase tracking-wider rounded-sm border border-[#353439]">
                  Round #{clubConfig.matchdayCycle} • Chuckers 1-3
                </span>
              </div>
              <h1 className="font-headline text-3xl sm:text-4xl uppercase text-white tracking-tight">
                2. Wednesday Team Selection &amp; Draft
              </h1>
              <p className="text-xs sm:text-sm text-[#ac8889]">
                Drafting 9v9 Teams: Team Red vs. Team Black • 3 Games / Chuckers (12 min running clock)
              </p>
            </div>

            {/* Action Group */}
            {canDraftTeams ? (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={autoBalanceDraft}
                  className="h-10 px-4 bg-[#2a292e] hover:bg-[#353439] border border-rose-500/40 text-white font-headline text-xs uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-colors shadow-sm"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-rose-500">balance</span>
                  Auto-Balance by Stats
                </button>
                <button
                  onClick={resetDraft}
                  className="h-10 px-4 bg-[#1b1b1f] hover:bg-[#2a292e] text-[#ac8889] hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-colors border border-[#2a292e]"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">restart_alt</span>
                  Reset
                </button>
                <button
                  onClick={finalizeSelection}
                  className="hidden"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">sports_rugby</span>
                  Create Match &amp; Finalize Teams
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#141418] border border-amber-500/30 px-3.5 py-2 rounded-sm text-xs font-mono text-amber-300">
                <span className="material-symbols-outlined text-amber-400 text-base">lock</span>
                <span>View-Only Mode • Only designated Selectors can draft lineups</span>
              </div>
            )}
          </div>

          {/* Selector Authorization Banner */}
          {canDraftTeams ? (
            <div className="bg-[#141418] border border-rose-500/30 px-4 py-2 rounded-sm flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 text-base">verified_user</span>
                <span className="text-white font-mono">
                  Lineup Selector Clearance Active: <strong className="text-rose-400">{currentUser?.nickname || currentUser?.fullName || 'Club Admin'}</strong>
                </span>
              </div>
              <span className="px-2 py-0.5 bg-rose-950/60 text-rose-300 font-mono text-[10px] uppercase font-bold rounded border border-rose-500/40">
                Authorized Selector
              </span>
            </div>
          ) : (
            <div className="bg-[#141418] border border-zinc-700 px-4 py-2 rounded-sm flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ac8889] text-base">info</span>
                <span className="text-[#ac8889] font-mono">
                  You are viewing the projected matchday lineup. Lineup adjustments are restricted to club Selectors &amp; Admins.
                </span>
              </div>
              <span className="px-2 py-0.5 bg-[#1b1b1f] text-[#ac8889] font-mono text-[10px] uppercase rounded border border-[#2a292e]">
                Spectator View
              </span>
            </div>
          )}

          {/* Parity Telemetry Console */}
          <div className="bg-[#18181d]/90 border border-white/10 rounded-xl p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
            {matchSetupForm}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-[#2a292e]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 text-xl">tune</span>
                <span className="font-headline text-sm uppercase tracking-wide text-white">
                  Algorithmic Parity Telemetry
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 bg-[#2a292e] border border-rose-500/30 text-white font-mono text-[11px] uppercase tracking-wider rounded-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  Balanced Matchup (High Competitiveness)
                </span>
                <span className="font-headline text-base text-rose-500 font-bold tracking-wide">
                  {parity}% PARITY
                </span>
              </div>
            </div>

            {/* 3 Metrics Gauge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
              {/* Metric 1 */}
              <div className="bg-[#1f1f23] p-3 rounded-sm border border-[#2a292e]">
                <div className="flex justify-between items-baseline mb-1 text-xs">
                  <span className="font-headline uppercase text-rose-500 font-bold">
                    Red: {redTries} Tries
                  </span>
                  <span className="font-mono text-[10px] text-[#ac8889] uppercase">Career Scoring</span>
                  <span className="font-headline uppercase text-white font-bold">
                    {blackTries} Tries :Black
                  </span>
                </div>
                <div className="w-full h-2 bg-[#0e0e12] rounded-full overflow-hidden flex border border-[#2a292e]">
                  <div
                    className="h-full bg-rose-600 transition-all duration-500"
                    style={{
                      width: totalTries > 0 ? `${(redTries / totalTries) * 100}%` : '50%',
                    }}
                  ></div>
                  <div
                    className="h-full bg-zinc-600 transition-all duration-500"
                    style={{
                      width: totalTries > 0 ? `${(blackTries / totalTries) * 100}%` : '50%',
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#ac8889] mt-1">
                  <span>Δ {Math.abs(redTries - blackTries)} Tries</span>
                  <span className="text-white">Equal Scoring Balance</span>
                  <span>{totalTries} Total</span>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="bg-[#1f1f23] p-3 rounded-sm border border-[#2a292e]">
                <div className="flex justify-between items-baseline mb-1 text-xs">
                  <span className="font-headline uppercase text-rose-500 font-bold">
                    Red: {redChuckersWon} W
                  </span>
                  <span className="font-mono text-[10px] text-[#ac8889] uppercase">Chuckers Won</span>
                  <span className="font-headline uppercase text-white font-bold">
                    {blackChuckersWon} W :Black
                  </span>
                </div>
                <div className="w-full h-2 bg-[#0e0e12] rounded-full overflow-hidden flex border border-[#2a292e]">
                  <div
                    className="h-full bg-rose-600 transition-all duration-500"
                    style={{
                      width:
                        redChuckersWon + blackChuckersWon > 0
                          ? `${(redChuckersWon / (redChuckersWon + blackChuckersWon)) * 100}%`
                          : '50%',
                    }}
                  ></div>
                  <div
                    className="h-full bg-zinc-600 transition-all duration-500"
                    style={{
                      width:
                        redChuckersWon + blackChuckersWon > 0
                          ? `${(blackChuckersWon / (redChuckersWon + blackChuckersWon)) * 100}%`
                          : '50%',
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#ac8889] mt-1">
                  <span>Win Rate Parity</span>
                  <span className="text-white">Clutch Metric</span>
                  <span>Competitive</span>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="bg-[#1f1f23] p-3 rounded-sm border border-[#2a292e]">
                <div className="flex justify-between items-baseline mb-1 text-xs">
                  <span className="font-headline uppercase text-rose-500 font-bold">
                    Red: {redAvgCaps} Caps
                  </span>
                  <span className="font-mono text-[10px] text-[#ac8889] uppercase">Experience Avg</span>
                  <span className="font-headline uppercase text-white font-bold">
                    {blackAvgCaps} Caps :Black
                  </span>
                </div>
                <div className="w-full h-2 bg-[#0e0e12] rounded-full overflow-hidden flex border border-[#2a292e]">
                  <div
                    className="h-full bg-rose-600 transition-all duration-500"
                    style={{
                      width:
                        redAvgCaps + blackAvgCaps > 0
                          ? `${(redAvgCaps / (redAvgCaps + blackAvgCaps)) * 100}%`
                          : '50%',
                    }}
                  ></div>
                  <div
                    className="h-full bg-zinc-600 transition-all duration-500"
                    style={{
                      width:
                        redAvgCaps + blackAvgCaps > 0
                          ? `${(blackAvgCaps / (redAvgCaps + blackAvgCaps)) * 100}%`
                          : '50%',
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#ac8889] mt-1">
                  <span>Seasoned</span>
                  <span className="text-white">
                    Δ {Math.abs(Number((redAvgCaps - blackAvgCaps).toFixed(1)))} Match Delta
                  </span>
                  <span>Veteran</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Draft Workspace: 3 Columns */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: TEAM RED ================= */}
          <section className="lg:col-span-4 flex flex-col gap-4 bg-[#1b1b1f] rounded-sm p-4 shadow-md border border-rose-500/30">
            {/* Team Red Header */}
            <div className="bg-[#1f1f23] p-3 rounded-sm flex items-center justify-between border-l-4 border-rose-600">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-rose-600 flex items-center justify-center text-white font-headline text-lg font-bold shadow-sm">
                  R
                </div>
                <div className="flex flex-col">
                  <span className="font-headline text-base uppercase text-white tracking-wide leading-none">
                    THE REDS
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#ac8889] mt-0.5">
                    {redStarters.length}/9 Players
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-rose-950/40 text-rose-300 border border-rose-500/40 font-mono text-[10px] uppercase rounded-sm font-bold">
                Red Bibs
              </span>
            </div>

            {/* Team Red: Nine Players */}
            <div className="bg-[#0e0e12] p-2.5 rounded-sm border border-[#2a292e] flex flex-col gap-1.5">
              <div className="flex items-center justify-between mb-1 text-[11px] font-mono text-[#ac8889] uppercase">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-rose-500">stadium</span>
                  Starting 9
                </span>
                <span className="text-rose-400 font-bold">9v9 Team</span>
              </div>

              {redStarters.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#ac8889] border border-dashed border-[#2a292e] rounded-sm">
                  No starters assigned yet. Use '+ Red' from the Available Pool.
                </div>
              ) : (
                redStarters.map((player, idx) => {
                  const posLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
                  const posLabel = posLabels[idx] || `S${idx + 1}`;
                  return (
                    <div
                      key={player.id}
                      className="bg-[#1f1f23] hover:bg-[#2a292e] transition-colors rounded-sm p-2 flex items-center justify-between border border-transparent hover:border-rose-500/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-sm bg-rose-950/60 text-rose-400 border border-rose-500/30 font-headline text-xs flex items-center justify-center font-bold">
                          {posLabel}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-headline text-sm uppercase text-white leading-tight">
                            {player.nickname}
                          </span>
                          <span className="font-mono text-[10px] text-[#ac8889] uppercase">
                            {player.position} • #{player.jerseyNumber}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right font-mono text-[10px]">
                          <span className="text-rose-400 font-bold block">{player.tries} TRIES</span>
                          <span className="text-[#ac8889] block">{player.chuckersWon}W</span>
                        </div>
                        {canDraftTeams && (
                          <button
                            onClick={() => assignPlayerTeam(player.id, 'pool')}
                            className="w-7 h-7 rounded hover:bg-[#353439] flex items-center justify-center text-[#ac8889] hover:text-rose-400 transition-colors"
                            title="Unassign to pool"
                          >
                            <span className="material-symbols-outlined text-sm">remove_circle_outline</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Team Red Aggregate Pill */}
            <div className="bg-[#2a292e] p-2.5 rounded-sm flex items-center justify-between text-white border border-rose-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="font-mono text-xs uppercase text-white">
                  {redStarters.length}/9 Players
                </span>
              </div>
              <div className="flex items-center gap-3 font-headline text-sm">
                <span className="text-rose-400">{redTries} TRIES</span>
                <span className="text-white">{redChuckersWon} CHUCKERS W</span>
              </div>
            </div>
          </section>

          {/* ================= CENTER COLUMN: AVAILABLE POOL ================= */}
          <section className="lg:col-span-4 flex flex-col gap-4 bg-[#1b1b1f] rounded-sm p-4 shadow-md border border-[#2a292e]">
            {/* Header & Badges */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-rose-500 text-lg">group_work</span>
                  <span className="font-headline text-base uppercase text-white">Available Pool</span>
                </div>
                <span className="px-2 py-0.5 bg-[#2a292e] border border-rose-500/30 text-rose-300 font-mono text-[10px] uppercase rounded-sm font-bold">
                  {poolPlayers.length} in Reserve
                </span>
              </div>
              <p className="text-xs text-[#ac8889]">
                Assign nine players to each team. All selected players are starters; there are no substitutes.
              </p>
            </div>

            {/* Pool List */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[580px] pr-1">
              {filteredPool.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#ac8889] border border-dashed border-[#2a292e] rounded-sm">
                  {players.length === 0
                    ? 'No players in squad roster yet. Add players in the Availability Pool or sync with your backend to draft teams.'
                    : poolPlayers.length === 0
                    ? 'All available players have been drafted into Red or Black!'
                    : 'No players are currently available for selection.'}
                </div>
              ) : (
                filteredPool.map((player) => (
                  <div
                    key={player.id}
                    className="bg-[#1f1f23] hover:bg-[#2a292e] transition-colors p-2.5 rounded-sm flex items-center justify-between border border-[#2a292e]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt={player.nickname} className="w-8 h-8 rounded object-cover border border-[#2a292e] shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-[#0e0e12] border border-[#2a292e] flex items-center justify-center font-mono text-xs text-rose-500 font-bold shrink-0">
                          #{player.jerseyNumber}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline text-sm uppercase text-white truncate">
                          {player.nickname}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#ac8889]">
                          <span className="text-rose-400">{player.position}</span>
                          <span>•</span>
                          <span>{player.tries} Tries</span>
                          <span>•</span>
                          <span>{player.chuckersWon} Chuckers Won</span>
                        </div>
                      </div>
                    </div>

                    {canDraftTeams ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() =>
                            assignPlayerTeam(player.id, 'red')
                          }
                          className="h-7 px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] uppercase font-bold rounded-sm transition-colors flex items-center gap-1"
                          title="Draft to Team Red"
                        >
                          + Red
                        </button>
                        <button
                          onClick={() =>
                            assignPlayerTeam(player.id, 'black')
                          }
                          className="h-7 px-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-mono text-[10px] uppercase font-bold rounded-sm transition-colors flex items-center gap-1"
                          title="Draft to Team Black"
                        >
                          + Black
                        </button>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 bg-[#0e0e12] border border-[#2a292e] text-[#ac8889] font-mono text-[10px] rounded">
                        Available
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Roster Summary Card */}
            <div className="bg-[#1f1f23] p-3 rounded-sm flex flex-col gap-1 border border-[#2a292e]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#ac8889]">Active Match Draft Cap:</span>
                <span className="text-white font-bold">12 Players (6 vs 6)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#ac8889]">Roster Completeness:</span>
                <span className="text-rose-500 font-bold">
                  {Math.min(100, Math.round(((allRed.length + allBlack.length) / 18) * 100))}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0e0e12] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-rose-600 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round(((allRed.length + allBlack.length) / 18) * 100))}%`,
                  }}
                ></div>
              </div>
            </div>
          </section>

          {/* ================= RIGHT COLUMN: TEAM BLACK ================= */}
          <section className="lg:col-span-4 flex flex-col gap-4 bg-[#1b1b1f] rounded-sm p-4 shadow-md border border-zinc-700/60">
            {/* Team Black Header */}
            <div className="bg-[#1f1f23] p-3 rounded-sm flex items-center justify-between border-l-4 border-zinc-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-[#0e0e12] border border-zinc-700 flex items-center justify-center text-white font-headline text-lg font-bold shadow-sm">
                  B
                </div>
                <div className="flex flex-col">
                  <span className="font-headline text-base uppercase text-white tracking-wide leading-none">
                    THE BLACKS
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#ac8889] mt-0.5">
                    {blackStarters.length}/9 Players
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[#2a292e] text-white border border-zinc-700 font-mono text-[10px] uppercase rounded-sm font-bold">
                Black Carbon
              </span>
            </div>

            {/* Team Black: Nine Players */}
            <div className="bg-[#0e0e12] p-2.5 rounded-sm border border-[#2a292e] flex flex-col gap-1.5">
              <div className="flex items-center justify-between mb-1 text-[11px] font-mono text-[#ac8889] uppercase">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-white">stadium</span>
                  Starting 9
                </span>
                <span className="text-white font-bold">9v9 Team</span>
              </div>

              {blackStarters.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#ac8889] border border-dashed border-[#2a292e] rounded-sm">
                  No starters assigned yet. Use '+ Black' from the Available Pool.
                </div>
              ) : (
                blackStarters.map((player, idx) => {
                  const posLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
                  const posLabel = posLabels[idx] || `S${idx + 1}`;
                  return (
                    <div
                      key={player.id}
                      className="bg-[#1f1f23] hover:bg-[#2a292e] transition-colors rounded-sm p-2 flex items-center justify-between border border-transparent hover:border-zinc-500"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-sm bg-zinc-800 text-white border border-zinc-600 font-headline text-xs flex items-center justify-center font-bold">
                          {posLabel}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-headline text-sm uppercase text-white leading-tight">
                            {player.nickname} {idx === 0 && <span className="text-rose-500 font-bold">[C]</span>}
                          </span>
                          <span className="font-mono text-[10px] text-[#ac8889] uppercase">
                            {player.position} • #{player.jerseyNumber}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right font-mono text-[10px]">
                          <span className="text-white font-bold block">{player.tries} TRIES</span>
                          <span className="text-[#ac8889] block">{player.chuckersWon}W</span>
                        </div>
                        {canDraftTeams && (
                          <button
                            onClick={() => assignPlayerTeam(player.id, 'pool')}
                            className="w-7 h-7 rounded hover:bg-[#353439] flex items-center justify-center text-[#ac8889] hover:text-white transition-colors"
                            title="Unassign to pool"
                          >
                            <span className="material-symbols-outlined text-sm">remove_circle_outline</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Team Black Aggregate Pill */}
            <div className="bg-[#2a292e] p-2.5 rounded-sm flex items-center justify-between text-white border border-zinc-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300"></span>
                <span className="font-mono text-xs uppercase text-white">
                  {blackStarters.length}/9 Players
                </span>
              </div>
              <div className="flex items-center gap-3 font-headline text-sm">
                <span className="text-white">{blackTries} TRIES</span>
                <span className="text-white">{blackChuckersWon} CHUCKERS W</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Sticky Bottom Confirmation & WhatsApp Share Bar */}
      <section className="sticky bottom-0 z-30 w-full border-t border-white/10 bg-[#0e0e12]/95 backdrop-blur-xl py-4 px-4 sm:px-6 shadow-[0_-16px_40px_rgba(0,0,0,0.35)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* WhatsApp Preview Capsule */}
          <div className="flex items-center gap-3 bg-[#1b1b1f] px-4 py-2 rounded-sm w-full md:w-auto border border-[#2a292e] flex-1 max-w-3xl overflow-hidden">
            <span className="material-symbols-outlined text-rose-500 text-xl shrink-0">chat</span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-rose-500 font-bold">
                Matchday Broadcast Snippet
              </span>
              <p className="font-mono text-xs text-[#ac8889] truncate">
                📋 WEDNESDAY TOUCH TEAMS: Team Red ({allRed.length}): {redList} | Team Black ({allBlack.length}): {blackList}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
            <button
              onClick={copyWhatsAppText}
              className="h-10 px-4 bg-[#1f1f23] hover:bg-[#2a292e] text-white font-headline text-xs uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-colors border border-[#353439] shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
              <span>{copiedSnippet ? 'Copied!' : 'Copy WhatsApp Text'}</span>
            </button>
            <button
              onClick={exportTeamSheet}
              className="h-10 px-4 bg-[#1f1f23] hover:bg-[#2a292e] text-white font-headline text-xs uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-colors border border-[#353439] shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export Team Sheet
            </button>
            <button
              onClick={finalizeSelection}
              disabled={isFinalizing}
              className="h-11 px-6 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 text-white font-headline text-xs uppercase tracking-wider rounded-md flex items-center gap-1.5 transition-all shadow-[0_8px_24px_rgba(225,29,72,0.3)] font-bold"
              type="button"
            >
              <span className="material-symbols-outlined text-base">verified</span>
              {isFinalizing ? 'Saving Match...' : editingMatchRound ? 'Update Match & Finalize Teams' : 'Create Match & Finalize Teams'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
