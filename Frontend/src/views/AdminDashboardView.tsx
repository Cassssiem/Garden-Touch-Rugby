import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChuckerScore, MatchResult, Position, UserAccount } from '../types';
import { getPendingScoreDisplay, isMatchOverdue } from '../utils/matchStatus';

export const AdminDashboardView: React.FC = () => {
  const {
    currentUser,
    clubConfig,
    players,
    matchResults,
    recordMatchResult,
    deleteMatchResult,
    viewMatchScorecard,
    users,
    approveUser,
    rejectUser,
    switchUserDemo,
    setActivePage,
    showToast,
    selectedMatchRound,
    setSelectedMatchRound,
    adminDashboardTab,
    setAdminDashboardTab,
    assignPlayerTeam,
    autoBalanceDraft,
    resetDraft,
    lockRoster,
    toggleUserSelectorRole,
  } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN';

  // ----------------------------------------------------
  // SUB-TAB STATE (Selection Phase, Create Match, Update Match, Approvals, Selectors)
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<'selection' | 'add-match' | 'update-match' | 'approvals' | 'selectors'>(() => {
    const requested = adminDashboardTab || (selectedMatchRound ? 'update-match' : 'approvals');
    return requested === 'selection' || requested === 'add-match' ? 'update-match' : requested;
  });

  useEffect(() => {
    if (adminDashboardTab) {
      setActiveTab(adminDashboardTab === 'selection' || adminDashboardTab === 'add-match' ? 'update-match' : adminDashboardTab);
    }
  }, [adminDashboardTab]);

  const handleTabChange = (tab: 'selection' | 'add-match' | 'update-match' | 'approvals' | 'selectors') => {
    setActiveTab(tab);
    setAdminDashboardTab(tab);
  };

  // ----------------------------------------------------
  // SELECTION PHASE STATE & COMPUTED METRICS
  // Red Team (LEFT) • Available Players (MIDDLE) • Black Team (RIGHT)
  // ----------------------------------------------------
  const [selectionPoolFilter, setSelectionPoolFilter] = useState<'all' | Position>('all');
  const [copiedRoster, setCopiedRoster] = useState(false);

  const redStarters = players.filter((p) => p.team === 'red');
  const blackStarters = players.filter((p) => p.team === 'black');

  const availablePoolPlayers = players.filter((p) => p.team === 'pool' && p.status === 'available');
  const filteredAvailablePool = availablePoolPlayers.filter((p) =>
    selectionPoolFilter === 'all' ? true : p.position === selectionPoolFilter
  );

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

  const copyWhatsAppRoster = () => {
    const redNames = allRed.map((p) => p.nickname).join(', ') || 'Pending';
    const blackNames = allBlack.map((p) => p.nickname).join(', ') || 'Pending';
    const snippet = `🏉 ${clubConfig.clubName} OFFICIAL MATCHDAY TEAMS (Round #${clubConfig.matchdayCycle}):\n🔴 TEAM RED: ${redNames}\n⚫ TEAM BLACK: ${blackNames}\nKickoff: ${clubConfig.kickoffTime}`;
    navigator.clipboard.writeText(snippet);
    setCopiedRoster(true);
    showToast('WhatsApp roster copied to clipboard!');
    setTimeout(() => setCopiedRoster(false), 2000);
  };

  // ----------------------------------------------------
  // CREATE MATCH FORM STATE (NO SCORES - Added after match created!)
  // ----------------------------------------------------
  const nextAutoRound =
    matchResults.length > 0
      ? Math.max(...matchResults.map((m) => m.roundNumber)) + 1
      : clubConfig.matchdayCycle || 1;

  const [addRoundNumber, setAddRoundNumber] = useState<number>(nextAutoRound);
  const [addDate, setAddDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [addKickoff, setAddKickoff] = useState<string>(clubConfig.kickoffTime || '18:30');
  const [addFormatNotes, setAddFormatNotes] = useState<string>(
    'Wednesday Touch 9v9 • 3 Chuckers (12 min running clock)'
  );

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addRoundNumber || addRoundNumber < 1) {
      showToast('Please enter a valid round number.');
      return;
    }

    if (matchResults.some((m) => m.roundNumber === Number(addRoundNumber))) {
      if (!window.confirm(`Round #${addRoundNumber} already exists in records. Do you wish to overwrite it?`)) {
        return;
      }
    }

    const yearVal = !isNaN(new Date(addDate).getFullYear()) ? new Date(addDate).getFullYear() : 2026;

    // Create match WITHOUT scores - Score is TBA until match is played
    const defaultPendingChuckers: [ChuckerScore, ChuckerScore, ChuckerScore] = [
      { chuckerNumber: 1, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
      { chuckerNumber: 2, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
      { chuckerNumber: 3, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
    ];

    const redPlayerIds = players.filter((p) => p.team === 'red').map((p) => p.id);
    const blackPlayerIds = players.filter((p) => p.team === 'black').map((p) => p.id);

    const newMatch: MatchResult = {
      roundNumber: Number(addRoundNumber),
      date: addDate,
      year: yearVal,
      isPlayed: false, // NOT PLAYED YET!
      seriesScore: 'TBA', // SCORE IS TBA!
      seriesWinner: 'TBA',
      redTotalTries: 0,
      blackTotalTries: 0,
      chuckers: defaultPendingChuckers,
      redScorers: {},
      blackScorers: {},
      mvpPlayerId: '',
      mvpCitation: 'To be awarded following matchday kickoff',
      redLineup: redPlayerIds,
      blackLineup: blackPlayerIds,
    };

    await recordMatchResult(newMatch);

    showToast(`Round #${newMatch.roundNumber} created! Score set to TBA until matchday.`);
    setAddRoundNumber(Number(newMatch.roundNumber) + 1);
    setEditingRound(newMatch.roundNumber);
    setSelectedMatchRound(newMatch.roundNumber);
    handleTabChange('update-match');
  };

  // ----------------------------------------------------
  // UPDATE MATCH STATE & EDITING (Scores, Scorers, MVP)
  // ----------------------------------------------------
  const [editingRound, setEditingRound] = useState<number | null>(() => {
    return selectedMatchRound || (matchResults.length > 0 ? matchResults[0].roundNumber : null);
  });

  const [updateSearchQuery, setUpdateSearchQuery] = useState('');
  const [updateFilterWinner, setUpdateFilterWinner] = useState<'ALL' | 'RED' | 'BLACK' | 'DRAW'>('ALL');

  const selectedMatch = matchResults.find((m) => m.roundNumber === editingRound);

  const [editDate, setEditDate] = useState('');
  const [editChuckers, setEditChuckers] = useState<[ChuckerScore, ChuckerScore, ChuckerScore]>([
    { chuckerNumber: 1, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
    { chuckerNumber: 2, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
    { chuckerNumber: 3, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
  ]);
  const [editRedScorers, setEditRedScorers] = useState<Record<string, number>>({});
  const [editBlackScorers, setEditBlackScorers] = useState<Record<string, number>>({});
  const [editRedLineup, setEditRedLineup] = useState<string[]>([]);
  const [editBlackLineup, setEditBlackLineup] = useState<string[]>([]);
  const [editMvpPlayerId, setEditMvpPlayerId] = useState('');
  const [editMvpCitation, setEditMvpCitation] = useState('');
  const [editIsPlayed, setEditIsPlayed] = useState<boolean>(true);
  const [editCorrectionReason, setEditCorrectionReason] = useState('');

  // Sync edit form with selected match
  useEffect(() => {
    if (selectedMatch) {
      setEditIsPlayed(selectedMatch.isPlayed !== false && selectedMatch.seriesScore !== 'TBA');
      setEditDate(selectedMatch.date || new Date().toISOString().split('T')[0]);
      setEditChuckers(
        selectedMatch.chuckers && selectedMatch.chuckers.length === 3
          ? (selectedMatch.chuckers as [ChuckerScore, ChuckerScore, ChuckerScore])
          : [
              { chuckerNumber: 1, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
              { chuckerNumber: 2, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
              { chuckerNumber: 3, redScore: 0, blackScore: 0, winner: 'DRAW', elapsedTime: '12:00' },
            ]
      );
      setEditRedScorers(selectedMatch.redScorers || {});
      setEditBlackScorers(selectedMatch.blackScorers || {});
      setEditMvpPlayerId(selectedMatch.mvpPlayerId || '');
      setEditCorrectionReason('');
      setEditMvpCitation(
        selectedMatch.mvpCitation || 'Decisive touch play, offensive distribution, and leadership'
      );

      // Lineups strictly segregated: a player can only be on one team!
      const initialRed = (selectedMatch.redLineup && selectedMatch.redLineup.length > 0)
        ? selectedMatch.redLineup
        : players.filter((p) => p.team === 'red').map((p) => p.id);

      const initialBlack = (selectedMatch.blackLineup && selectedMatch.blackLineup.length > 0)
        ? selectedMatch.blackLineup
        : players.filter((p) => p.team === 'black').map((p) => p.id);

      // Include any player who already has recorded tries in that team
      const redWithScorers = Array.from(new Set([...initialRed, ...Object.keys(selectedMatch.redScorers || {})]));
      // Clean black lineup so NO player is on both teams!
      const blackWithScorers = Array.from(
        new Set([...initialBlack, ...Object.keys(selectedMatch.blackScorers || {})])
      ).filter((id) => !redWithScorers.includes(id));

      setEditRedLineup(redWithScorers);
      setEditBlackLineup(blackWithScorers);
    }
  }, [editingRound, selectedMatch]);

  const handleTransferPlayerBetweenTeams = (targetTeam: 'red' | 'black', playerId: string) => {
    if (targetTeam === 'red') {
      // Move strictly to Red, remove from Black
      setEditRedLineup((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
      setEditBlackLineup((prev) => prev.filter((id) => id !== playerId));
      setEditBlackScorers((prev) => {
        const { [playerId]: _, ...rest } = prev;
        return rest;
      });
      const p = players.find((pl) => pl.id === playerId);
      showToast(`${p?.nickname || 'Player'} transferred ONLY to Team Red`);
    } else {
      // Move strictly to Black, remove from Red
      setEditBlackLineup((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
      setEditRedLineup((prev) => prev.filter((id) => id !== playerId));
      setEditRedScorers((prev) => {
        const { [playerId]: _, ...rest } = prev;
        return rest;
      });
      const p = players.find((pl) => pl.id === playerId);
      showToast(`${p?.nickname || 'Player'} transferred ONLY to Team Black`);
    }
  };

  const handleRemovePlayerFromMatchRoster = (team: 'red' | 'black', playerId: string) => {
    if (team === 'red') {
      setEditRedLineup((prev) => prev.filter((id) => id !== playerId));
      setEditRedScorers((prev) => {
        const { [playerId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setEditBlackLineup((prev) => prev.filter((id) => id !== playerId));
      setEditBlackScorers((prev) => {
        const { [playerId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleEditChuckerScoreChange = (
    index: 0 | 1 | 2,
    team: 'red' | 'black',
    value: number
  ) => {
    const nextVal = Math.max(0, Math.min(5, value));
    setEditChuckers((prev) => {
      const copy: [ChuckerScore, ChuckerScore, ChuckerScore] = [...prev] as any;
      const current = { ...copy[index] };
      if (team === 'red') current.redScore = nextVal;
      else current.blackScore = nextVal;

      if (current.redScore > current.blackScore) current.winner = 'RED';
      else if (current.blackScore > current.redScore) current.winner = 'BLACK';
      else current.winner = 'DRAW';

      copy[index] = current;
      return copy;
    });
  };

  const handleEditScorerIncrement = (team: 'red' | 'black', playerId: string, delta: number) => {
    if (team === 'red') {
      setEditRedScorers((prev) => {
        const cur = prev[playerId] || 0;
        const next = Math.max(0, cur + delta);
        if (next === 0) {
          const { [playerId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [playerId]: next };
      });
    } else {
      setEditBlackScorers((prev) => {
        const cur = prev[playerId] || 0;
        const next = Math.max(0, cur + delta);
        if (next === 0) {
          const { [playerId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [playerId]: next };
      });
    }
  };

  const handleSaveUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRound || !selectedMatch) return;

    if (selectedMatch.isFinalized && !editCorrectionReason.trim()) {
      showToast('Enter a correction reason before changing a finalized match.');
      return;
    }

    if (!editIsPlayed) {
      // Admin keeps or marks the match as TBA (not played yet)
      const updated: MatchResult = {
        ...selectedMatch,
        date: editDate,
        year: !isNaN(new Date(editDate).getFullYear()) ? new Date(editDate).getFullYear() : selectedMatch.year || 2026,
        isPlayed: false,
        seriesScore: 'TBA',
        seriesWinner: 'TBA',
        redTotalTries: 0,
        blackTotalTries: 0,
        chuckers: editChuckers,
        redScorers: {},
        blackScorers: {},
        mvpPlayerId: '',
        mvpCitation: editMvpCitation || 'Awaiting matchday kickoff',
        redLineup: editRedLineup,
        blackLineup: editBlackLineup,
        isFinalized: false,
        correctionReason: editCorrectionReason.trim() || undefined,
      };
      await recordMatchResult(updated);
      showToast(`Round #${editingRound} status set to TBA (Pending Kickoff).`);
      return;
    }

    if (editRedLineup.length !== 9 || editBlackLineup.length !== 9) {
      showToast('Both teams require exactly 9 saved players.');
      return;
    }
    if (editChuckers.some((chucker) => !((chucker.redScore === 5 && chucker.blackScore < 5) || (chucker.blackScore === 5 && chucker.redScore < 5)))) {
      showToast('Each chucker needs one team on 5 and the other team between 0 and 4.');
      return;
    }
    if (!editMvpPlayerId || ![...editRedLineup, ...editBlackLineup].includes(editMvpPlayerId)) {
      showToast('Select an MVP from the saved match lineups.');
      return;
    }
    if (!selectedMatch.isFinalized && !window.confirm('Finalize this match and update all player career statistics?')) {
      return;
    }

    const redTotal = Object.values(editRedScorers).reduce((sum, tries) => sum + tries, 0);
    const blackTotal = Object.values(editBlackScorers).reduce((sum, tries) => sum + tries, 0);
    const redWins = editChuckers.filter((c) => c.winner === 'RED').length;
    const blackWins = editChuckers.filter((c) => c.winner === 'BLACK').length;
    const winner: 'RED' | 'BLACK' | 'DRAW' =
      redWins > blackWins ? 'RED' : blackWins > redWins ? 'BLACK' : 'DRAW';

    const updated: MatchResult = {
      ...selectedMatch,
      date: editDate,
      year: !isNaN(new Date(editDate).getFullYear()) ? new Date(editDate).getFullYear() : selectedMatch.year || 2026,
      isPlayed: true,
      seriesScore: `${redWins} - ${blackWins}`,
      seriesWinner: winner,
      redTotalTries: redTotal,
      blackTotalTries: blackTotal,
      chuckers: editChuckers,
      redScorers: editRedScorers,
      blackScorers: editBlackScorers,
      mvpPlayerId: editMvpPlayerId || selectedMatch.mvpPlayerId,
      mvpCitation: editMvpCitation,
      redLineup: editRedLineup,
      blackLineup: editBlackLineup,
      isFinalized: true,
      finalizedAt: selectedMatch.finalizedAt,
      correctionReason: editCorrectionReason.trim() || undefined,
    };

    await recordMatchResult(updated);
    showToast(`Round #${editingRound} official match scores saved & published!`);
  };

  const handleDeleteMatch = async (roundNum: number) => {
    if (window.confirm(`Are you sure you want to permanently delete Round #${roundNum} from records?`)) {
      await deleteMatchResult(roundNum);
      if (editingRound === roundNum) {
        setEditingRound(null);
      }
    }
  };

  // Filtered matches for Update Match
  const filteredMatchesForUpdate = matchResults.filter((m) => {
    if (updateFilterWinner !== 'ALL' && m.seriesWinner !== updateFilterWinner) {
      return false;
    }
    if (updateSearchQuery.trim()) {
      const q = updateSearchQuery.toLowerCase().trim();
      const roundMatch = `round ${m.roundNumber}`.includes(q) || `#${m.roundNumber}`.includes(q) || String(m.roundNumber) === q;
      const dateMatch = m.date.toLowerCase().includes(q);
      const winnerMatch = m.seriesWinner.toLowerCase().includes(q);
      return roundMatch || dateMatch || winnerMatch;
    }
    return true;
  });

  // ----------------------------------------------------
  // APPROVALS QUEUE STATE
  // ----------------------------------------------------
  const pendingUsers = users.filter((u) => u.status === 'PENDING');
  const approvedUsers = users.filter((u) => u.status === 'APPROVED');
  const [approvalTab, setApprovalTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [approvalSearch, setApprovalSearch] = useState('');

  const filteredUsers = users.filter((u) => {
    if (approvalTab === 'pending' && u.status !== 'PENDING') return false;
    if (approvalTab === 'approved' && u.status !== 'APPROVED') return false;
    if (approvalSearch.trim()) {
      const q = approvalSearch.toLowerCase().trim();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.nickname.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.position.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ----------------------------------------------------
  // SELECTORS & ROLES STATE
  // ----------------------------------------------------
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorFilter, setSelectorFilter] = useState<'all' | 'selectors' | 'members'>('all');

  const activeSelectors = users.filter(
    (u) => (u.isSelector || u.role === 'SELECTOR' || u.role === 'ADMIN') && u.status === 'APPROVED'
  );
  const designatedSelectors = users.filter(
    (u) => (u.isSelector || u.role === 'SELECTOR') && u.role !== 'ADMIN'
  );

  const filteredSelectorUsers = users.filter((u) => {
    if (u.status !== 'APPROVED') return false;

    const isUserSelector = u.isSelector || u.role === 'SELECTOR' || u.role === 'ADMIN';
    if (selectorFilter === 'selectors' && !isUserSelector) return false;
    if (selectorFilter === 'members' && isUserSelector && u.role !== 'ADMIN') return false;

    if (selectorSearch.trim()) {
      const q = selectorSearch.toLowerCase().trim();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.nickname.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.position.toLowerCase().includes(q) ||
        u.jerseyNumber.includes(q)
      );
    }
    return true;
  });

  // ----------------------------------------------------
  // NON-ADMIN GUARD
  // ----------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-500 mb-4 shadow-lg">
          <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
        </div>
        <h2 className="font-headline text-2xl uppercase tracking-wider text-white mb-2">
          Administrator Clearance Required
        </h2>
        <p className="text-sm text-[#ac8889] max-w-md mb-6 leading-relaxed">
          You are currently viewing as a squad member. Team selection draft, match creation, score updates, and member approvals are reserved for club administrators.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => switchUserDemo('admin')}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-all shadow-md font-bold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">how_to_reg</span>
            <span>Switch to Admin Account (Demo)</span>
          </button>
          <button
            onClick={() => setActivePage('availability-pool')}
            className="px-4 py-2.5 bg-[#1b1b1f] hover:bg-[#25252b] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm border border-[#2a292e] transition-all"
          >
            Go to Availability Pool
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Top Admin Telemetry Header */}
      <div className="bg-[#1b1b1f] border border-[#2a292e] p-6 rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600"></div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] uppercase tracking-widest text-rose-500 font-bold">
              GARDENS RFC • OPERATIONS
            </span>
            <span className="text-[#5c3f40] font-mono">/</span>
            <span className="px-2 py-0.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono text-[10px] uppercase rounded-sm font-bold">
              ADMIN CONTROL CENTER
            </span>
          </div>
          <h1 className="font-headline text-2xl uppercase tracking-wider text-white">
            Club Admin Dashboard
          </h1>
          <p className="text-xs text-[#ac8889]">
            Update match results, process member signups, and temporarily assign team selectors.
          </p>
        </div>

        {/* Quick KPI Overview */}
        <div className="flex items-center gap-4 bg-[#141418] p-3 rounded-sm border border-[#2a292e] self-stretch md:self-auto">
          <div className="flex flex-col items-center px-2">
            <span className="font-mono text-[10px] uppercase text-[#ac8889]">PENDING SIGNUPS</span>
            <span className={`font-headline text-xl font-bold ${pendingUsers.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {pendingUsers.length}
            </span>
          </div>
          <div className="h-8 w-px bg-[#2a292e]"></div>
          <div className="flex flex-col items-center px-2">
            <span className="font-mono text-[10px] uppercase text-[#ac8889]">MATCHES RECORDED</span>
            <span className="font-headline text-xl text-white font-bold">
              {matchResults.length}
            </span>
          </div>
          <div className="h-8 w-px bg-[#2a292e]"></div>
          <div className="flex flex-col items-center px-2">
            <span className="font-mono text-[10px] uppercase text-[#ac8889]">SQUAD POOL</span>
            <span className="font-headline text-xl text-rose-500 font-bold">
              {players.length}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Main Admin Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[#1b1b1f] border border-[#2a292e] rounded-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('selection')}
            className={`hidden flex-1 min-w-[150px] py-2.5 px-4 rounded-sm font-headline text-xs uppercase tracking-wider transition-all items-center justify-center gap-2 font-bold ${
            activeTab === 'selection'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-[#ac8889] hover:text-white hover:bg-[#25252b]'
          }`}
        >
          <span className="material-symbols-outlined text-base">tune</span>
          <span>1. Selection Phase</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('add-match')}
            className={`hidden flex-1 min-w-[140px] py-2.5 px-4 rounded-sm font-headline text-xs uppercase tracking-wider transition-all items-center justify-center gap-2 font-bold ${
            activeTab === 'add-match'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-[#ac8889] hover:text-white hover:bg-[#25252b]'
          }`}
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>2. Create Match</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('update-match')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-sm font-headline text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-bold ${
            activeTab === 'update-match'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-[#ac8889] hover:text-white hover:bg-[#25252b]'
          }`}
        >
          <span className="material-symbols-outlined text-base">edit_note</span>
          <span>1. Update Match</span>
          <span className="px-1.5 py-0.2 bg-[#2a292e] text-[#e4e1e7] text-[10px] font-mono rounded">
            {matchResults.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('approvals')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-sm font-headline text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-bold relative ${
            activeTab === 'approvals'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
              : 'text-[#ac8889] hover:text-white hover:bg-[#25252b]'
          }`}
        >
          <span className="material-symbols-outlined text-base">how_to_reg</span>
          <span>2. Approvals</span>
          {pendingUsers.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] font-mono rounded font-bold animate-pulse">
              {pendingUsers.length} PENDING
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('selectors')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-sm font-headline text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-bold relative ${
            activeTab === 'selectors'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-[#ac8889] hover:text-white hover:bg-[#25252b]'
          }`}
        >
          <span className="material-symbols-outlined text-base">assignment_ind</span>
          <span>3. Selectors &amp; Roles</span>
          {activeSelectors.length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#2a292e] text-rose-300 text-[10px] font-mono rounded font-bold">
              {activeSelectors.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SELECTION PHASE                                                    */}
      {/* RED TEAM (LEFT) • AVAILABLE PLAYERS (MIDDLE) • BLACK TEAM (RIGHT)         */}
      {/* ========================================================================= */}
      {false && activeTab === 'selection' && (
        <div className="flex flex-col gap-6">
          {/* Selection Phase Top Controls & Parity Bar */}
          <div className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-4 flex flex-col gap-4 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#2a292e] pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[10px] uppercase font-bold rounded-sm">
                    MATCHDAY SELECTION
                  </span>
                  <span className="text-xs font-mono text-[#ac8889]">
                    Round #{clubConfig.matchdayCycle} • 9v9 Draft Matrix
                  </span>
                </div>
                <h2 className="font-headline text-lg uppercase text-white">
                  Team Selection &amp; Lineup Balancer
                </h2>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={autoBalanceDraft}
                  className="px-3.5 py-2 bg-[#2a292e] hover:bg-[#353439] border border-rose-500/40 text-white font-headline text-xs uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-colors font-bold shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm text-rose-500">balance</span>
                  Auto-Balance by Stats
                </button>
                <button
                  type="button"
                  onClick={resetDraft}
                  className="px-3 py-2 bg-[#1b1b1f] hover:bg-[#25252b] text-[#ac8889] hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-[#2a292e] flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Reset
                </button>
                <button
                  type="button"
                  onClick={copyWhatsAppRoster}
                  className="px-3.5 py-2 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm border border-[#353439] flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm text-emerald-400">broadcast_on_home</span>
                  {copiedRoster ? 'Copied!' : 'WhatsApp Roster'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    lockRoster();
                    handleTabChange('add-match');
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm flex items-center gap-1.5 font-bold shadow-md"
                >
                  <span>Lock &amp; Create Match</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Parity Mini Console */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#141418] p-3 rounded-sm border border-[#2a292e] flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#ac8889] uppercase">Competitive Parity</span>
                <span className="font-headline text-xl text-rose-500 font-bold">{parity}% Parity</span>
                <span className="text-[10px] text-[#ac8889] font-mono">Statistical balance score</span>
              </div>
              <div className="bg-[#141418] p-3 rounded-sm border border-[#2a292e] flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#ac8889] uppercase">Career Tries Comparison</span>
                <div className="flex items-center justify-between font-headline text-base font-bold">
                  <span className="text-rose-500">Red: {redTries} Tries</span>
                  <span className="text-white">Black: {blackTries} Tries</span>
                </div>
                <span className="text-[10px] text-[#ac8889] font-mono">Offensive potency delta: {Math.abs(redTries - blackTries)}</span>
              </div>
              <div className="bg-[#141418] p-3 rounded-sm border border-[#2a292e] flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#ac8889] uppercase">Experience Avg</span>
                <div className="flex items-center justify-between font-headline text-base font-bold">
                  <span className="text-rose-400">Red: {redAvgCaps} Caps</span>
                  <span className="text-zinc-300">Black: {blackAvgCaps} Caps</span>
                </div>
                <span className="text-[10px] text-[#ac8889] font-mono">Average player tournament caps</span>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 3-COLUMN SELECTION LAYOUT                                             */}
          {/* RED TEAM (LEFT) • AVAILABLE POOL (MIDDLE) • BLACK TEAM (RIGHT)        */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ------------------------------------------------------------------- */}
            {/* COLUMN 1 (LEFT): TEAM RED                                           */}
            {/* ------------------------------------------------------------------- */}
            <section className="lg:col-span-4 bg-[#1b1b1f] border border-rose-500/40 rounded-sm p-4 flex flex-col gap-4 shadow-lg">
              <div className="bg-[#141418] border-l-4 border-rose-600 p-3 rounded-sm flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-headline text-lg uppercase text-rose-500 font-bold">
                    Team Red
                  </span>
                  <span className="font-mono text-[10px] text-[#ac8889] uppercase">
                    9 Players • No Subs
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold rounded">
                  {redStarters.length}/9 Players
                </span>
              </div>

              {/* Starters Slot List */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase text-[#ac8889] font-bold">
                  Starting 9 Lineup:
                </span>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((slotIdx) => {
                  const player = redStarters[slotIdx];
                  if (!player) {
                    return (
                      <div
                        key={`red-empty-${slotIdx}`}
                        className="p-3 border border-dashed border-[#2a292e] rounded-sm text-center text-xs font-mono text-[#ac8889]/60 bg-[#141418]/60"
                      >
                        Slot #{slotIdx + 1} Open (Assign from middle pool)
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`red-starter-${player.id}`}
                      className="bg-[#141418] border border-rose-500/20 hover:border-rose-500/50 p-2.5 rounded-sm flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded bg-rose-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          #{player.jerseyNumber}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-headline text-sm uppercase text-white truncate font-bold">
                            {player.nickname}
                          </span>
                          <span className="font-mono text-[9px] text-[#ac8889] uppercase">
                            {player.position} • {player.tries} Tries
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => assignPlayerTeam(player.id, 'pool')}
                          className="w-6 h-6 rounded flex items-center justify-center text-[#ac8889] hover:text-rose-400 hover:bg-[#25252b]"
                          title="Return to Pool"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#2a292e] pt-2 text-center text-[10px] font-mono uppercase text-[#ac8889]">No substitutes in 9v9</div>

              {/* Red Summary */}
              <div className="bg-[#141418] p-2.5 rounded-sm border border-[#2a292e] flex items-center justify-between text-xs font-mono">
                <span className="text-[#ac8889]">Red Squad Total:</span>
                <span className="text-rose-400 font-bold">{redTries} Tries • {redChuckersWon} Wins</span>
              </div>
            </section>

            {/* ------------------------------------------------------------------- */}
            {/* COLUMN 2 (MIDDLE): AVAILABLE PLAYERS IN THE MIDDLE                 */}
            {/* ------------------------------------------------------------------- */}
            <section className="lg:col-span-4 bg-[#1b1b1f] border border-[#353439] rounded-sm p-4 flex flex-col gap-4 shadow-lg">
              <div className="bg-[#141418] border-l-4 border-amber-500 p-3 rounded-sm flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-headline text-lg uppercase text-white font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-500 text-lg">group</span>
                    Available Players
                  </span>
                  <span className="font-mono text-[10px] text-[#ac8889] uppercase">
                    Select &amp; Draft into Red or Black
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold rounded">
                  {availablePoolPlayers.length} in Pool
                </span>
              </div>

              {/* Position Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {(['all', 'MIDDLE', 'LINK', 'WING'] as const).map((pos) => (
                  <button
                    key={`pos-tab-${pos}`}
                    type="button"
                    onClick={() => setSelectionPoolFilter(pos)}
                    className={`px-2.5 py-1 text-[10px] font-headline uppercase rounded-sm font-bold transition-all ${
                      selectionPoolFilter === pos
                        ? 'bg-rose-600 text-white'
                        : 'bg-[#141418] text-[#ac8889] hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              {/* Pool Players List with Assign Left (Red) and Assign Right (Black) */}
              <div className="flex flex-col gap-2.5 max-h-[620px] overflow-y-auto pr-1">
                {filteredAvailablePool.length === 0 ? (
                  <div className="bg-[#141418] p-8 rounded-sm text-center border border-[#2a292e] flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-emerald-400">check_circle</span>
                    <span className="font-headline text-sm uppercase text-white">All Players Assigned</span>
                    <span className="text-xs text-[#ac8889]">
                      {availablePoolPlayers.length === 0
                        ? 'Every available player has been drafted into Team Red or Team Black.'
                        : 'No players match the position filter.'}
                    </span>
                  </div>
                ) : (
                  filteredAvailablePool.map((player) => (
                    <div
                      key={`avail-${player.id}`}
                      className="bg-[#141418] border border-[#2a292e] hover:border-[#353439] p-3 rounded-sm flex items-center justify-between gap-2 shadow-sm"
                    >
                      {/* Left: Assign to Red Button */}
                      <button
                        type="button"
                        onClick={() => assignPlayerTeam(player.id, 'red')}
                        className="px-2.5 py-2 bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white font-headline text-[10px] uppercase rounded-sm border border-rose-500/40 transition-colors font-bold shrink-0 flex items-center gap-1"
                        title="Draft player to Team Red"
                      >
                        <span className="material-symbols-outlined text-xs">arrow_back</span>
                        <span>Red</span>
                      </button>

                      {/* Middle: Player Details */}
                      <div className="flex flex-col items-center text-center min-w-0 flex-1 px-1">
                        <div className="flex items-center gap-1.5 justify-center">
                          <span className="font-headline text-sm uppercase text-white truncate font-bold">
                            {player.nickname}
                          </span>
                          <span className="font-mono text-[9px] text-rose-400 font-bold">
                            #{player.jerseyNumber}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#ac8889] truncate">{player.fullName}</span>
                        <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-[#ac8889]">
                          <span className="px-1.5 py-0.2 bg-[#1b1b1f] rounded border border-[#2a292e]">
                            {player.position}
                          </span>
                          <span>{player.tries} Tries</span>
                          <span>{player.caps} Caps</span>
                        </div>
                      </div>

                      {/* Right: Assign to Black Button */}
                      <button
                        type="button"
                        onClick={() => assignPlayerTeam(player.id, 'black')}
                        className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-headline text-[10px] uppercase rounded-sm border border-zinc-600 transition-colors font-bold shrink-0 flex items-center gap-1"
                        title="Draft player to Team Black"
                      >
                        <span>Black</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* ------------------------------------------------------------------- */}
            {/* COLUMN 3 (RIGHT): TEAM BLACK                                        */}
            {/* ------------------------------------------------------------------- */}
            <section className="lg:col-span-4 bg-[#1b1b1f] border border-zinc-700 rounded-sm p-4 flex flex-col gap-4 shadow-lg">
              <div className="bg-[#141418] border-l-4 border-zinc-400 p-3 rounded-sm flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-headline text-lg uppercase text-white font-bold">
                    Team Black
                  </span>
                  <span className="font-mono text-[10px] text-[#ac8889] uppercase">
                    9 Players • No Subs
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-200 border border-zinc-600 text-xs font-mono font-bold rounded">
                  {blackStarters.length}/9 Players
                </span>
              </div>

              {/* Starters Slot List */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase text-[#ac8889] font-bold">
                  Starting 9 Lineup:
                </span>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((slotIdx) => {
                  const player = blackStarters[slotIdx];
                  if (!player) {
                    return (
                      <div
                        key={`black-empty-${slotIdx}`}
                        className="p-3 border border-dashed border-[#2a292e] rounded-sm text-center text-xs font-mono text-[#ac8889]/60 bg-[#141418]/60"
                      >
                        Slot #{slotIdx + 1} Open (Assign from middle pool)
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`black-starter-${player.id}`}
                      className="bg-[#141418] border border-zinc-700/60 hover:border-zinc-500 p-2.5 rounded-sm flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-zinc-600">
                          #{player.jerseyNumber}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-headline text-sm uppercase text-white truncate font-bold">
                            {player.nickname}
                          </span>
                          <span className="font-mono text-[9px] text-[#ac8889] uppercase">
                            {player.position} • {player.tries} Tries
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => assignPlayerTeam(player.id, 'pool')}
                          className="w-6 h-6 rounded flex items-center justify-center text-[#ac8889] hover:text-rose-400 hover:bg-[#25252b]"
                          title="Return to Pool"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#2a292e] pt-2 text-center text-[10px] font-mono uppercase text-[#ac8889]">No substitutes in 9v9</div>

              {/* Black Summary */}
              <div className="bg-[#141418] p-2.5 rounded-sm border border-[#2a292e] flex items-center justify-between text-xs font-mono">
                <span className="text-[#ac8889]">Black Squad Total:</span>
                <span className="text-zinc-200 font-bold">{blackTries} Tries • {blackChuckersWon} Wins</span>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CREATE MATCH (NO SCORES - Scores added AFTER match is created!)    */}
      {/* ========================================================================= */}
      {false && activeTab === 'add-match' && (
        <form onSubmit={handleCreateMatch} className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2a292e] pb-4">
            <div>
              <h2 className="font-headline text-lg uppercase tracking-wider text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">add_circle</span>
                <span>Create &amp; Schedule New Match</span>
              </h2>
              <p className="text-xs text-[#ac8889]">
                Register fixture details. Scores are recorded after the match has taken place.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase text-[#ac8889]">Suggested Round:</span>
              <span className="px-2 py-0.5 bg-[#141418] text-rose-400 font-mono text-xs font-bold rounded-sm border border-rose-500/30">
                Round #{nextAutoRound}
              </span>
            </div>
          </div>

          {/* Policy Banner: Score Initialized as TBA */}
          <div className="bg-[#141418] border-l-4 border-amber-500 p-4 rounded-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-500 text-xl shrink-0 mt-0.5">pending_actions</span>
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="font-headline uppercase text-amber-400 font-bold">
                Score Policy: Unplayed matches are initialized as "TBA"
              </span>
              <span className="text-[#ac8889]">
                Because this game has not taken place yet, its official score is automatically initialized as <strong>TBA</strong>. When matchday arrives and the chuckers are completed, the administrator can enter and edit the official scores, chuckers, and try scorers in the <strong>Update Match</strong> tab.
              </span>
            </div>
          </div>

          {/* Match Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase text-[#ac8889] tracking-wider font-bold">
                Round Number
              </label>
              <input
                type="number"
                min="1"
                required
                value={addRoundNumber}
                onChange={(e) => setAddRoundNumber(Number(e.target.value))}
                className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm font-mono outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase text-[#ac8889] tracking-wider font-bold">
                Match Date
              </label>
              <input
                type="date"
                required
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm font-mono outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase text-[#ac8889] tracking-wider font-bold">
                Kickoff Time
              </label>
              <input
                type="text"
                value={addKickoff}
                onChange={(e) => setAddKickoff(e.target.value)}
                placeholder="18:30"
                className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm font-mono outline-none"
              />
            </div>

          </div>

          {/* Match Format & Tactical Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase text-[#ac8889] tracking-wider font-bold">
              Format &amp; Matchday Rules
            </label>
            <input
              type="text"
              value={addFormatNotes}
              onChange={(e) => setAddFormatNotes(e.target.value)}
              className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm font-mono outline-none"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2a292e]">
            <button
              type="button"
              onClick={() => handleTabChange('selection')}
              className="px-4 py-2 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm"
            >
              Back to Selection Phase
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow-md shadow-rose-950/50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">event</span>
              <span>Create Match (Score: TBA)</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: UPDATE MATCH (Enter/Edit Scores, Chuckers, Scorers & MVP)           */}
      {/* ========================================================================= */}
      {activeTab === 'update-match' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Matches Catalog (Left Column) */}
          <div className="lg:col-span-4 bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#2a292e] pb-2">
              <span className="font-headline text-sm uppercase text-white font-bold">
                Select Match to Update
              </span>
              <span className="text-[10px] font-mono text-[#ac8889]">
                {matchResults.length} Total Matches
              </span>
            </div>

            {/* Search query */}
            <input
              type="text"
              value={updateSearchQuery}
              onChange={(e) => setUpdateSearchQuery(e.target.value)}
              placeholder="Search by Round # or Date..."
              className="bg-[#141418] border border-[#353439] text-white text-xs px-3 py-1.5 rounded-sm outline-none focus:border-rose-500 font-mono"
            />

            {/* Matches list */}
            <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredMatchesForUpdate.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#ac8889] font-mono">
                  No matches match search criteria.
                </div>
              ) : (
                filteredMatchesForUpdate.map((m) => {
                  const isCur = editingRound === m.roundNumber;
                  const isOverdue = isMatchOverdue(m);
                  return (
                    <div
                      key={`update-sel-${m.roundNumber}`}
                      onClick={() => setEditingRound(m.roundNumber)}
                      className={`p-3 rounded-sm border cursor-pointer transition-all flex flex-col gap-1.5 ${
                        isCur
                          ? 'bg-[#141418] border-rose-500 shadow-md ring-1 ring-rose-500/50'
                          : 'bg-[#141418]/60 border-[#2a292e] hover:border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[10px] uppercase font-bold rounded">
                          Round #{m.roundNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {m.isPlayed === false || m.seriesScore === 'TBA' ? (
                            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[9px] uppercase font-bold rounded">
                              {isOverdue ? 'Score Required' : 'TBA • Scheduled'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[9px] uppercase font-bold rounded">
                              Played
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-[#ac8889]">{m.date}</span>
                        </div>
                      </div>
                      {m.isPlayed === false || m.seriesScore === 'TBA' ? (
                        <div className="flex items-center justify-between text-xs font-headline uppercase font-bold bg-[#1b1b1f] px-2 py-1 rounded-sm border border-amber-500/20">
                          <span className="text-amber-400">Score: {getPendingScoreDisplay(m)}</span>
                          <span className="text-[10px] font-mono text-[#ac8889]">{isOverdue ? 'Update Score' : 'Awaiting Kickoff'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs font-headline uppercase font-bold">
                          <span className="text-rose-500">Red: {m.redTotalTries}</span>
                          <span className="text-zinc-400">Score: {m.seriesScore}</span>
                          <span className="text-white">Black: {m.blackTotalTries}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Match Score Editor Form (Right Column) */}
          <div className="lg:col-span-8 bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-6 flex flex-col gap-6 shadow-xl">
            {selectedMatch ? (
              <form onSubmit={handleSaveUpdateMatch} className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-[#2a292e] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500">edit_note</span>
                    <h3 className="font-headline text-lg uppercase text-white font-bold">
                      Updating Round #{selectedMatch.roundNumber} Scores
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => viewMatchScorecard(selectedMatch.roundNumber)}
                      className="px-3 py-1.5 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] text-xs font-headline uppercase rounded-sm flex items-center gap-1 font-bold"
                    >
                      <span className="material-symbols-outlined text-sm">scoreboard</span>
                      <span>Scorecard Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMatch(selectedMatch.roundNumber)}
                      className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-headline uppercase rounded-sm border border-rose-500/40 flex items-center gap-1 font-bold"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span>Delete Match</span>
                    </button>
                  </div>
                </div>

                {/* Match Score Status Switcher (TBA vs Played) */}
                <div className="bg-[#141418] border border-[#2a292e] p-3 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-xl">
                      {editIsPlayed ? 'verified' : 'pending_actions'}
                    </span>
                    <div>
                      <span className="font-headline text-xs uppercase text-white font-bold block">
                        Match Score Status: {editIsPlayed
                          ? 'Match Played (Official Scores)'
                          : isMatchOverdue(selectedMatch) ? 'Score 0 - 0 (Update Required)' : 'Score TBA (Not Played Yet)'}
                      </span>
                      <span className="text-[10px] font-mono text-[#ac8889]">
                        {editIsPlayed
                          ? 'Scores entered below will be officially recorded on leaderboards and player stats.'
                          : isMatchOverdue(selectedMatch)
                            ? 'The matchday has passed. Enter the official scores to complete this match.'
                            : 'Match has not been played yet; score will remain as TBA until scores are entered.'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditIsPlayed(false)}
                      className={`px-3 py-1.5 font-headline text-xs uppercase rounded-sm border transition-all font-bold flex items-center gap-1.5 ${
                        !editIsPlayed
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                          : 'bg-[#1b1b1f] text-[#ac8889] border-[#2a292e] hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>{isMatchOverdue(selectedMatch) ? 'Score 0 - 0 (Pending)' : 'Score TBA (Pending)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsPlayed(true)}
                      className={`px-3 py-1.5 font-headline text-xs uppercase rounded-sm border transition-all font-bold flex items-center gap-1.5 ${
                        editIsPlayed
                          ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                          : 'bg-[#1b1b1f] text-[#ac8889] border-[#2a292e] hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Enter Official Scores</span>
                    </button>
                  </div>
                </div>

                {/* 3 Chuckers Score Inputs */}
                <div className="flex flex-col gap-2">
                  <span className="font-headline text-xs uppercase text-white tracking-wider font-bold">
                    Chucker Scores (12 min running clock)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {editChuckers.map((c, idx) => (
                      <div
                        key={`edit-chk-${c.chuckerNumber}`}
                        className="bg-[#141418] p-3 rounded-sm border border-[#2a292e] flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase text-[#ac8889]">
                          <span className="font-bold text-white">Chucker #{c.chuckerNumber}</span>
                          <span className={c.winner === 'RED' ? 'text-rose-400 font-bold' : c.winner === 'BLACK' ? 'text-white font-bold' : ''}>
                            Winner: {c.winner}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-rose-400 uppercase font-bold mb-1">
                              Red Score
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={c.redScore}
                              onChange={(e) => handleEditChuckerScoreChange(idx as any, 'red', Number(e.target.value))}
                              className="w-full bg-[#1b1b1f] border border-[#353439] text-white px-2.5 py-1.5 text-sm font-mono text-center rounded-sm outline-none focus:border-rose-500 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-zinc-300 uppercase font-bold mb-1">
                              Black Score
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={c.blackScore}
                              onChange={(e) => handleEditChuckerScoreChange(idx as any, 'black', Number(e.target.value))}
                              className="w-full bg-[#1b1b1f] border border-[#353439] text-white px-2.5 py-1.5 text-sm font-mono text-center rounded-sm outline-none focus:border-rose-500 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Try Scorers Attribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Red Scorers */}
                  <div className="bg-[#141418] border border-rose-500/20 p-3 rounded-sm flex flex-col gap-2">
                    <span className="font-headline text-xs uppercase text-rose-400 font-bold">
                      Team Red Try Scorers
                    </span>
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {players.filter((p) => editRedLineup.includes(p.id)).map((p) => {
                        const count = editRedScorers[p.id] || 0;
                        return (
                          <div key={`red-sc-${p.id}`} className="flex items-center justify-between text-xs py-1 border-b border-[#2a292e]/60">
                            <span className="font-mono text-white truncate">
                              #{p.jerseyNumber} {p.nickname}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditScorerIncrement('red', p.id, -1)}
                                className="w-5 h-5 bg-[#2a292e] hover:bg-[#353439] rounded text-white flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold w-4 text-center text-rose-400">{count}</span>
                              <button
                                type="button"
                                onClick={() => handleEditScorerIncrement('red', p.id, 1)}
                                className="w-5 h-5 bg-rose-600 hover:bg-rose-500 rounded text-white flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Black Scorers */}
                  <div className="bg-[#141418] border border-zinc-700 p-3 rounded-sm flex flex-col gap-2">
                    <span className="font-headline text-xs uppercase text-zinc-300 font-bold">
                      Team Black Try Scorers
                    </span>
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {players.filter((p) => editBlackLineup.includes(p.id)).map((p) => {
                        const count = editBlackScorers[p.id] || 0;
                        return (
                          <div key={`black-sc-${p.id}`} className="flex items-center justify-between text-xs py-1 border-b border-[#2a292e]/60">
                            <span className="font-mono text-white truncate">
                              #{p.jerseyNumber} {p.nickname}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditScorerIncrement('black', p.id, -1)}
                                className="w-5 h-5 bg-[#2a292e] hover:bg-[#353439] rounded text-white flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold w-4 text-center text-white">{count}</span>
                              <button
                                type="button"
                                onClick={() => handleEditScorerIncrement('black', p.id, 1)}
                                className="w-5 h-5 bg-zinc-700 hover:bg-zinc-600 rounded text-white flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* MVP Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                      Match MVP
                    </label>
                    <select
                      value={editMvpPlayerId}
                      onChange={(e) => setEditMvpPlayerId(e.target.value)}
                      className="w-full bg-[#141418] border border-[#353439] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500 font-headline uppercase"
                    >
                      <option value="">Select MVP Player</option>
                      {players.filter((p) => [...editRedLineup, ...editBlackLineup].includes(p.id)).map((p) => (
                        <option key={`mvp-opt-${p.id}`} value={p.id}>
                          #{p.jerseyNumber} "{p.nickname}" ({p.fullName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                      MVP Citation / Performance Notes
                    </label>
                    <input
                      type="text"
                      value={editMvpCitation}
                      onChange={(e) => setEditMvpCitation(e.target.value)}
                      className="w-full bg-[#141418] border border-[#353439] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                {selectedMatch.isFinalized && (
                  <label className="flex flex-col gap-1.5 bg-amber-950/20 border border-amber-500/30 rounded-sm p-3 font-mono text-[10px] uppercase text-amber-300">
                    Correction Reason (required)
                    <textarea
                      value={editCorrectionReason}
                      onChange={(event) => setEditCorrectionReason(event.target.value)}
                      placeholder="Explain why this finalized result is being corrected..."
                      className="min-h-20 bg-[#141418] border border-amber-500/30 text-white rounded-sm p-2 text-xs normal-case outline-none focus:border-amber-400"
                    />
                  </label>
                )}

                {/* Save button */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2a292e]">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow-md shadow-rose-950/50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>Save &amp; Record Scores</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-12 text-center text-xs text-[#ac8889] font-mono">
                No match selected. Select a match from the left list or create a new match.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MEMBER APPROVALS QUEUE                                             */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2a292e] pb-4">
            <div>
              <h2 className="font-headline text-lg uppercase tracking-wider text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">how_to_reg</span>
                <span>Member Registration &amp; Approvals</span>
              </h2>
              <p className="text-xs text-[#ac8889]">
                Review applicant player registrations and verify squad admittance.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold rounded">
              {pendingUsers.length} Applications Pending
            </span>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setApprovalTab('pending')}
                className={`px-3 py-1.5 font-headline text-xs uppercase rounded-sm font-bold ${
                  approvalTab === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#141418] text-[#ac8889] hover:text-white'
                }`}
              >
                Pending ({pendingUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setApprovalTab('approved')}
                className={`px-3 py-1.5 font-headline text-xs uppercase rounded-sm font-bold ${
                  approvalTab === 'approved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#141418] text-[#ac8889] hover:text-white'
                }`}
              >
                Approved ({approvedUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setApprovalTab('all')}
                className={`px-3 py-1.5 font-headline text-xs uppercase rounded-sm font-bold ${
                  approvalTab === 'all'
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#141418] text-[#ac8889] hover:text-white'
                }`}
              >
                All ({users.length})
              </button>
            </div>

            <input
              type="text"
              value={approvalSearch}
              onChange={(e) => setApprovalSearch(e.target.value)}
              placeholder="Search applicants..."
              className="bg-[#141418] border border-[#353439] text-white text-xs px-3 py-1.5 rounded-sm outline-none focus:border-rose-500 font-mono w-60"
            />
          </div>

          {/* Applicants list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-xs text-[#ac8889] font-mono bg-[#141418] rounded-sm border border-[#2a292e]">
                No applications match this filter.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isPending = u.status === 'PENDING';
                return (
                  <div
                    key={`user-${u.id}`}
                    className={`bg-[#141418] border rounded-sm p-4 flex flex-col justify-between gap-3 shadow-sm ${
                      isPending ? 'border-amber-500/50' : 'border-[#2a292e]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-headline text-base uppercase text-white font-bold">
                            {u.fullName}
                          </span>
                          <span className="px-1.5 py-0.2 bg-rose-600 text-white font-mono text-[10px] rounded font-bold">
                            "{u.nickname}"
                          </span>
                        </div>
                        <span className="text-xs text-[#ac8889] font-mono">{u.email}</span>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#ac8889]">
                          <span>Position: <strong className="text-white">{u.position}</strong></span>
                          <span>•</span>
                          <span>Jersey: <strong className="text-rose-400">#{u.jerseyNumber}</strong></span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 font-mono text-[10px] uppercase font-bold rounded ${
                        isPending ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {u.status}
                      </span>
                    </div>

                    {u.notes && (
                      <p className="text-xs text-[#ac8889] italic bg-[#1b1b1f] p-2 rounded-sm border border-[#2a292e]">
                        "{u.notes}"
                      </p>
                    )}

                    {isPending && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2a292e]">
                        <button
                          type="button"
                          onClick={() => rejectUser(u.id)}
                          className="px-3 py-1.5 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] text-xs font-headline uppercase rounded-sm"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => approveUser(u.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-headline uppercase rounded-sm font-bold shadow"
                        >
                          Accept Member
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SELECTOR ROLE MANAGEMENT & DELEGATION                              */}
      {/* ========================================================================= */}
      {activeTab === 'selectors' && (
        <div className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-6 flex flex-col gap-6 shadow-xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2a292e] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[10px] uppercase font-bold rounded-sm">
                  ROLE PERMISSIONS
                </span>
                <span className="text-xs font-mono text-[#ac8889]">
                  Lineup Drafting Authorization
                </span>
              </div>
              <h2 className="font-headline text-lg uppercase tracking-wider text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">assignment_ind</span>
                <span>Team Selector Delegation &amp; Lineup Roles</span>
              </h2>
              <p className="text-xs text-[#ac8889] mt-0.5 max-w-2xl">
                Grant or remove the <strong>Selector</strong> role for approved club members. Official Selectors have clearance to pick Wednesday 9v9 lineups, auto-balance teams, and lock rosters.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase text-[#ac8889]">Active Selectors:</span>
              <span className="px-2.5 py-1 bg-rose-950/60 text-rose-300 font-mono text-xs font-bold rounded-sm border border-rose-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>{activeSelectors.length} Authorized</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#141418] p-3.5 rounded-sm border border-[#2a292e] flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase text-[#ac8889]">OFFICIAL SELECTORS</span>
              <div className="my-1 flex items-baseline gap-2">
                <span className="font-headline text-2xl text-rose-500 font-bold">{activeSelectors.length}</span>
                <span className="text-xs font-mono text-[#ac8889]">Delegated</span>
              </div>
              <span className="text-[10px] font-mono text-[#ac8889]">
                Authorized to pick &amp; lock rosters
              </span>
            </div>

            <div className="bg-[#141418] p-3.5 rounded-sm border border-[#2a292e] flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase text-[#ac8889]">ELIGIBLE APPROVED MEMBERS</span>
              <div className="my-1 flex items-baseline gap-2">
                <span className="font-headline text-2xl text-white font-bold">{approvedUsers.length}</span>
                <span className="text-xs font-mono text-[#ac8889]">Players</span>
              </div>
              <span className="text-[10px] font-mono text-[#ac8889]">
                Active members eligible for selector role
              </span>
            </div>

            <div className="bg-[#141418] p-3.5 rounded-sm border border-[#2a292e] flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase text-[#ac8889]">LINEUP ACCESS POLICY</span>
              <div className="my-1">
                <span className="font-headline text-base text-emerald-400 font-bold uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock_open</span>
                  <span>Restricted Access</span>
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#ac8889]">
                Only Admins &amp; Selectors can edit draft
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141418] p-3 rounded-sm border border-[#2a292e]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectorFilter('all')}
                className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm font-bold transition-all ${
                  selectorFilter === 'all'
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#1b1b1f] text-[#ac8889] hover:text-white border border-[#2a292e]'
                }`}
              >
                All Members ({approvedUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectorFilter('selectors')}
                className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm font-bold transition-all ${
                  selectorFilter === 'selectors'
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#1b1b1f] text-[#ac8889] hover:text-white border border-[#2a292e]'
                }`}
              >
                Selectors ({activeSelectors.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectorFilter('members')}
                className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm font-bold transition-all ${
                  selectorFilter === 'members'
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#1b1b1f] text-[#ac8889] hover:text-white border border-[#2a292e]'
                }`}
              >
                Standard Members ({Math.max(0, approvedUsers.length - activeSelectors.length)})
              </button>
            </div>

            <input
              type="text"
              value={selectorSearch}
              onChange={(e) => setSelectorSearch(e.target.value)}
              placeholder="Search by name, nickname, jersey..."
              className="bg-[#1b1b1f] border border-[#353439] text-white text-xs px-3 py-1.5 rounded-sm outline-none focus:border-rose-500 font-mono w-full sm:w-64"
            />
          </div>

          {/* Members List with Selector Toggle Option */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSelectorUsers.length === 0 ? (
              <div className="col-span-2 p-10 text-center text-xs text-[#ac8889] font-mono bg-[#141418] rounded-sm border border-[#2a292e]">
                No members found matching selector criteria.
              </div>
            ) : (
              filteredSelectorUsers.map((u) => {
                const isUserAdmin = u.role === 'ADMIN';
                const isUserSelector = isUserAdmin || u.role === 'SELECTOR' || !!u.isSelector;

                return (
                  <div
                    key={`selector-user-${u.id}`}
                    className={`bg-[#141418] border rounded-sm p-4 flex flex-col justify-between gap-3 shadow-md transition-all ${
                      isUserSelector ? 'border-rose-500/40 ring-1 ring-rose-500/20' : 'border-[#2a292e]'
                    }`}
                  >
                    {/* Top Row: User Avatar & Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Jersey Badge */}
                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center font-mono text-sm font-bold shrink-0 border ${
                          isUserSelector ? 'bg-rose-950/60 text-rose-300 border-rose-500/40' : 'bg-[#1b1b1f] text-[#ac8889] border-[#2a292e]'
                        }`}>
                          #{u.jerseyNumber || '1'}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-headline text-base uppercase text-white font-bold truncate">
                              {u.fullName}
                            </span>
                            <span className="px-1.5 py-0.2 bg-rose-600 text-white font-mono text-[10px] rounded font-bold">
                              "{u.nickname}"
                            </span>
                          </div>
                          <span className="text-xs text-[#ac8889] font-mono truncate">{u.email}</span>
                          <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#ac8889]">
                            <span>Position: <strong className="text-white">{u.position}</strong></span>
                            <span>•</span>
                            <span>Jersey: <strong className="text-rose-400">#{u.jerseyNumber}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Current Role Badge */}
                      <div className="shrink-0">
                        {isUserAdmin ? (
                          <span className="px-2 py-0.5 bg-rose-950/70 text-rose-300 border border-rose-500/40 font-mono text-[10px] uppercase font-bold rounded">
                            Club Admin
                          </span>
                        ) : isUserSelector ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] uppercase font-bold rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Selector</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-[#1b1b1f] text-[#ac8889] border border-[#2a292e] font-mono text-[10px] uppercase rounded">
                            Member
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role Description Note */}
                    <div className="bg-[#1b1b1f] p-2.5 rounded-sm border border-[#2a292e] text-xs">
                      {isUserAdmin ? (
                        <p className="text-[#ac8889] text-[11px] font-mono">
                          Administrator account. Retains master clearance for team selection, match scoring, and member approvals.
                        </p>
                      ) : isUserSelector ? (
                        <p className="text-emerald-400/90 text-[11px] font-mono flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
                          <span>Authorized Lineup Selector: Can balance and finalize Wednesday 9v9 lineups.</span>
                        </p>
                      ) : (
                        <p className="text-[#ac8889] text-[11px] font-mono">
                          Standard squad member. Lineup drafting is locked in view-only mode for this account.
                        </p>
                      )}
                    </div>

                    {/* Bottom Action: Toggle Option */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#2a292e]">
                      <div className="flex flex-col">
                        <span className="font-headline text-xs uppercase text-white font-bold">
                          Selector Role Access
                        </span>
                        <span className="font-mono text-[10px] text-[#ac8889]">
                          {isUserAdmin
                            ? 'Always active for Admin'
                            : isUserSelector
                            ? 'Click toggle to revoke role'
                            : 'Click toggle to grant role'}
                        </span>
                      </div>

                      {/* Interactive Toggle Option Switch */}
                      <div className="flex items-center gap-2">
                        {isUserAdmin ? (
                          <span className="px-3 py-1 bg-[#1b1b1f] border border-[#2a292e] text-rose-400 text-[11px] font-mono rounded font-bold">
                            Locked (Admin)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleUserSelectorRole(u.id)}
                            className={`px-3.5 py-1.5 rounded-sm border font-headline text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 ${
                              isUserSelector
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                                : 'bg-[#1b1b1f] hover:bg-rose-600 hover:text-white text-[#ac8889] border-[#2a292e]'
                            }`}
                            title={isUserSelector ? `Revoke Selector role from ${u.nickname}` : `Grant Selector role to ${u.nickname}`}
                          >
                            {/* Toggle pill visual */}
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                              isUserSelector ? 'bg-white text-emerald-700' : 'bg-[#2a292e] text-white'
                            }`}>
                              <span className="material-symbols-outlined text-[10px] font-bold">
                                {isUserSelector ? 'check' : 'add'}
                              </span>
                            </span>
                            <span>{isUserSelector ? 'Selector: Active' : 'Selector: Inactive'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
