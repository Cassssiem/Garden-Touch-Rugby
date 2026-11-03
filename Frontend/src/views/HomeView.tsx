import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { GardensLogo } from '../components/GardensLogo';

export const HomeView: React.FC = () => {
  const {
    clubConfig,
    setActivePage,
    players,
    matchResults,
    viewMatchScorecard,
    editMatchInScorekeeper,
    currentUser,
    openAdminDashboard,
  } = useApp();

  // Compute live team rosters from current players
  const redStarters = players.filter((p) => p.team === 'red' && !p.isSub);
  const redSub = players.find((p) => p.team === 'red' && p.isSub);

  const blackStarters = players.filter((p) => p.team === 'black' && !p.isSub);
  const blackSub = players.find((p) => p.team === 'black' && p.isSub);

  const availableCount = players.filter((p) => p.status === 'available').length;
  const pendingCount = players.filter((p) => p.status === 'pending').length;
  const unavailableCount = players.filter((p) => p.status === 'unavailable').length;

  const playedMatches = matchResults.filter((m) => m.isPlayed !== false && m.seriesScore !== 'TBA');
  const sortedPlayedMatches = [...playedMatches].sort((a, b) => b.roundNumber - a.roundNumber);
  const latestPlayedMatch = sortedPlayedMatches[0];

  // Upcoming scheduled match
  const upcomingScheduledMatch = matchResults.find((m) => m.isPlayed === false || m.seriesScore === 'TBA');
  const hasUpcomingMatch = Boolean(upcomingScheduledMatch);
  const pendingMatchesCount = matchResults.filter((m) => m.isPlayed === false || m.seriesScore === 'TBA').length;

  const upcomingRound = upcomingScheduledMatch
    ? upcomingScheduledMatch.roundNumber
    : (latestPlayedMatch ? latestPlayedMatch.roundNumber + 1 : clubConfig.matchdayCycle);

  const upcomingDate = upcomingScheduledMatch
    ? upcomingScheduledMatch.date
    : clubConfig.nextMatchdayDate;

  const upcomingPitch = upcomingScheduledMatch
    ? upcomingScheduledMatch.pitch
    : clubConfig.pitchLocation;

  const upcomingReferee = upcomingScheduledMatch?.referee || clubConfig.referee;

  // "Time Till Next Match" Countdown: only computed and displayed if there is a match coming up
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!hasUpcomingMatch || !upcomingScheduledMatch) {
      setTimeLeft('');
      return;
    }

    const computeTimeLeft = () => {
      const now = new Date();
      const [khStr, kmStr] = (clubConfig.kickoffTime || '18:30').split(':');
      const kh = parseInt(khStr, 10) || 18;
      const km = parseInt(kmStr, 10) || 30;

      let targetDate: Date | null = null;

      // 1. Check if upcoming scheduled match has a valid date string
      if (upcomingScheduledMatch.date) {
        const parsed = new Date(upcomingScheduledMatch.date);
        if (!isNaN(parsed.getTime())) {
          targetDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), kh, km, 0);
        }
      }

      // 2. Fallback: parse upcomingDate if valid
      if (!targetDate && upcomingDate) {
        const parsed = new Date(upcomingDate);
        if (!isNaN(parsed.getTime())) {
          targetDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), kh, km, 0);
        }
      }

      if (!targetDate) {
        setTimeLeft('FIXTURE SCHEDULED');
        return;
      }

      const diffMs = targetDate.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft('KICKOFF LIVE • IN PROGRESS');
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      const pad = (n: number) => String(n).padStart(2, '0');

      if (days > 0) {
        setTimeLeft(`${pad(days)}D : ${pad(hours)}H : ${pad(mins)}M : ${pad(secs)}S`);
      } else {
        setTimeLeft(`${pad(hours)}H : ${pad(mins)}M : ${pad(secs)}S`);
      }
    };

    computeTimeLeft();
    const timer = setInterval(computeTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [hasUpcomingMatch, upcomingScheduledMatch?.date, upcomingDate, clubConfig.kickoffTime]);

  // Upcoming match drafted or assigned rosters
  const upcomingRedStarters =
    redStarters.length > 0
      ? redStarters
      : (upcomingScheduledMatch?.redLineup
          ?.map((id) => players.find((p) => p.id === id))
          .filter((p): p is (typeof players)[0] => !!p) || []);

  const upcomingRedSub =
    redSub ||
    (upcomingScheduledMatch?.redLineup && upcomingRedStarters.length > 5
      ? upcomingRedStarters[5]
      : undefined);

  const upcomingBlackStarters =
    blackStarters.length > 0
      ? blackStarters
      : (upcomingScheduledMatch?.blackLineup
          ?.map((id) => players.find((p) => p.id === id))
          .filter((p): p is (typeof players)[0] => !!p) || []);

  const upcomingBlackSub =
    blackSub ||
    (upcomingScheduledMatch?.blackLineup && upcomingBlackStarters.length > 5
      ? upcomingBlackStarters[5]
      : undefined);

  // Try leadership stats
  const sortedByTries = [...players].sort((a, b) => b.tries - a.tries);
  const topScorer = sortedByTries[0];
  const topMvp = [...players].sort((a, b) => b.mvps - a.mvps)[0];

  const totalTries = players.reduce((sum, p) => sum + p.tries, 0);

  return (
    <div className="flex flex-col w-full">
      {/* Main Viewport Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Tactical Matchday Ribbon */}
        <div className="hidden">
          <div className="flex items-center gap-3">
            <GardensLogo size="md" className="w-12 h-12 shrink-0 drop-shadow-[0_2px_8px_rgba(225,29,72,0.4)]" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 bg-rose-600 text-white font-mono text-[10px] uppercase font-bold rounded-sm">
                  MATCHDAY CENTRAL
                </span>
                <span className="font-mono text-[11px] text-[#ac8889]">
                  {upcomingDate}
                </span>
              </div>
              <span className="font-headline text-base uppercase tracking-wider text-white">
                ROUND {upcomingRound} • NEXT FIXTURE ON DECK
              </span>
              <span className="font-mono text-xs text-[#ac8889] uppercase tracking-widest">
                {upcomingPitch} • {clubConfig.kickoffTime} KICKOFF
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="font-mono text-[10px] uppercase text-[#ac8889] tracking-wider">
                OFFICIAL SEEDING BALANCE
              </span>
              <span className="font-headline text-base text-rose-500 tracking-tight font-bold">
                98.4% PARITY RATING
              </span>
            </div>
            {/* Countdown only displays if there is a match coming up */}
            {hasUpcomingMatch && timeLeft && (
              <>
                <div className="h-8 w-px bg-[#2a292e]"></div>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-[10px] uppercase text-rose-400 tracking-wider font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    TIME TILL NEXT MATCH
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-mono text-xs sm:text-sm font-bold">
                    <span className="material-symbols-outlined text-rose-500 text-base">schedule</span>
                    <span>{timeLeft}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section Header: Matchday Hub */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#2a292e]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <h2 className="font-headline text-lg sm:text-xl uppercase tracking-wider text-white">
              MATCHDAY HUB • NEXT FIXTURE &amp; LATEST RESULT
            </h2>
          </div>
          <span className="font-mono text-xs uppercase text-[#ac8889] tracking-wider">
            {hasUpcomingMatch ? `ROUND #${upcomingRound} UPCOMING` : 'AWAITING SCHEDULE'}{' '}
            {latestPlayedMatch ? `• ROUND #${latestPlayedMatch.roundNumber} COMPLETED` : ''}
          </span>
        </div>

        {/* Match Hub Bento: Upcoming Fixture (Card A) + Latest Match Result (Card B) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* CARD A: NEXT MATCH COMING UP */}
          <div className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${hasUpcomingMatch ? 'bg-rose-600' : 'bg-zinc-700'}`}></div>

            <div className="p-6 flex flex-col gap-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-white font-headline text-[11px] uppercase tracking-wider font-bold rounded-sm flex items-center gap-1.5 shadow-sm ${
                      hasUpcomingMatch ? 'bg-rose-600' : 'bg-[#2a292e] text-[#ac8889]'
                    }`}
                  >
                    {hasUpcomingMatch ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        <span>NEXT MATCH COMING UP</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xs text-rose-500">event_busy</span>
                        <span>NEXT MATCH: PENDING SCHEDULE</span>
                      </>
                    )}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#ac8889]">
                    {hasUpcomingMatch
                      ? `ROUND ${upcomingRound} • ${upcomingDate}`
                      : `ROUND ${upcomingRound} • NO FIXTURE SCHEDULED`}
                  </span>
                </div>
                {/* Time Till Next Match: ONLY displayed if there is a match that is coming up */}
                {hasUpcomingMatch && timeLeft ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0e0e12] text-rose-300 font-mono text-[11px] rounded-sm border border-rose-500/40 shadow-inner"
                    title={`Kickoff at ${upcomingScheduledMatch?.date} ${clubConfig.kickoffTime} • Time till match: ${timeLeft}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-[10px] uppercase text-[#ac8889] font-bold tracking-wider">
                      TIME TILL NEXT MATCH:
                    </span>
                    <span className="font-bold text-white tracking-wider">{timeLeft}</span>
                  </div>
                ) : (
                  <span className="font-mono text-[11px] text-[#ac8889] px-2.5 py-1 bg-[#131317] rounded-sm border border-[#2a292e] uppercase font-bold">
                    Awaiting Fixture Creation
                  </span>
                )}
              </div>

              {/* Informative banner when no match has been scheduled yet */}
              {!hasUpcomingMatch && (
                <div className="bg-[#141418] border border-amber-500/30 p-3 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-inner">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="material-symbols-outlined text-amber-400 text-lg shrink-0">calendar_clock</span>
                    <div className="flex flex-col">
                      <span className="font-headline uppercase text-white font-bold text-xs">
                        No Fixture Officially Scheduled
                      </span>
                      <span className="font-mono text-[11px] text-[#ac8889]">
                        Round #{upcomingRound} is in preparation. Countdown and kickoff will activate once scheduled by an admin.
                      </span>
                    </div>
                  </div>
                  {currentUser?.role === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => openAdminDashboard('add-match')}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shrink-0 flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-xs">add_circle</span>
                      <span>+ Schedule Match</span>
                    </button>
                  )}
                </div>
              )}

              {/* Clash Display */}
              <div className="bg-[#0e0e12] p-4 rounded-sm flex items-center justify-between gap-3 border border-[#2a292e]">
                {/* Team Red */}
                <div className="flex-1 flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-rose-400 font-bold">
                    TEAM RED
                  </span>
                  <span className="font-headline text-2xl uppercase text-white tracking-wide">
                    RED PACK
                  </span>
                  <span className="text-xs text-[#ac8889]">Home Whites / Red Trim</span>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center justify-center shrink-0 px-4">
                  <span className="font-headline text-3xl text-rose-500 italic font-bold">VS</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#ac8889]">
                    5-A-SIDE
                  </span>
                </div>

                {/* Team Black */}
                <div className="flex-1 flex flex-col items-end text-right">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                    TEAM BLACK
                  </span>
                  <span className="font-headline text-2xl uppercase text-white tracking-wide">
                    BLACK SHADOW
                  </span>
                  <span className="text-xs text-[#ac8889]">Away Obsidian Strip</span>
                </div>
              </div>

              {/* Rules & Venue Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#1f1f23] p-3 rounded-sm border border-[#2a292e]">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase text-[#ac8889]">MATCH FORMAT</span>
                  <span className="font-headline text-xs text-white">3 × 12m Chuckers</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase text-[#ac8889]">KICKOFF TIME</span>
                  <span className="font-headline text-xs text-rose-400 font-bold">{clubConfig.kickoffTime} Local</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase text-[#ac8889]">VENUE / PITCH</span>
                  <span className="font-headline text-xs text-white truncate" title={upcomingPitch}>
                    {upcomingPitch}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase text-[#ac8889]">OFFICIAL REF</span>
                  <span className="font-headline text-xs text-white">{upcomingReferee}</span>
                </div>
              </div>

              {/* Tactical Lineup Preview */}
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center justify-between text-xs font-mono uppercase text-[#ac8889]">
                  <span>CONFIRMED SQUADS &amp; POSITIONS</span>
                  <span className="text-rose-500 font-bold">
                    {availableCount >= 10 ? '100% QUORUM LOCKED' : `${availableCount} AVAILABLE IN POOL`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Red Roster Box */}
                  <div className="bg-[#1f1f23] p-3 rounded-sm border border-[#2a292e] flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-1 border-b border-[#2a292e]">
                      <span className="font-headline text-xs uppercase text-rose-500 font-bold">
                        TEAM RED ROSTER
                      </span>
                      <span className="font-mono text-[10px] text-[#ac8889]">
                        {upcomingRedStarters.length} + {upcomingRedSub ? '1 SUB' : '0 SUB'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {upcomingRedStarters.length === 0 ? (
                        <div className="text-xs text-[#ac8889] italic py-2 text-center">
                          No players assigned yet. Click 'Team Selection &amp; Draft'.
                        </div>
                      ) : (
                        upcomingRedStarters.slice(0, 5).map((p, idx) => (
                          <div
                            key={p.id}
                            className="flex justify-between items-center bg-[#131317] px-2 py-1 rounded-sm text-xs"
                          >
                            <span className="font-headline uppercase text-white">
                              {p.nickname} {idx === 0 && <span className="text-rose-500 font-bold">[C]</span>}
                            </span>
                            <span className="font-mono text-[10px] text-[#ac8889] uppercase">
                              {p.position}
                            </span>
                          </div>
                        ))
                      )}

                      {upcomingRedSub && (
                        <div className="flex justify-between items-center bg-[#2a292e] px-2 py-1 rounded-sm text-xs text-rose-300">
                          <span className="italic font-headline uppercase">Sub: {upcomingRedSub.nickname}</span>
                          <span className="font-mono text-[10px] uppercase">IMPACT SUB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Black Roster Box */}
                  <div className="bg-[#1f1f23] p-3 rounded-sm border border-[#2a292e] flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-1 border-b border-[#2a292e]">
                      <span className="font-headline text-xs uppercase text-zinc-300 font-bold">
                        TEAM BLACK ROSTER
                      </span>
                      <span className="font-mono text-[10px] text-[#ac8889]">
                        {upcomingBlackStarters.length} + {upcomingBlackSub ? '1 SUB' : '0 SUB'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {upcomingBlackStarters.length === 0 ? (
                        <div className="text-xs text-[#ac8889] italic py-2 text-center">
                          No players assigned yet. Click 'Team Selection &amp; Draft'.
                        </div>
                      ) : (
                        upcomingBlackStarters.slice(0, 5).map((p, idx) => (
                          <div
                            key={p.id}
                            className="flex justify-between items-center bg-[#131317] px-2 py-1 rounded-sm text-xs"
                          >
                            <span className="font-headline uppercase text-white">
                              {p.nickname} {idx === 0 && <span className="text-rose-500 font-bold">[C]</span>}
                            </span>
                            <span className="font-mono text-[10px] text-[#ac8889] uppercase">
                              {p.position}
                            </span>
                          </div>
                        ))
                      )}

                      {upcomingBlackSub && (
                        <div className="flex justify-between items-center bg-[#2a292e] px-2 py-1 rounded-sm text-xs text-zinc-300">
                          <span className="italic font-headline uppercase">Sub: {upcomingBlackSub.nickname}</span>
                          <span className="font-mono text-[10px] uppercase">IMPACT SUB</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="p-6 pt-0 flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setActivePage('team-selection')}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-all text-center shadow-md shadow-rose-950/40 font-bold flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">groups</span>
                <span>Team Selection &amp; Draft</span>
              </button>
              <button
                onClick={() => setActivePage('availability-pool')}
                className="py-2 px-3 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm transition-all text-center border border-[#353439] flex items-center justify-center gap-1 font-bold"
              >
                <span className="material-symbols-outlined text-sm text-rose-400">event_available</span>
                <span>Pool ({availableCount})</span>
              </button>
              {currentUser?.role === 'ADMIN' && (
                <button
                  onClick={() => {
                    if (upcomingScheduledMatch) {
                      editMatchInScorekeeper(upcomingScheduledMatch.roundNumber);
                    } else {
                      openAdminDashboard('add-match');
                    }
                  }}
                  className="py-2 px-3 bg-[#1e1e24] hover:bg-[#282832] text-rose-400 hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-all text-center border border-rose-500/30 flex items-center justify-center gap-1 font-bold"
                  title="Open Admin Scorekeeper for upcoming fixture"
                >
                  <span className="material-symbols-outlined text-sm">sports_score</span>
                  <span>{upcomingScheduledMatch ? 'Enter Scores' : '+ Add Match'}</span>
                </button>
              )}
            </div>
          </div>

          {/* CARD B: LATEST MATCH RESULT */}
          <div className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>

            <div className="p-6 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-700/80 text-emerald-200 border border-emerald-500/40 font-headline text-[11px] uppercase tracking-wider font-bold rounded-sm flex items-center gap-1.5 shadow-sm">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    <span>LATEST MATCH RESULT</span>
                  </span>
                  {latestPlayedMatch && (
                    <span className="font-mono text-xs uppercase tracking-wider text-[#ac8889]">
                      ROUND {latestPlayedMatch.roundNumber} • {latestPlayedMatch.date}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#ac8889] px-2 py-0.5 bg-[#1f1f23] rounded-sm border border-[#2a292e]">
                  {latestPlayedMatch ? 'OFFICIAL FINAL' : 'AWAITING KICKOFF'}
                </span>
              </div>

              {latestPlayedMatch ? (
                <>
                  {/* Series Outcome */}
                  <div className="bg-[#0e0e12] p-4 rounded-sm flex flex-col items-center justify-center text-center border border-[#2a292e] shadow-inner">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-rose-500 font-bold">
                      SERIES RESULT • 3 CHUCKERS
                    </span>
                    <div className="flex items-center justify-center gap-4 my-2">
                      <div className="flex flex-col items-end">
                        <span className="font-headline text-2xl uppercase text-white font-bold">RED</span>
                        <span className="text-[10px] font-mono text-[#ac8889]">Home Whites</span>
                      </div>
                      <div className="flex items-center gap-2.5 bg-[#1f1f23] px-4 py-1.5 rounded-sm border border-[#2a292e] shadow-sm">
                        <span className="font-headline text-3xl text-rose-500 font-bold">
                          {latestPlayedMatch.seriesScore.split('-')[0]?.trim() ||
                            String(latestPlayedMatch.chuckers.filter((c) => c.winner === 'RED').length)}
                        </span>
                        <span className="text-[#ac8889] font-headline text-xl font-bold">-</span>
                        <span className="font-headline text-3xl text-white font-bold">
                          {latestPlayedMatch.seriesScore.split('-')[1]?.trim() ||
                            String(latestPlayedMatch.chuckers.filter((c) => c.winner === 'BLACK').length)}
                        </span>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-headline text-2xl uppercase text-zinc-300 font-bold">BLACK</span>
                        <span className="text-[10px] font-mono text-[#ac8889]">Away Obsidian</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 text-xs font-headline uppercase font-bold rounded-sm ${
                          latestPlayedMatch.seriesWinner === 'RED'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                            : latestPlayedMatch.seriesWinner === 'BLACK'
                            ? 'bg-zinc-800 text-zinc-200 border border-zinc-600'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {latestPlayedMatch.seriesWinner === 'DRAW'
                          ? '🤝 SERIES DRAW'
                          : `🏆 TEAM ${latestPlayedMatch.seriesWinner} WINS SERIES`}
                      </span>
                    </div>
                  </div>

                  {/* Chucker-by-Chucker Ledger */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#ac8889]">
                      CHUCKER-BY-CHUCKER BREAKDOWN
                    </span>

                    {latestPlayedMatch.chuckers.map((chucker) => (
                      <div
                        key={chucker.chuckerNumber}
                        className="bg-[#1f1f23] p-2.5 rounded-sm flex items-center justify-between text-white border border-[#2a292e]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-[#2a292e] flex items-center justify-center font-mono text-xs font-bold text-rose-500 rounded-sm">
                            C{chucker.chuckerNumber}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-headline text-xs uppercase">
                              CHUCKER {chucker.chuckerNumber} {chucker.chuckerNumber === 3 && '• DECIDER'}
                            </span>
                            <span className="font-mono text-[10px] text-[#ac8889]">
                              Elapsed: {chucker.elapsedTime}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className={chucker.winner === 'RED' ? 'text-rose-500 font-bold' : 'text-[#ac8889]'}>
                            RED {chucker.redScore}
                          </span>
                          <span className="text-[#ac8889]">-</span>
                          <span className={chucker.winner === 'BLACK' ? 'text-white font-bold' : 'text-[#ac8889]'}>
                            {chucker.blackScore} BLK
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-headline uppercase rounded-sm ${
                              chucker.winner === 'RED'
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                                : chucker.winner === 'BLACK'
                                ? 'bg-zinc-800 text-zinc-300 border border-zinc-600'
                                : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {chucker.winner} WIN
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* MVP Banner */}
                  <div className="bg-[#2a292e] p-3 rounded-sm flex items-center justify-between gap-3 border border-[#353439]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-rose-600 text-white flex items-center justify-center rounded-sm font-bold shadow shrink-0">
                        <span className="material-symbols-outlined text-lg">star</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-[10px] uppercase text-rose-400 tracking-wider font-bold">
                          MATCH MVP • OFFICIAL
                        </span>
                        <span className="font-headline text-xs uppercase text-white truncate">
                          {players.find((p) => p.id === latestPlayedMatch.mvpPlayerId)?.nickname ||
                            latestPlayedMatch.mvpPlayerId ||
                            'Match MVP'}
                        </span>
                        <span className="text-[11px] text-[#ac8889] truncate max-w-[220px]">
                          {latestPlayedMatch.mvpCitation || 'Outstanding performance across 3 chuckers'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[10px] uppercase text-[#ac8889] block">AGGREGATE</span>
                      <div className="font-headline text-base sm:text-lg text-white font-bold">
                        {latestPlayedMatch.redTotalTries + latestPlayedMatch.blackTotalTries} TRIES
                      </div>
                      <span className="font-mono text-[10px] text-[#ac8889]">
                        {latestPlayedMatch.redTotalTries} - {latestPlayedMatch.blackTotalTries}
                      </span>
                    </div>
                  </div>

                  {/* Try Scorers (Who Scored) Breakdown Teaser */}
                  {(() => {
                    const redScorersList = Object.entries(latestPlayedMatch.redScorers || {})
                      .filter(([_, count]) => count > 0)
                      .map(([id, count]) => {
                        const p = players.find((pl) => pl.id === id);
                        return { name: p?.nickname || id, tries: count, jersey: p?.jerseyNumber };
                      });

                    const blackScorersList = Object.entries(latestPlayedMatch.blackScorers || {})
                      .filter(([_, count]) => count > 0)
                      .map(([id, count]) => {
                        const p = players.find((pl) => pl.id === id);
                        return { name: p?.nickname || id, tries: count, jersey: p?.jerseyNumber };
                      });

                    const hasScorers = redScorersList.length > 0 || blackScorersList.length > 0;

                    return (
                      <div
                        onClick={() => viewMatchScorecard(latestPlayedMatch.roundNumber)}
                        className="bg-[#141418] hover:bg-[#1a1a20] border border-[#2a292e] hover:border-rose-500/50 p-3 rounded-sm cursor-pointer transition-all group shadow-sm"
                        title="Click to view full match scorecard and see who scored"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-rose-500 text-sm">sports_rugby</span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-rose-400 font-bold">
                              TRY SCORERS • WHO SCORED
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#ac8889] group-hover:text-rose-400 flex items-center gap-0.5 transition-colors font-bold">
                            <span>Open Scorecard</span>
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </span>
                        </div>

                        {hasScorers ? (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {/* Red Scorers */}
                            <div className="bg-[#1f1f23] p-2 rounded-sm border border-rose-500/20">
                              <span className="font-headline text-[10px] uppercase text-rose-400 block mb-1 font-bold">
                                RED ({latestPlayedMatch.redTotalTries} Tries)
                              </span>
                              <div className="flex flex-col gap-1">
                                {redScorersList.length > 0 ? (
                                  redScorersList.map((s, idx) => (
                                    <div
                                      key={`home-red-scorer-${idx}-${s.name}`}
                                      className="flex items-center justify-between font-mono text-[11px] text-white"
                                    >
                                      <span className="truncate">
                                        {s.jersey ? `#${s.jersey} ` : ''}
                                        {s.name}
                                      </span>
                                      <span className="text-rose-400 font-bold shrink-0">
                                        {s.tries} {s.tries === 1 ? 'try' : 'tries'}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[#ac8889] text-[10px] font-mono italic">No tries recorded</span>
                                )}
                              </div>
                            </div>

                            {/* Black Scorers */}
                            <div className="bg-[#1f1f23] p-2 rounded-sm border border-zinc-700">
                              <span className="font-headline text-[10px] uppercase text-zinc-300 block mb-1 font-bold">
                                BLACK ({latestPlayedMatch.blackTotalTries} Tries)
                              </span>
                              <div className="flex flex-col gap-1">
                                {blackScorersList.length > 0 ? (
                                  blackScorersList.map((s, idx) => (
                                    <div
                                      key={`home-black-scorer-${idx}-${s.name}`}
                                      className="flex items-center justify-between font-mono text-[11px] text-white"
                                    >
                                      <span className="truncate">
                                        {s.jersey ? `#${s.jersey} ` : ''}
                                        {s.name}
                                      </span>
                                      <span className="text-zinc-300 font-bold shrink-0">
                                        {s.tries} {s.tries === 1 ? 'try' : 'tries'}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[#ac8889] text-[10px] font-mono italic">No tries recorded</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-[#ac8889] text-[11px] font-mono">
                              Total {latestPlayedMatch.redTotalTries + latestPlayedMatch.blackTotalTries} tries recorded in this match
                            </span>
                            <span className="text-rose-400 text-[11px] font-headline uppercase font-bold flex items-center gap-0.5">
                              <span>Full Breakdown</span>
                              <span className="material-symbols-outlined text-xs">launch</span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              ) : (
                /* Clean Empty State when no games have been recorded yet */
                <div className="bg-[#0e0e12] border border-[#2a292e] p-6 rounded-sm text-center flex flex-col items-center justify-center gap-3 my-2">
                  <div className="w-12 h-12 rounded-full bg-[#1b1b1f] flex items-center justify-center text-rose-500">
                    <span className="material-symbols-outlined text-2xl">scoreboard</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-headline text-base uppercase text-white">
                      No Completed Matches Yet
                    </span>
                    <p className="text-xs text-[#ac8889] max-w-xs">
                      Post-match results, chucker breakdown, and official MVP citations will be captured here after Round #{upcomingRound}.
                    </p>
                  </div>
                  {currentUser?.role === 'ADMIN' ? (
                    <button
                      onClick={() => openAdminDashboard('add-match')}
                      className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase rounded-sm transition-colors shadow font-bold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      <span>Record Match (Admin)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActivePage('availability-pool')}
                      className="mt-2 px-3 py-1.5 bg-[#2a292e] hover:bg-[#353439] text-white font-headline text-xs uppercase rounded-sm transition-colors shadow"
                    >
                      Check Squad Pool
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Card B Footer */}
            <div className="p-6 pt-0 flex flex-wrap sm:flex-nowrap gap-2">
              <button
                onClick={() => setActivePage('match-history')}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-all text-center shadow-md font-bold"
              >
                Match History by Year
              </button>
              <button
                onClick={() => {
                  if (latestPlayedMatch) {
                    viewMatchScorecard(latestPlayedMatch.roundNumber);
                  } else {
                    setActivePage('match-history');
                  }
                }}
                className="flex-1 py-2 px-3 bg-[#2a292e] hover:bg-[#353439] text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-all text-center border border-[#353439] hover:border-rose-500 flex items-center justify-center gap-1.5 shadow-sm font-bold"
                title={
                  latestPlayedMatch
                    ? 'View full scorecard and see who scored in Round #' + latestPlayedMatch.roundNumber
                    : 'View match history'
                }
              >
                <span className="material-symbols-outlined text-sm text-rose-400">sports_score</span>
                <span>{latestPlayedMatch ? 'Full Scorecard' : 'All Fixtures'}</span>
              </button>
              {latestPlayedMatch && currentUser?.role === 'ADMIN' && (
                <button
                  onClick={() => editMatchInScorekeeper(latestPlayedMatch.roundNumber)}
                  className="py-2 px-3 bg-[#1e1e24] hover:bg-rose-600 text-rose-400 hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-all text-center border border-rose-500/30 flex items-center justify-center gap-1 font-bold shadow-sm"
                  title={`Update Round #${latestPlayedMatch.roundNumber} match score and details in Admin Dashboard`}
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  <span>Update Score</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Season Overview & Telemetry Strip */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-[#ac8889]">
              SEASON PROGRESS &amp; SQUAD TELEMETRY
            </span>
            <span className="font-mono text-xs uppercase text-[#ac8889]">
              {matchResults.length} ROUNDS LOGGED
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Metric 1: Fixtures */}
            <div className="bg-[#1b1b1f] p-4 rounded-sm border border-[#2a292e] flex flex-col justify-between shadow-sm">
              <span className="font-mono text-[10px] uppercase text-[#ac8889]">MATCHDAYS PLAYED</span>
              <div className="my-1 flex items-baseline gap-1">
                <span className="font-headline text-3xl text-white">{playedMatches.length}</span>
                <span className="font-mono text-xs text-[#ac8889]">PLAYED {pendingMatchesCount > 0 ? `(${pendingMatchesCount} TBA)` : ''}</span>
              </div>
              <span className="text-xs text-rose-500 font-mono">
                {playedMatches.length * 3} Chuckers Contested
              </span>
            </div>

            {/* Metric 2: Head-to-Head */}
            <div className="bg-[#1b1b1f] p-4 rounded-sm border border-[#2a292e] flex flex-col justify-between shadow-sm">
              <span className="font-mono text-[10px] uppercase text-[#ac8889]">SERIES HEAD-TO-HEAD</span>
              <div className="my-1 flex items-baseline gap-1.5">
                <span className="font-headline text-3xl text-rose-500 font-bold">
                  {playedMatches.filter((m) => m.seriesWinner === 'RED').length}
                </span>
                <span className="text-[#ac8889] font-headline text-lg">-</span>
                <span className="font-headline text-3xl text-white font-bold">
                  {playedMatches.filter((m) => m.seriesWinner === 'BLACK').length}
                </span>
              </div>
              <span className="text-xs text-[#ac8889] font-mono">Played Series (Red vs Black)</span>
            </div>

            {/* Metric 3: Total Tries */}
            <div className="bg-[#1b1b1f] p-4 rounded-sm border border-[#2a292e] flex flex-col justify-between shadow-sm">
              <span className="font-mono text-[10px] uppercase text-[#ac8889]">TOTAL LEAGUE TRIES</span>
              <div className="my-1">
                <span className="font-headline text-3xl text-white">{totalTries}</span>
              </div>
              <span className="text-xs text-[#ac8889] font-mono">
                Across {players.length} squad members
              </span>
            </div>

            {/* Metric 4: Squad Pool */}
            <div className="bg-[#1b1b1f] p-4 rounded-sm border border-[#2a292e] flex flex-col justify-between shadow-sm">
              <span className="font-mono text-[10px] uppercase text-[#ac8889]">ACTIVE SQUAD POOL</span>
              <div className="my-1 flex items-baseline gap-1">
                <span className="font-headline text-3xl text-rose-500 font-bold">{availableCount}</span>
                <span className="font-mono text-xs text-[#ac8889]">AVAIL / {players.length}</span>
              </div>
              <span className="text-xs text-[#ac8889] font-mono">
                {pendingCount} Standby • {unavailableCount} Sidelined
              </span>
            </div>

            {/* Metric 5: Leaders */}
            <div className="bg-[#1b1b1f] p-4 rounded-sm border border-[#2a292e] flex flex-col justify-between col-span-2 md:col-span-1 shadow-sm">
              <span className="font-mono text-[10px] uppercase text-[#ac8889]">LEADERSHIP BOARD</span>
              <div className="my-1 flex flex-col text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-white">Tries: {topScorer?.nickname || 'None yet'}</span>
                  <span className="text-rose-500 font-bold">{topScorer?.tries || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">MVP: {topMvp?.nickname || 'None yet'}</span>
                  <span className="text-rose-500 font-bold">{topMvp?.mvps || 0}</span>
                </div>
              </div>
              <span className="font-mono text-[10px] text-[#ac8889] uppercase tracking-wider">
                {matchResults.length > 0 ? `Updated Round ${clubConfig.matchdayCycle}` : 'Awaiting Match 1'}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Lifecycle Operations Shortcuts */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-[#ac8889]">
              MATCHDAY OPERATIONS SHORTCUTS
            </span>
            <span className="font-mono text-xs uppercase text-[#ac8889]">WEEKLY CYCLE WORKFLOW</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Stage 1 */}
            <div
              onClick={() => setActivePage('availability-pool')}
              className="bg-[#1b1b1f] hover:bg-[#1f1f23] p-5 rounded-sm border border-[#2a292e] flex flex-col justify-between cursor-pointer group transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-[#2a292e] group-hover:bg-rose-600 text-white flex items-center justify-center rounded-sm transition-colors shadow">
                  <span className="material-symbols-outlined">event_available</span>
                </div>
                <span className="font-mono text-[10px] text-[#ac8889] group-hover:text-rose-500 uppercase font-bold">
                  STAGE 01
                </span>
              </div>
              <div className="mt-4">
                <h4 className="font-headline text-base uppercase text-white group-hover:text-rose-400 transition-colors">
                  Availability Pool
                </h4>
                <p className="text-xs text-[#ac8889] mt-1">
                  Manage RSVPs, roll call &amp; squad check-ins before drafting.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-rose-500 font-mono text-[11px] uppercase tracking-wider font-bold">
                <span>Pool Quorum {availableCount}/14</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>

            {/* Stage 2 */}
            <div
              onClick={() => setActivePage('match-history')}
              className="bg-[#1b1b1f] hover:bg-[#1f1f23] p-5 rounded-sm border border-[#2a292e] flex flex-col justify-between cursor-pointer group transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-[#2a292e] group-hover:bg-rose-600 text-white flex items-center justify-center rounded-sm transition-colors shadow">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <span className="font-mono text-[10px] text-[#ac8889] group-hover:text-rose-500 uppercase font-bold">
                  STAGE 02
                </span>
              </div>
              <div className="mt-4">
                <h4 className="font-headline text-base uppercase text-white group-hover:text-rose-400 transition-colors">
                  Match History
                </h4>
                <p className="text-xs text-[#ac8889] mt-1">
                  Review official scorecards, 3-chucker results &amp; try scorer breakdown.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-rose-500 font-mono text-[11px] uppercase tracking-wider font-bold">
                <span>{matchResults.length} Rounds Logged</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>

            {/* Stage 3 */}
            <div
              onClick={() => setActivePage('player-hub')}
              className="bg-[#1b1b1f] hover:bg-[#1f1f23] p-5 rounded-sm border border-[#2a292e] flex flex-col justify-between cursor-pointer group transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-[#2a292e] group-hover:bg-rose-600 text-white flex items-center justify-center rounded-sm transition-colors shadow">
                  <span className="material-symbols-outlined">groups</span>
                </div>
                <span className="font-mono text-[10px] text-[#ac8889] group-hover:text-rose-500 uppercase font-bold">
                  STAGE 03
                </span>
              </div>
              <div className="mt-4">
                <h4 className="font-headline text-base uppercase text-white group-hover:text-rose-400 transition-colors">
                  Player Hub
                </h4>
                <p className="text-xs text-[#ac8889] mt-1">
                  Explore player profiles, jerseys, positions &amp; all-time statistics.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-rose-500 font-mono text-[11px] uppercase tracking-wider font-bold">
                <span>{players.length} Squad Profiles</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>

            {/* Stage 4 (Admin Only) */}
            {currentUser?.role === 'ADMIN' && (
              <div
                onClick={() => openAdminDashboard('add-match')}
                className="bg-[#18181e] hover:bg-[#202028] p-5 rounded-sm border border-rose-500/40 flex flex-col justify-between cursor-pointer group transition-all shadow-md sm:col-span-2 lg:col-span-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-rose-600 text-white flex items-center justify-center rounded-sm shadow">
                    <span className="material-symbols-outlined">admin_panel_settings</span>
                  </div>
                  <span className="font-mono text-[10px] text-rose-400 uppercase font-bold">
                    ADMIN COMMAND CENTER
                  </span>
                </div>
                <div className="mt-4">
                  <h4 className="font-headline text-base uppercase text-white group-hover:text-rose-400 transition-colors">
                    Admin Dashboard: Add Match • Update Match • Approvals
                  </h4>
                  <p className="text-xs text-[#ac8889] mt-1">
                    Direct access to official scorekeeper capture, historical match editing, and applicant review queue.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-rose-500 font-mono text-[11px] uppercase tracking-wider font-bold">
                  <span>Open Admin Control Suite</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
