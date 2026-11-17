import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChuckerScore, MatchResult } from '../types';
import { getPendingScoreDisplay, isMatchOverdue } from '../utils/matchStatus';

export const MatchResultsCaptureView: React.FC = () => {
  const {
    clubConfig,
    players,
    matchResults,
    recordMatchResult,
    selectedMatchRound,
    setSelectedMatchRound,
    setActivePage,
    showToast,
    viewMatchScorecard,
  } = useApp();

  // If selectedMatchRound is explicitly set from an external link, open editor for that match.
  // If no matches exist yet, open editor in 'new' mode.
  // Otherwise, default to 'list' view so the user sees all matches first and clicks one to edit!
  const [viewMode, setViewMode] = useState<'list' | 'editor'>(() => {
    if (selectedMatchRound && matchResults.some((m) => m.roundNumber === selectedMatchRound)) {
      return 'editor';
    }
    if (matchResults.length === 0) {
      return 'editor';
    }
    return 'list';
  });

  // Search and filter for the list view
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'RED' | 'BLACK' | 'DRAW'>('ALL');

  // Determine initial match target:
  const [targetMatchMode, setTargetMatchMode] = useState<number | 'new'>(() => {
    if (selectedMatchRound && matchResults.some((m) => m.roundNumber === selectedMatchRound)) {
      return selectedMatchRound;
    }
    if (matchResults.length > 0) {
      return matchResults[0].roundNumber;
    }
    return 'new';
  });

  // Match metadata state
  const [roundNumberInput, setRoundNumberInput] = useState<number>(() => {
    if (typeof targetMatchMode === 'number') {
      return targetMatchMode;
    }
    return matchResults.length > 0 ? Math.max(...matchResults.map((m) => m.roundNumber)) + 1 : clubConfig.matchdayCycle;
  });

  const [dateInput, setDateInput] = useState<string>(() => {
    const existing = typeof targetMatchMode === 'number' ? matchResults.find((m) => m.roundNumber === targetMatchMode) : null;
    return existing?.date || new Date().toISOString().split('T')[0];
  });


  // 3-Chucker scores state
  const [chuckers, setChuckers] = useState<[ChuckerScore, ChuckerScore, ChuckerScore]>(() => {
    const existing = typeof targetMatchMode === 'number' ? matchResults.find((m) => m.roundNumber === targetMatchMode) : null;
    if (existing?.chuckers && existing.chuckers.length === 3) {
      return JSON.parse(JSON.stringify(existing.chuckers));
    }
    return [
      { chuckerNumber: 1, redScore: 0, blackScore: 0, elapsedTime: "12' FT", winner: 'DRAW' },
      { chuckerNumber: 2, redScore: 0, blackScore: 0, elapsedTime: "12' FT", winner: 'DRAW' },
      { chuckerNumber: 3, redScore: 0, blackScore: 0, elapsedTime: "12' FT", winner: 'DRAW' },
    ];
  });

  // Scorer tries ledger
  const [redScorerTries, setRedScorerTries] = useState<Record<string, number>>(() => {
    const existing = typeof targetMatchMode === 'number' ? matchResults.find((m) => m.roundNumber === targetMatchMode) : null;
    return existing?.redScorers ? { ...existing.redScorers } : {};
  });

  const [blackScorerTries, setBlackScorerTries] = useState<Record<string, number>>(() => {
    const existing = typeof targetMatchMode === 'number' ? matchResults.find((m) => m.roundNumber === targetMatchMode) : null;
    return existing?.blackScorers ? { ...existing.blackScorers } : {};
  });

  // MVP selection
  const [selectedMvpId, setSelectedMvpId] = useState<string>(() => {
    const existing = typeof targetMatchMode === 'number' ? matchResults.find((m) => m.roundNumber === targetMatchMode) : null;
    return existing?.mvpPlayerId || '';
  });
  const [correctionReason, setCorrectionReason] = useState('');

  const [mvpCitation, setMvpCitation] = useState<string>(() => {
    const existing = typeof targetMatchMode === 'number' ? matchResults.find((m) => m.roundNumber === targetMatchMode) : null;
    return existing?.mvpCitation || 'Outstanding match performance and tactical contribution.';
  });

  // Load a match's data into the form
  const loadMatchData = (target: number | 'new') => {
    if (target === 'new') {
      const nextRound = matchResults.length > 0 ? Math.max(...matchResults.map((m) => m.roundNumber)) + 1 : clubConfig.matchdayCycle;
      setRoundNumberInput(nextRound);
      setDateInput(new Date().toISOString().split('T')[0]);
      setChuckers([
        { chuckerNumber: 1, redScore: 0, blackScore: 0, elapsedTime: "12' FT", winner: 'DRAW' },
        { chuckerNumber: 2, redScore: 0, blackScore: 0, elapsedTime: "12' FT", winner: 'DRAW' },
        { chuckerNumber: 3, redScore: 0, blackScore: 0, elapsedTime: "12' FT", winner: 'DRAW' },
      ]);
      setRedScorerTries({});
      setBlackScorerTries({});
      setSelectedMvpId('');
      setCorrectionReason('');
      setMvpCitation('Outstanding match performance and tactical contribution.');
    } else {
      const match = matchResults.find((m) => m.roundNumber === target);
      if (match) {
        setRoundNumberInput(match.roundNumber);
        setDateInput(match.date || new Date().toISOString().split('T')[0]);
        setChuckers(
          match.chuckers && match.chuckers.length === 3
            ? JSON.parse(JSON.stringify(match.chuckers))
            : [
                { chuckerNumber: 1, redScore: 0, blackScore: 0, elapsedTime: "12' FT", winner: 'DRAW' },
                { chuckerNumber: 2, redScore: 0, blackScore: 0, elapsedTime: "12' FT", winner: 'DRAW' },
                { chuckerNumber: 3, redScore: 0, blackScore: 0, elapsedTime: "12' FT", winner: 'DRAW' },
              ]
        );
        setRedScorerTries(match.redScorers ? { ...match.redScorers } : {});
        setBlackScorerTries(match.blackScorers ? { ...match.blackScorers } : {});
        setSelectedMvpId(match.mvpPlayerId || '');
        setMvpCitation(match.mvpCitation || 'Outstanding match performance and tactical contribution.');
        setCorrectionReason('');
      }
    }
  };

  // Sync if selectedMatchRound is set from external action
  useEffect(() => {
    if (selectedMatchRound && matchResults.some((m) => m.roundNumber === selectedMatchRound)) {
      setTargetMatchMode(selectedMatchRound);
      loadMatchData(selectedMatchRound);
      setViewMode('editor');
    } else if (selectedMatchRound === null && matchResults.length > 0) {
      setViewMode('list');
    }
  }, [selectedMatchRound]);

  // Clean up selectedMatchRound when unmounting
  useEffect(() => {
    return () => {
      setSelectedMatchRound(null);
    };
  }, [setSelectedMatchRound]);

  const handleSelectMatchToEdit = (roundNum: number) => {
    setTargetMatchMode(roundNum);
    loadMatchData(roundNum);
    setViewMode('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartNewMatch = () => {
    setActivePage('team-selection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedMatchRound(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Active drafted players plus any players who scored in this match
  const activeMatch = typeof targetMatchMode === 'number'
    ? matchResults.find((match) => match.roundNumber === targetMatchMode)
    : undefined;
  const redPlayerIds = activeMatch?.redLineup || players.filter((player) => player.team === 'red').map((player) => player.id);
  const blackPlayerIds = activeMatch?.blackLineup || players.filter((player) => player.team === 'black').map((player) => player.id);
  const redPlayers = redPlayerIds.map((id) => players.find((player) => player.id === id)).filter((player): player is (typeof players)[number] => !!player);
  const blackPlayers = blackPlayerIds.map((id) => players.find((player) => player.id === id)).filter((player): player is (typeof players)[number] => !!player);

  // Fallback to squad players if none are drafted
  const effectiveRedPlayers = redPlayers;
  const effectiveBlackPlayers = blackPlayers;

  // Update a chucker score
  const updateChuckerScore = (chuckerIdx: 0 | 1 | 2, team: 'red' | 'black', delta: number) => {
    setChuckers((prev) => {
      const copy = [...prev] as [ChuckerScore, ChuckerScore, ChuckerScore];
      const target = { ...copy[chuckerIdx] };

      if (team === 'red') {
        target.redScore = Math.max(0, Math.min(5, target.redScore + delta));
      } else {
        target.blackScore = Math.max(0, Math.min(5, target.blackScore + delta));
      }

      if (target.redScore > target.blackScore) {
        target.winner = 'RED';
      } else if (target.blackScore > target.redScore) {
        target.winner = 'BLACK';
      } else {
        target.winner = 'DRAW';
      }

      copy[chuckerIdx] = target;
      return copy;
    });
  };

  // Adjust individual player tries
  const adjustPlayerTries = (team: 'red' | 'black', playerId: string, delta: number) => {
    if (team === 'red') {
      setRedScorerTries((prev) => {
        const current = prev[playerId] || 0;
        const next = Math.max(0, current + delta);
        if (next === 0) {
          const copy = { ...prev };
          delete copy[playerId];
          return copy;
        }
        return { ...prev, [playerId]: next };
      });
    } else {
      setBlackScorerTries((prev) => {
        const current = prev[playerId] || 0;
        const next = Math.max(0, current + delta);
        if (next === 0) {
          const copy = { ...prev };
          delete copy[playerId];
          return copy;
        }
        return { ...prev, [playerId]: next };
      });
    }
  };

  // Calculations
  const redChuckerWins = chuckers.filter((c) => c.winner === 'RED').length;
  const blackChuckerWins = chuckers.filter((c) => c.winner === 'BLACK').length;
  const seriesWinner = redChuckerWins > blackChuckerWins ? 'RED' : blackChuckerWins > redChuckerWins ? 'BLACK' : 'DRAW';

  const totalRedTries = Object.values(redScorerTries).reduce((a, b) => a + b, 0);
  const totalBlackTries = Object.values(blackScorerTries).reduce((a, b) => a + b, 0);

  const matchParticipants = [...effectiveRedPlayers, ...effectiveBlackPlayers];
  const selectedMvpPlayer = matchParticipants.find((p) => p.id === selectedMvpId);

  const handleFinalize = async () => {
    if (!roundNumberInput || roundNumberInput < 1) {
      showToast('Please enter a valid round number');
      return;
    }
    if (effectiveRedPlayers.length !== 9 || effectiveBlackPlayers.length !== 9) {
      showToast('Each team needs exactly 9 players in the saved match lineup before results can be finalized.');
      return;
    }
    if (chuckers.some((chucker) => !((chucker.redScore === 5 && chucker.blackScore < 5) || (chucker.blackScore === 5 && chucker.redScore < 5)))) {
      showToast('Each chucker needs one team on 5 and the other team between 0 and 4.');
      return;
    }
    if (!selectedMvpId || !matchParticipants.some((player) => player.id === selectedMvpId)) {
      showToast('Select an MVP from the players in this match.');
      return;
    }
    if (activeMatch?.isFinalized && !correctionReason.trim()) {
      showToast('Enter a correction reason before changing a finalized match.');
      return;
    }
    if (!activeMatch?.isFinalized && !window.confirm('Finalize this match and update all player career statistics?')) {
      return;
    }

    const yearComputed = !isNaN(new Date(dateInput).getFullYear()) ? new Date(dateInput).getFullYear() : 2026;

    const result: MatchResult = {
      roundNumber: Number(roundNumberInput),
      date: dateInput,
      year: yearComputed,
      chuckers,
      isPlayed: true,
      redTotalTries: totalRedTries,
      blackTotalTries: totalBlackTries,
      seriesWinner,
      seriesScore: `${redChuckerWins} - ${blackChuckerWins}`,
      mvpPlayerId: selectedMvpId,
      mvpCitation,
      redScorers: redScorerTries,
      blackScorers: blackScorerTries,
      redLineup: redPlayerIds,
      blackLineup: blackPlayerIds,
      isFinalized: true,
      finalizedAt: activeMatch?.finalizedAt,
      correctionReason: correctionReason.trim() || undefined,
    };

    const isUpdate = targetMatchMode !== 'new';
    await recordMatchResult(result);
    setTargetMatchMode(result.roundNumber);
    showToast(
      isUpdate
        ? `Round #${result.roundNumber} match scores and try distribution saved successfully!`
        : `New Round #${result.roundNumber} match fixture created and saved!`
    );
  };

  const redWinsCount = matchResults.filter((m) => m.seriesWinner === 'RED').length;
  const blackWinsCount = matchResults.filter((m) => m.seriesWinner === 'BLACK').length;
  const drawsCount = matchResults.filter((m) => m.seriesWinner === 'DRAW').length;

  const filteredMatchesList = matchResults.filter((m) => {
    if (outcomeFilter !== 'ALL' && m.seriesWinner !== outcomeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const mvp = players.find((p) => p.id === m.mvpPlayerId);
      const matchesRound = m.roundNumber.toString().includes(q);
      const matchesDate = (m.date || '').toLowerCase().includes(q);
      const matchesMvp =
        (mvp?.nickname || '').toLowerCase().includes(q) ||
        (mvp?.fullName || '').toLowerCase().includes(q);
      return matchesRound || matchesDate || matchesMvp;
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Telemetry Bar */}
      <div className="w-full bg-[#0e0e12] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#2a292e]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-rose-300 font-bold">
            OFFICIAL SCOREKEEPER CONSOLE
          </span>
          <span className="font-mono text-[11px] text-[#ac8889]">• {clubConfig.clubName}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono uppercase">
          <span className="text-[#ac8889]">RULE: FIRST TO 5 TRIES = CHUCKER VICTORY</span>
          <span className="text-rose-500 font-bold tracking-wider">
            {viewMode === 'editor' && targetMatchMode !== 'new'
              ? `EDITING: ROUND #${roundNumberInput}`
              : viewMode === 'editor'
              ? 'RECORDING NEW FIXTURE'
              : `${matchResults.length} RECORDED FIXTURES`}
          </span>
        </div>
      </div>

      {viewMode === 'list' && matchResults.length > 0 ? (
        /* The All Matches Overview & Selection Screen */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-6 flex flex-col gap-6">
          {/* Header Bar */}
          <div className="bg-[#141418] border border-[#2a292e] rounded-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="font-mono text-xs font-bold text-rose-400 uppercase tracking-widest">
                  OFFICIAL FIXTURES &amp; SCOREKEEPER
                </span>
              </div>
              <h1 className="font-headline text-2xl sm:text-3xl uppercase text-white tracking-wide">
                ALL MATCH FIXTURES ({matchResults.length})
              </h1>
              <p className="text-xs sm:text-sm text-[#ac8889] max-w-2xl">
                Click any match fixture below to edit its scores, 3 chuckers, try scorers, and referee MVP award. Create new fixtures through Team Selection.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleStartNewMatch}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider font-bold rounded-sm transition-all shadow-[0_0_16px_rgba(225,29,72,0.4)] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>+ Create in Team Selection</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('match-history')}
                className="px-3.5 py-2.5 bg-[#1b1b1f] hover:bg-[#25252a] text-[#ac8889] hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-[#2a292e] transition-colors flex items-center gap-1.5 font-bold"
              >
                <span className="material-symbols-outlined text-sm text-rose-400">history_edu</span>
                <span>Match History</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-[#141418] border border-[#2a292e] p-3 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#ac8889]">
                <span className="material-symbols-outlined text-sm">search</span>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search round number, date, player..."
                className="w-full bg-[#1b1b1f] text-white pl-9 pr-3 py-2 text-xs font-mono rounded-sm border border-[#2a292e] focus:border-rose-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#ac8889] hover:text-white"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>

            {/* Outcome Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { key: 'ALL', label: `ALL (${matchResults.length})` },
                  { key: 'RED', label: `RED WINS (${redWinsCount})` },
                  { key: 'BLACK', label: `BLACK WINS (${blackWinsCount})` },
                  { key: 'DRAW', label: `DRAWS (${drawsCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setOutcomeFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-headline uppercase tracking-wider transition-colors shrink-0 ${
                    outcomeFilter === tab.key
                      ? 'bg-rose-600 text-white font-bold shadow'
                      : 'bg-[#1b1b1f] hover:bg-[#25252a] text-[#ac8889] hover:text-white border border-[#2a292e]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Matches Grid */}
          {filteredMatchesList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatchesList.map((match, idx) => {
                const isRedWinner = match.seriesWinner === 'RED';
                const isBlackWinner = match.seriesWinner === 'BLACK';
                const mvpPlayer = players.find((p) => p.id === match.mvpPlayerId);

                return (
                  <div
                    key={`capture-match-${match.year || ''}-${match.roundNumber}-${match.date || ''}-${idx}`}
                    className="bg-[#1b1b1f] border border-[#2a292e] hover:border-rose-500/70 rounded-sm p-4 flex flex-col justify-between gap-4 shadow-lg hover:shadow-2xl transition-all group"
                  >
                    {/* Top Row: Round # & Match Date */}
                    <div className="flex items-center justify-between border-b border-[#2a292e] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rose-600 text-white font-headline text-xs uppercase font-bold rounded-sm shadow">
                          ROUND #{match.roundNumber}
                        </span>
                        <span className="font-mono text-[11px] text-[#ac8889]">
                          {match.date || 'Wednesday'}
                        </span>
                      </div>
                      {match.isPlayed === false || match.seriesScore === 'TBA' ? (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-headline text-[10px] uppercase font-bold rounded-sm">
                          {isMatchOverdue(match) ? 'SCORE REQUIRED' : 'TBA • SCHEDULED'}
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 font-headline text-[10px] uppercase font-bold rounded-sm ${
                            isRedWinner
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                              : isBlackWinner
                              ? 'bg-zinc-800 text-zinc-300 border border-zinc-600'
                              : 'bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          {match.seriesWinner === 'DRAW' ? 'DRAW' : `${match.seriesWinner} WIN`}
                        </span>
                      )}
                    </div>

                    {/* Big Score Clash Banner */}
                    {match.isPlayed === false || match.seriesScore === 'TBA' ? (
                      <div
                        onClick={() => handleSelectMatchToEdit(match.roundNumber)}
                        className="cursor-pointer bg-[#141418] hover:bg-[#191922] p-3 rounded-sm border border-amber-500/30 hover:border-rose-500/50 flex flex-col items-center justify-center gap-1.5 transition-all shadow-inner"
                        title="Click to enter scores for this match"
                      >
                        <div className="flex items-center justify-around w-full">
                          <span className="font-headline text-xs uppercase text-rose-400 font-bold">TEAM RED</span>
                          <span className="px-3 py-1 bg-[#1b1b1f] border border-amber-500/50 text-amber-400 font-headline text-lg font-bold rounded-sm tracking-wider">
                            {getPendingScoreDisplay(match)}
                          </span>
                          <span className="font-headline text-xs uppercase text-zinc-300 font-bold">TEAM BLACK</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-rose-500">edit_note</span>
                          <span>Click to Enter Matchday Scores</span>
                        </span>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleSelectMatchToEdit(match.roundNumber)}
                        className="cursor-pointer bg-[#141418] hover:bg-[#191922] p-3 rounded-sm border border-[#2a292e] hover:border-rose-500/40 flex items-center justify-around transition-all shadow-inner"
                        title="Click to edit this match"
                      >
                        {(() => {
                          const redChuckerWins = match.chuckers.filter((chucker) => chucker.winner === 'RED').length;
                          const blackChuckerWins = match.chuckers.filter((chucker) => chucker.winner === 'BLACK').length;
                          return <>
                        {/* Red */}
                        <div className="flex flex-col items-center">
                          <span className="font-headline text-xs uppercase text-rose-400 font-bold">TEAM RED</span>
                          <span className="font-headline text-3xl font-bold text-rose-500 leading-none my-1">
                            {redChuckerWins}
                          </span>
                          <span className="font-mono text-[9px] uppercase text-[#ac8889]">Chuckers Won</span>
                        </div>

                        {/* Series Clash */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-headline text-xs text-[#ac8889] font-bold">VS</span>
                          <span className="font-mono text-[10px] text-white bg-[#2a292e] px-2 py-0.5 rounded font-bold">
                            {redChuckerWins} - {blackChuckerWins}
                          </span>
                        </div>

                        {/* Black */}
                        <div className="flex flex-col items-center">
                          <span className="font-headline text-xs uppercase text-zinc-300 font-bold">TEAM BLACK</span>
                          <span className="font-headline text-3xl font-bold text-white leading-none my-1">
                            {blackChuckerWins}
                          </span>
                          <span className="font-mono text-[9px] uppercase text-[#ac8889]">Chuckers Won</span>
                        </div>
                          </>;
                        })()}
                      </div>
                    )}

                    {/* 3 Chuckers mini strip */}
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase text-[#ac8889] tracking-wider">
                        3-Chucker Score Breakdown:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        {match.chuckers.map((c) => (
                          <div
                            key={c.chuckerNumber}
                            className="bg-[#141418] p-1.5 rounded-sm border border-[#2a292e] font-mono text-[11px]"
                          >
                            <span className="text-[#ac8889] block text-[9px] uppercase">C{c.chuckerNumber}</span>
                            <span className="font-bold text-white">
                              <span className="text-rose-400">{c.redScore}</span> - <span>{c.blackScore}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MVP Preview */}
                    {mvpPlayer && (
                      <div className="bg-[#141418] px-2.5 py-1.5 rounded-sm border border-[#2a292e] flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="material-symbols-outlined text-rose-500 text-sm shrink-0">star</span>
                          <span className="text-white font-headline text-xs uppercase truncate">
                            MVP: "{mvpPlayer.nickname}" (#{mvpPlayer.jerseyNumber})
                          </span>
                        </div>
                        <span className="text-[10px] text-rose-400 uppercase font-bold shrink-0">Awarded</span>
                      </div>
                    )}


                    {/* Action Buttons Footer */}
                    <div className="pt-2 border-t border-[#2a292e] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectMatchToEdit(match.roundNumber)}
                        className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow transition-all flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        <span>Edit Match &amp; Scores</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => viewMatchScorecard(match.roundNumber)}
                        className="py-2 px-3 bg-[#141418] hover:bg-[#25252a] text-[#ac8889] hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-[#2a292e] transition-colors flex items-center justify-center"
                        title="View Full Scorecard"
                      >
                        <span className="material-symbols-outlined text-sm">scoreboard</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#1b1b1f] border border-[#2a292e] p-8 text-center rounded-sm flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-4xl text-[#ac8889]">search_off</span>
              <span className="font-headline text-base uppercase text-white">No Match Fixtures Found</span>
              <p className="text-xs text-[#ac8889] max-w-sm">
                No fixtures match your current filter or search criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setOutcomeFilter('ALL');
                }}
                className="mt-1 px-3 py-1.5 bg-[#2a292e] hover:bg-[#353439] text-white text-xs font-mono rounded-sm"
              >
                Clear Search &amp; Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        /* The Editor Screen */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-6 flex flex-col gap-6">
          {/* Top Bar with Back to All Matches button */}
          <div className="bg-[#141418] border border-[#2a292e] rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-3.5 py-2 bg-[#2a292e] hover:bg-rose-600 text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-[#353439] flex items-center gap-1.5 transition-all font-bold shadow"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>← Back to All Matches</span>
              </button>
              <div className="flex flex-col">
                <span className="font-headline text-xs uppercase text-rose-400 font-bold tracking-wider">
                  {targetMatchMode !== 'new' ? `EDITING MATCH ROUND #${roundNumberInput}` : 'RECORDING NEW MATCHDAY FIXTURE'}
                </span>
                <span className="text-[10px] font-mono text-[#ac8889]">
                  {targetMatchMode !== 'new' ? `Fixture Date: ${dateInput}` : 'Create a brand new fixture'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase text-[#ac8889] hidden md:inline">
                Switch Fixture:
              </span>
              <select
                value={targetMatchMode}
                onChange={(e) => {
                  const val = e.target.value === 'new' ? 'new' : Number(e.target.value);
                  setTargetMatchMode(val);
                  loadMatchData(val);
                }}
                className="bg-[#1f1f23] text-white border border-rose-500/40 text-xs px-2.5 py-1.5 rounded-sm outline-none font-mono cursor-pointer"
              >
                {matchResults.map((m, idx) => (
                  <option key={`select-match-opt-${m.year || ''}-${m.roundNumber}-${idx}`} value={m.roundNumber}>
                    Round #{m.roundNumber} ({m.date || 'Wednesday'} • Red {m.redTotalTries}-{m.blackTotalTries} Black)
                  </option>
                ))}
                <option value="new">+ Record New Match...</option>
              </select>

              <button
                type="button"
                onClick={handleStartNewMatch}
                className="px-3 py-1.5 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm border border-[#353439] font-bold"
                title="Record a brand new fixture"
              >
                + New
              </button>
            </div>
          </div>

        {/* Mode Status Banner */}
        {targetMatchMode !== 'new' ? (
          <div className="bg-rose-950/40 border border-rose-500/50 p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow">
                <span className="material-symbols-outlined text-lg">edit</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-headline text-xs uppercase text-white font-bold tracking-wider">
                    UPDATING SELECTED MATCH: ROUND #{roundNumberInput}
                  </span>
                  <span className="px-1.5 py-0.5 bg-rose-600/30 text-rose-300 font-mono text-[10px] rounded border border-rose-500/30">
                    Fixture Date: {dateInput}
                  </span>
                </div>
                <span className="text-[#ac8889] font-mono text-[11px] mt-0.5">
                  You are editing scores and try scorers for Round #{roundNumberInput}. Changes will update this match directly in the database without creating a random duplicate match.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => loadMatchData(targetMatchMode)}
                className="px-2.5 py-1.5 bg-[#1f1f23] hover:bg-[#2a292e] text-[#ac8889] hover:text-white font-mono text-[11px] rounded-sm border border-[#353439] transition-colors"
              >
                Revert Edits
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof targetMatchMode === 'number') {
                    viewMatchScorecard(targetMatchMode);
                  }
                }}
                className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-mono text-[11px] rounded-sm border border-rose-500/40 transition-colors flex items-center gap-1 font-bold"
              >
                <span>View Scorecard</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow">
                <span className="material-symbols-outlined text-lg">add</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-xs uppercase text-amber-300 font-bold tracking-wider">
                  MODE: CREATING BRAND NEW FIXTURE (ROUND #{roundNumberInput})
                </span>
                <span className="text-[#ac8889] font-mono text-[11px] mt-0.5">
                  You are recording a brand new match fixture. If you wanted to update an existing match instead, click one of the matches in the selector above.
                </span>
              </div>
            </div>
            {matchResults.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTargetMatchMode(matchResults[0].roundNumber);
                  loadMatchData(matchResults[0].roundNumber);
                }}
                className="px-2.5 py-1.5 bg-[#1f1f23] hover:bg-[#2a292e] text-rose-400 font-mono text-[11px] rounded-sm border border-[#353439] hover:underline shrink-0"
              >
                ← Cancel &amp; Select Existing Match
              </button>
            )}
          </div>
        )}

        {/* Match Info Banner / Command Header */}
        <div className="relative bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-6 overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[11px] uppercase font-bold rounded-sm">
                  {targetMatchMode !== 'new' ? `ROUND #${roundNumberInput} ACTIVE` : 'NEW MATCHDAY'}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#ac8889]">
                  WEDNESDAY TOUCH 9v9
                </span>
                <span className="font-mono text-[11px] uppercase text-rose-300">
                  3 CHUCKERS PER FIXTURE
                </span>
              </div>
              <h1 className="font-headline text-2xl sm:text-3xl uppercase text-white tracking-wide">
                {targetMatchMode !== 'new' ? `UPDATE ROUND #${roundNumberInput} SCORES` : 'RECORD WEDNESDAY MATCHDAY RESULTS'}
              </h1>
              
              {/* Fixture Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 max-w-2xl bg-[#141418] p-3 rounded-sm border border-[#2a292e]">
                <div>
                  {targetMatchMode !== 'new' ? (
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-rose-400 mb-1 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">lock</span>
                        <span>Round Number (Fixed)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`Round #${roundNumberInput} (Locked)`}
                        className="w-full bg-[#141418] text-rose-400 border border-rose-500/40 px-2.5 py-1.5 text-xs font-mono rounded-sm outline-none cursor-not-allowed font-bold"
                      />
                      <span className="text-[9px] font-mono text-[#ac8889] mt-0.5 block">
                        Locked to Round #{roundNumberInput}. Pick above to switch.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-amber-400 mb-1 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">add_circle</span>
                        <span>New Round Number</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={roundNumberInput}
                        onChange={(e) => setRoundNumberInput(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-[#1f1f23] text-white border border-amber-500/50 focus:border-amber-400 px-2.5 py-1.5 text-xs font-mono rounded-sm outline-none"
                      />
                      <span className="text-[9px] font-mono text-amber-400/80 mt-0.5 block">
                        New fixture number.
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#ac8889] mb-1">
                    Match Date
                  </label>
                  <input
                    type="text"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    placeholder="YYYY-MM-DD or Wednesday"
                    className="w-full bg-[#1f1f23] text-white border border-[#353439] focus:border-rose-500 px-2.5 py-1.5 text-xs font-mono rounded-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Derived Scoreboard Tile */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0e0e12] border border-[#2a292e] p-4 rounded-sm shadow-inner shrink-0">
              <div className="flex items-center gap-4">
                {/* Red */}
                <div className="flex items-center gap-2">
                  <span className="w-3 h-8 bg-rose-600 rounded-sm shadow-[0_0_8px_rgba(225,29,72,0.5)]"></span>
                  <div className="flex flex-col">
                    <span className="font-headline text-sm uppercase text-white font-bold">TEAM RED</span>
                    <span className="font-mono text-[10px] text-[#ac8889]">{totalRedTries} Total Tries</span>
                  </div>
                </div>

                {/* Score Count Box */}
                <div className="px-4 py-1 bg-[#1f1f23] rounded-sm flex items-center gap-2 border border-[#353439]">
                  <span className="font-headline text-3xl text-rose-500 font-bold leading-none">
                    {redChuckerWins}
                  </span>
                  <span className="font-headline text-lg text-[#ac8889] leading-none">-</span>
                  <span className="font-headline text-3xl text-white font-bold leading-none">
                    {blackChuckerWins}
                  </span>
                </div>

                {/* Black */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="font-headline text-sm uppercase text-white font-bold">TEAM BLACK</span>
                    <span className="font-mono text-[10px] text-[#ac8889]">{totalBlackTries} Total Tries</span>
                  </div>
                  <span className="w-3 h-8 bg-zinc-600 rounded-sm"></span>
                </div>
              </div>

              <div className="hidden sm:block h-10 w-px bg-[#2a292e]"></div>

              <div className="flex flex-col items-center sm:items-start">
                <span className="font-mono text-[10px] uppercase text-rose-300 font-bold tracking-widest">
                  SERIES RESULT
                </span>
                <span className="font-headline text-sm uppercase text-rose-500 font-bold">
                  {seriesWinner === 'RED'
                    ? `RED WINS SERIES ${redChuckerWins}-${blackChuckerWins}`
                    : seriesWinner === 'BLACK'
                    ? `BLACK WINS SERIES ${blackChuckerWins}-${redChuckerWins}`
                    : 'CHUCKERS TIED'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Ticker */}
          <div className="mt-4 pt-2 bg-[#131317] border border-[#2a292e] rounded-sm px-4 py-1.5 flex flex-wrap items-center justify-between text-[#ac8889] text-xs font-mono">
            <span>
              <strong className="text-white">STATUS:</strong> FINAL SCORE DERIVED — TEAM RED {redChuckerWins} - {blackChuckerWins} TEAM BLACK
            </span>
            <div className="flex items-center gap-4 text-[10px] uppercase">
              <span>Pitch Time: 48m</span>
              <span>Ball in Play: 78%</span>
              <span className="text-rose-500 font-bold">First-to-5 Rule Enforced</span>
            </div>
          </div>
        </div>

        {/* 3-Chucker Score Tracker */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-rose-500 font-bold">
                MATCHDAY PROGRESSION
              </span>
              <h2 className="font-headline text-2xl uppercase text-white">3-CHUCKER SCORE TRACKER</h2>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#ac8889]">
              RULE: FIRST TEAM TO SCORE 5 POINTS/TRIES WINS CHUCKER IMMEDIATELY
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chuckers.map((chucker, idx) => {
              const isDecider = chucker.chuckerNumber === 3;
              return (
                <div
                  key={chucker.chuckerNumber}
                  className={`bg-[#1b1b1f] border rounded-sm p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all ${
                    isDecider ? 'border-rose-500/50' : 'border-[#2a292e]'
                  }`}
                >
                  {isDecider && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-600 text-white font-mono text-[9px] uppercase font-bold tracking-widest rounded-bl">
                      SERIES DECIDER
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-[#2a292e] font-mono text-xs uppercase text-white rounded-sm">
                      CHUCKER {chucker.chuckerNumber}
                    </span>
                    <span className="font-mono text-xs uppercase text-rose-400 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {chucker.elapsedTime}
                    </span>
                  </div>

                  {/* Interactive Score Steppers */}
                  <div className="my-4 flex items-center justify-around bg-[#0e0e12] border border-[#2a292e] p-3 rounded-sm">
                    {/* Red */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-headline text-xs uppercase text-rose-400 font-bold">RED</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateChuckerScore(idx as 0 | 1 | 2, 'red', -1)}
                          className="w-7 h-7 bg-[#2a292e] hover:bg-rose-600 text-white rounded flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">remove</span>
                        </button>
                        <span className="font-headline text-3xl text-rose-500 leading-none w-8 text-center font-bold">
                          {chucker.redScore}
                        </span>
                        <button
                          onClick={() => updateChuckerScore(idx as 0 | 1 | 2, 'red', 1)}
                          className="w-7 h-7 bg-[#2a292e] hover:bg-rose-600 text-white rounded flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">add</span>
                        </button>
                      </div>
                    </div>

                    <span className="font-headline text-xl text-[#ac8889] leading-none">:</span>

                    {/* Black */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-headline text-xs uppercase text-zinc-300 font-bold">BLACK</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateChuckerScore(idx as 0 | 1 | 2, 'black', -1)}
                          className="w-7 h-7 bg-[#2a292e] hover:bg-zinc-600 text-white rounded flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">remove</span>
                        </button>
                        <span className="font-headline text-3xl text-white leading-none w-8 text-center font-bold">
                          {chucker.blackScore}
                        </span>
                        <button
                          onClick={() => updateChuckerScore(idx as 0 | 1 | 2, 'black', 1)}
                          className="w-7 h-7 bg-[#2a292e] hover:bg-zinc-600 text-white rounded flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">add</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Result Tag */}
                  <div
                    className={`p-2 rounded-sm flex items-center justify-between text-xs font-mono uppercase ${
                      chucker.winner === 'RED'
                        ? 'bg-rose-950/40 border border-rose-500/30 text-rose-300 font-bold'
                        : chucker.winner === 'BLACK'
                        ? 'bg-zinc-800 border border-zinc-700 text-white font-bold'
                        : 'bg-[#2a292e] text-[#ac8889]'
                    }`}
                  >
                    <span>WINNER: TEAM {chucker.winner}</span>
                    <span className="text-[10px] text-[#ac8889]">
                      {chucker.winner !== 'DRAW' ? 'Chucker Secured' : 'Tied Score'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Decider Summary Strip */}
          <div className="bg-gradient-to-r from-red-950 via-rose-600 to-red-900 text-white p-3 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg border border-rose-500/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">military_tech</span>
              <span className="font-headline text-sm uppercase tracking-wider font-bold">
                TEAM {seriesWinner} WINS {Math.max(redChuckerWins, blackChuckerWins)} CHUCKERS TO {Math.min(redChuckerWins, blackChuckerWins)} (MATCHDAY CHAMPIONS)
              </span>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-rose-200">
              Match Points: Winner 4 pts • Loser 1 pt (Bonus)
            </div>
          </div>
        </div>

        {/* Individual Tries Scorer Ledger */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-rose-500 font-bold">
                SCORER LEDGER
              </span>
              <h2 className="font-headline text-2xl uppercase text-white">
                INDIVIDUAL TRIES SCORED CAPTURE
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#ac8889]">
              <span>Sum of individual tries matches match aggregate</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Red Table */}
            <div className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-4 flex flex-col gap-3 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-[#2a292e]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-5 bg-rose-600 rounded-sm"></span>
                  <span className="font-headline text-sm uppercase text-white">TEAM RED SCORERS</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="text-[#ac8889]">AGGREGATE:</span>
                  <span className="text-rose-400 font-bold">{totalRedTries} TRIES</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {effectiveRedPlayers.map((player) => {
                  const tries = redScorerTries[player.id] || 0;
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 bg-[#131317] hover:bg-[#1f1f23] rounded-sm border border-[#2a292e] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-[#0e0e12] border border-[#2a292e] flex items-center justify-center font-mono text-xs text-rose-500 font-bold">
                          #{player.jerseyNumber}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-headline text-sm uppercase text-white">
                            {player.nickname}
                          </span>
                          <span className="text-[10px] text-[#ac8889] font-mono uppercase">
                            {player.position} • {player.fullName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-[#1b1b1f] rounded border border-[#2a292e] p-0.5">
                          <button
                            onClick={() => adjustPlayerTries('red', player.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-[#ac8889] hover:text-white hover:bg-[#2a292e] rounded"
                          >
                            <span className="material-symbols-outlined text-xs">remove</span>
                          </button>
                          <span className="font-headline text-base text-rose-400 w-7 text-center font-bold">
                            {tries}
                          </span>
                          <button
                            onClick={() => adjustPlayerTries('red', player.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#ac8889] hover:text-white hover:bg-[#2a292e] rounded"
                          >
                            <span className="material-symbols-outlined text-xs">add</span>
                          </button>
                        </div>
                        <span className="font-mono text-[10px] uppercase text-[#ac8889] w-8 text-right">
                          Tries
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Black Table */}
            <div className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-4 flex flex-col gap-3 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-[#2a292e]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-5 bg-zinc-600 rounded-sm"></span>
                  <span className="font-headline text-sm uppercase text-white">TEAM BLACK SCORERS</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="text-[#ac8889]">AGGREGATE:</span>
                  <span className="text-zinc-200 font-bold">{totalBlackTries} TRIES</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {effectiveBlackPlayers.map((player) => {
                  const tries = blackScorerTries[player.id] || 0;
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 bg-[#131317] hover:bg-[#1f1f23] rounded-sm border border-[#2a292e] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-[#0e0e12] border border-[#2a292e] flex items-center justify-center font-mono text-xs text-white font-bold">
                          #{player.jerseyNumber}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-headline text-sm uppercase text-white">
                            {player.nickname}
                          </span>
                          <span className="text-[10px] text-[#ac8889] font-mono uppercase">
                            {player.position} • {player.fullName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-[#1b1b1f] rounded border border-[#2a292e] p-0.5">
                          <button
                            onClick={() => adjustPlayerTries('black', player.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-[#ac8889] hover:text-white hover:bg-[#2a292e] rounded"
                          >
                            <span className="material-symbols-outlined text-xs">remove</span>
                          </button>
                          <span className="font-headline text-base text-white w-7 text-center font-bold">
                            {tries}
                          </span>
                          <button
                            onClick={() => adjustPlayerTries('black', player.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#ac8889] hover:text-white hover:bg-[#2a292e] rounded"
                          >
                            <span className="material-symbols-outlined text-xs">add</span>
                          </button>
                        </div>
                        <span className="font-mono text-[10px] uppercase text-[#ac8889] w-8 text-right">
                          Tries
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Matchday MVP Award Selection Card */}
        <div className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/50">
                <span className="material-symbols-outlined text-2xl">military_tech</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-rose-400 font-bold">
                    ROUND #{clubConfig.matchdayCycle} HONOUR
                  </span>
                  <span className="px-1.5 py-0.2 bg-[#2a292e] text-rose-300 text-[10px] font-mono uppercase rounded">
                    OFFICIAL MVP
                  </span>
                </div>
                <h3 className="font-headline text-xl uppercase text-white">SELECT MATCHDAY MVP</h3>
                <p className="text-xs text-[#ac8889]">
                  Single weekly award registered into the club honors roll and Hall of Fame ballot.
                </p>
              </div>
            </div>

            {/* Candidate Selector Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {[...effectiveRedPlayers.slice(0, 2), ...effectiveBlackPlayers.slice(0, 2)].map((p) => {
                const isSelected = selectedMvpId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedMvpId(p.id)}
                    className={`px-3 py-1.5 rounded-sm font-headline text-xs uppercase flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950/50'
                        : 'bg-[#2a292e] text-[#ac8889] hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isSelected ? 'star' : 'star_outline'}
                    </span>
                    <span>{p.nickname}</span>
                  </button>
                );
              })}

              <select
                value={selectedMvpId}
                onChange={(e) => setSelectedMvpId(e.target.value)}
                className="bg-[#131317] text-white border border-[#353439] px-2 py-1 text-xs font-mono rounded-sm outline-none"
              >
                <option value="">Select match player...</option>
                {matchParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname} ({p.fullName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MVP Spotlight & Citation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-[#2a292e]">
            {/* Active MVP badge */}
            <div className="bg-[#131317] border border-[#2a292e] p-3 rounded-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-rose-950/60 border border-rose-500/40 flex items-center justify-center font-headline text-lg font-bold text-rose-500 shrink-0">
                #{selectedMvpPlayer?.jerseyNumber || '01'}
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-base uppercase text-rose-400 leading-tight">
                  {selectedMvpPlayer?.nickname || 'Select an MVP'}
                </span>
                <span className="font-mono text-[10px] text-[#ac8889] uppercase">
                  {selectedMvpPlayer?.fullName} • {selectedMvpPlayer?.position}
                </span>
                <span className="font-mono text-[10px] text-white font-bold mt-0.5">
                  Tries in Match: {(redScorerTries[selectedMvpPlayer?.id || ''] || 0) + (blackScorerTries[selectedMvpPlayer?.id || ''] || 0)} TRIES
                </span>
              </div>
            </div>

            {/* Citation Notes */}
            <div className="lg:col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#ac8889] flex items-center justify-between">
                <span>OFFICIAL CITATION / SELECTOR NOTES</span>
                <span>Max 250 characters</span>
              </label>
              <textarea
                value={mvpCitation}
                onChange={(e) => setMvpCitation(e.target.value)}
                rows={2}
                maxLength={250}
                className="w-full bg-[#131317] border border-[#2a292e] text-white rounded-sm p-2 text-xs font-mono outline-none focus:border-rose-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Database Commit Protocol */}
        {activeMatch?.isFinalized && (
          <label className="flex flex-col gap-1.5 bg-amber-950/20 border border-amber-500/30 rounded-sm p-4 font-mono text-[10px] uppercase text-amber-300">
            Correction Reason (required)
            <textarea
              value={correctionReason}
              onChange={(event) => setCorrectionReason(event.target.value)}
              placeholder="Explain why this finalized result is being corrected..."
              className="min-h-20 bg-[#131317] border border-amber-500/30 text-white rounded-sm p-2 text-xs normal-case outline-none focus:border-amber-400"
            />
          </label>
        )}
        <div className="bg-[#0e0e12] border border-[#2a292e] rounded-sm p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 max-w-xl">
            <div className="w-9 h-9 rounded bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/30">
              <span className="material-symbols-outlined text-lg">warning</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[11px] uppercase font-bold text-rose-400 tracking-wider">
                DATABASE COMMIT PROTOCOL
              </span>
              <p className="text-xs text-[#ac8889]">
                Submitting will immediately commit and update all player career databases, appearance caps, individual try tallies, and official Wednesday season tables.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
            {matchResults.length > 0 && (
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 bg-[#1f1f23] hover:bg-[#2a292e] text-[#ac8889] hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-colors border border-[#353439] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>← Back to All Matches</span>
              </button>
            )}
            <button
              onClick={() => showToast('Matchday session draft successfully saved locally.')}
              className="px-4 py-2 bg-[#1f1f23] hover:bg-[#2a292e] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm transition-colors border border-[#353439]"
              type="button"
            >
              Save Draft
            </button>
            <button
              onClick={handleFinalize}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider font-bold rounded-sm transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)] flex items-center gap-2"
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                {targetMatchMode !== 'new' ? 'check_circle' : 'verified'}
              </span>
              <span>
                {targetMatchMode !== 'new'
                  ? `Save Updates to Round #${roundNumberInput}`
                  : `Create & Record Round #${roundNumberInput} Fixture`}
              </span>
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
