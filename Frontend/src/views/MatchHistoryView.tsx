import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MatchResult, ChuckerScore } from '../types';
import { toPng } from 'html-to-image';

export const MatchHistoryView: React.FC = () => {
  const {
    clubConfig,
    matchResults,
    deleteMatchResult,
    recordMatchResult,
    updateMatchScorers,
    scorecardModalRound,
    setScorecardModalRound,
    selectedMatchRound,
    setSelectedMatchRound,
    editMatchInScorekeeper,
    players,
    setActivePage,
    showToast,
    currentUser,
  } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN';

  // Helper to extract year from a match
  const getMatchYear = (match: MatchResult): number => {
    if (match.year) return match.year;
    if (match.date) {
      const parsed = new Date(match.date).getFullYear();
      if (!isNaN(parsed)) return parsed;
    }
    return 2026;
  };

  // Dynamically determine all available years (defaults to including 2025, 2026, 2027)
  const defaultYears = [2025, 2026, 2027];
  const recordedYears = matchResults.map(getMatchYear);
  const allYears = Array.from(new Set([...defaultYears, ...recordedYears])).sort((a, b) => a - b);

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'RED' | 'BLACK' | 'DRAW'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Match scorecard viewer modal state
  const [activeScorecardMatch, setActiveScorecardMatch] = useState<MatchResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const scorecardRef = useRef<HTMLDivElement>(null);

  // Scorer attribution/editor modal state
  const [editingScorersMatch, setEditingScorersMatch] = useState<MatchResult | null>(null);
  const [tempRedScorers, setTempRedScorers] = useState<Record<string, number>>({});
  const [tempBlackScorers, setTempBlackScorers] = useState<Record<string, number>>({});

  // Sync with scorecardModalRound ONLY when explicitly arriving to view a scorecard
  useEffect(() => {
    if (scorecardModalRound != null) {
      const match = matchResults.find((m) => m.roundNumber === scorecardModalRound);
      if (match) {
        setSelectedYear(getMatchYear(match));
        setActiveScorecardMatch(match);
        setTimeout(() => {
          const el = document.getElementById(`match-card-${match.roundNumber}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
      // Immediately reset so future visits or navigating back from update score never re-open the scorecard!
      setScorecardModalRound(null);
    }
  }, [scorecardModalRound, matchResults, setScorecardModalRound]);

  // Modal State for adding a past fixture
  const [newRoundNumber, setNewRoundNumber] = useState<number>(() => {
    return matchResults.length + 1;
  });
  const [newDate, setNewDate] = useState<string>(`${selectedYear}-10-15`);
  const [newPitch, setNewPitch] = useState<string>(clubConfig.pitchLocation);
  const [newRedTries, setNewRedTries] = useState<number>(5);
  const [newBlackTries, setNewBlackTries] = useState<number>(4);
  const [newSeriesWinner, setNewSeriesWinner] = useState<'RED' | 'BLACK' | 'DRAW'>('RED');
  const [newMvpPlayerId, setNewMvpPlayerId] = useState<string>('');
  const [newMvpCitation, setNewMvpCitation] = useState<string>('Decisive touches and game-winning leadership');

  const handleOpenEditScorers = (match: MatchResult) => {
    setEditingScorersMatch(match);
    setTempRedScorers({ ...(match.redScorers || {}) });
    setTempBlackScorers({ ...(match.blackScorers || {}) });
  };

  const handleSaveScorers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScorersMatch) return;
    updateMatchScorers(editingScorersMatch.roundNumber, tempRedScorers, tempBlackScorers);
    if (activeScorecardMatch?.roundNumber === editingScorersMatch.roundNumber) {
      setActiveScorecardMatch((prev) =>
        prev
          ? {
              ...prev,
              redScorers: tempRedScorers,
              blackScorers: tempBlackScorers,
              redTotalTries: Object.values(tempRedScorers).reduce((a, b) => a + b, 0),
              blackTotalTries: Object.values(tempBlackScorers).reduce((a, b) => a + b, 0),
            }
          : null
      );
    }
    setEditingScorersMatch(null);
  };

  const generateScorecardCanvasPicture = (match: MatchResult) => {
    try {
      const redList = Object.entries(match.redScorers || {}).filter(([_, c]) => c > 0);
      const blackList = Object.entries(match.blackScorers || {}).filter(([_, c]) => c > 0);
      const maxScorers = Math.max(redList.length, blackList.length, 3);
      const scorersBoxHeight = Math.max(240, 90 + maxScorers * 46);
      const mvpY = 675 + scorersBoxHeight + 25;
      const watermarkY = mvpY + (match.mvpPlayerId ? 140 : 20);
      const totalCanvasHeight = watermarkY + 90;

      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = totalCanvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Card Background
      ctx.fillStyle = '#17171b';
      ctx.fillRect(0, 0, 1200, totalCanvasHeight);

      // Top Crimson Accent Line
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(0, 0, 1200, 8);

      // Header Bar
      ctx.fillStyle = '#0e0e12';
      ctx.fillRect(0, 8, 1200, 140);
      ctx.strokeStyle = '#2a292e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 148);
      ctx.lineTo(1200, 148);
      ctx.stroke();

      // Header Round Badge
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(40, 35, 140, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`ROUND #${match.roundNumber}`, 52, 62);

      // Header Title
      ctx.fillStyle = '#fb7185';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('OFFICIAL MATCH SCORECARD', 200, 62);

      ctx.fillStyle = '#ac8889';
      ctx.font = '15px monospace';
      ctx.fillText(`${clubConfig.clubName} • ${match.pitch} • Referee: ${match.referee || clubConfig.referee}`, 40, 110);
      ctx.fillText(`Date: ${match.date || 'Wednesday Touch'}`, 880, 110);

      // Series Outcome Banner
      ctx.fillStyle = '#0e0e12';
      ctx.fillRect(40, 180, 1120, 240);
      ctx.strokeStyle = '#2a292e';
      ctx.strokeRect(40, 180, 1120, 240);

      // Outcome Subtitle
      ctx.fillStyle = '#fb7185';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SERIES OUTCOME', 600, 215);

      // Team Red Column
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('TEAM RED', 260, 268);
      ctx.font = 'bold 72px sans-serif';
      ctx.fillText(String(match.redTotalTries), 260, 348);
      ctx.fillStyle = '#ac8889';
      ctx.font = '15px monospace';
      ctx.fillText('TRIES SCORED', 260, 385);

      // Winner Center Box
      ctx.fillStyle = '#1b1b1f';
      ctx.fillRect(490, 248, 220, 115);
      ctx.strokeStyle = '#353439';
      ctx.strokeRect(490, 248, 220, 115);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(
        match.seriesWinner === 'RED' ? 'RED VICTORY' : match.seriesWinner === 'BLACK' ? 'BLACK VICTORY' : 'HONOURS EVEN',
        600,
        298
      );
      ctx.fillStyle = '#ac8889';
      ctx.font = '15px monospace';
      ctx.fillText(`Chucker Score: ${match.seriesScore}`, 600, 335);

      // Team Black Column
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('TEAM BLACK', 940, 268);
      ctx.font = 'bold 72px sans-serif';
      ctx.fillText(String(match.blackTotalTries), 940, 348);
      ctx.fillStyle = '#ac8889';
      ctx.font = '15px monospace';
      ctx.fillText('TRIES SCORED', 940, 385);

      ctx.textAlign = 'left';

      // 3 Chuckers breakdown
      ctx.fillStyle = '#ac8889';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('CHUCKER-BY-CHUCKER BREAKDOWN', 40, 465);

      match.chuckers.forEach((c, idx) => {
        const x = 40 + idx * 385;
        const y = 485;
        ctx.fillStyle = '#1b1b1f';
        ctx.fillRect(x, y, 350, 120);
        ctx.strokeStyle = '#2a292e';
        ctx.strokeRect(x, y, 350, 120);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`CHUCKER ${c.chuckerNumber} ${c.chuckerNumber === 3 ? '• DECIDER' : ''}`, x + 20, y + 35);

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(String(c.redScore), x + 20, y + 85);

        ctx.fillStyle = '#ac8889';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('-', x + 65, y + 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(String(c.blackScore), x + 90, y + 85);

        ctx.fillStyle = c.winner === 'RED' ? '#f43f5e' : c.winner === 'BLACK' ? '#ffffff' : '#ac8889';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(`${c.winner} WIN`, x + 230, y + 75);
      });

      // WHO SCORED SECTION
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('WHO SCORED • COMPLETE SQUAD TRY BREAKDOWN', 40, 650);

      // Red Box
      ctx.fillStyle = '#141418';
      ctx.fillRect(40, 675, 540, scorersBoxHeight);
      ctx.strokeStyle = '#e11d48';
      ctx.strokeRect(40, 675, 540, scorersBoxHeight);
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`TEAM RED SCORERS (${match.redTotalTries} Tries)`, 60, 715);

      if (redList.length > 0) {
        redList.forEach(([id, c], i) => {
          const p = players.find((pl) => pl.id === id);
          const name = p ? `#${p.jerseyNumber} "${p.nickname}" (${p.fullName})` : id;
          ctx.fillStyle = '#1b1b1f';
          ctx.fillRect(60, 740 + i * 44, 500, 36);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(name, 75, 764 + i * 44);
          ctx.fillStyle = '#fb7185';
          ctx.font = 'bold 15px monospace';
          ctx.fillText(`${c} ${c === 1 ? 'try' : 'tries'}`, 480, 764 + i * 44);
        });
      } else {
        ctx.fillStyle = '#ac8889';
        ctx.font = '16px monospace';
        ctx.fillText('No individual scorers itemized for Team Red', 70, 780);
      }

      // Black Box
      ctx.fillStyle = '#141418';
      ctx.fillRect(620, 675, 540, scorersBoxHeight);
      ctx.strokeStyle = '#52525b';
      ctx.strokeRect(620, 675, 540, scorersBoxHeight);
      ctx.fillStyle = '#e4e4e7';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`TEAM BLACK SCORERS (${match.blackTotalTries} Tries)`, 640, 715);

      if (blackList.length > 0) {
        blackList.forEach(([id, c], i) => {
          const p = players.find((pl) => pl.id === id);
          const name = p ? `#${p.jerseyNumber} "${p.nickname}" (${p.fullName})` : id;
          ctx.fillStyle = '#1b1b1f';
          ctx.fillRect(640, 740 + i * 44, 500, 36);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(name, 655, 764 + i * 44);
          ctx.fillStyle = '#e4e4e7';
          ctx.font = 'bold 15px monospace';
          ctx.fillText(`${c} ${c === 1 ? 'try' : 'tries'}`, 1060, 764 + i * 44);
        });
      } else {
        ctx.fillStyle = '#ac8889';
        ctx.font = '16px monospace';
        ctx.fillText('No individual scorers itemized for Team Black', 650, 780);
      }

      // MVP Box
      if (match.mvpPlayerId) {
        const mvp = players.find((p) => p.id === match.mvpPlayerId);
        ctx.fillStyle = '#1b1b1f';
        ctx.fillRect(40, mvpY, 1120, 115);
        ctx.strokeStyle = '#2a292e';
        ctx.strokeRect(40, mvpY, 1120, 115);

        ctx.fillStyle = '#fb7185';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('OFFICIAL REFEREE MVP RECOGNITION', 70, mvpY + 30);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(mvp ? `"${mvp.nickname}" (${mvp.fullName}) • #${mvp.jerseyNumber}` : 'Match MVP', 70, mvpY + 65);

        ctx.fillStyle = '#ac8889';
        ctx.font = 'italic 15px sans-serif';
        ctx.fillText(`"${match.mvpCitation}"`, 70, mvpY + 95);
      }

      // Watermark footer
      ctx.fillStyle = '#0e0e12';
      ctx.fillRect(0, watermarkY, 1200, 80);
      ctx.fillStyle = '#ac8889';
      ctx.font = '15px monospace';
      ctx.fillText(`${clubConfig.clubName} • TOUCH ARCHIVES • CYCLE #${match.roundNumber}`, 40, watermarkY + 45);
      ctx.fillText('EST. 1879 • OFFICIAL VERIFIED SCORECARD', 820, watermarkY + 45);

      const dataUrl = canvas.toDataURL('image/png');
      const filename = `${clubConfig.clubName.replace(/\s+/g, '_')}_Round${match.roundNumber}_Scorecard.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Whole scorecard picture generated & saved as ${filename}! Ready to send.`);
    } catch (e) {
      console.error('Canvas export error:', e);
      showToast('Could not generate picture. Please try again.');
    }
  };

  const handleExportPicture = async () => {
    if (!activeScorecardMatch) return;
    setIsExporting(true);
    const node = scorecardRef.current;
    if (!node) {
      generateScorecardCanvasPicture(activeScorecardMatch);
      setIsExporting(false);
      return;
    }

    // Save previous styles of scrollable elements so we can restore them cleanly
    const originalStyles = new Map<HTMLElement, { overflow: string; height: string; maxHeight: string }>();
    const elementsToUnconstrain = [
      node,
      ...(node.parentElement ? [node.parentElement] : []),
      ...Array.from(node.querySelectorAll<HTMLElement>('.overflow-y-auto, [style*="overflow"], .overflow-hidden'))
    ];
    
    elementsToUnconstrain.forEach((el) => {
      originalStyles.set(el, {
        overflow: el.style.overflow,
        height: el.style.height,
        maxHeight: el.style.maxHeight,
      });
      el.style.overflow = 'visible';
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
    });

    try {
      const fullHeight = node.scrollHeight;
      const fullWidth = node.scrollWidth || 950;

      // Render full scorecard DOM to PNG using html-to-image at crisp 2x retina
      const dataUrl = await toPng(node, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#17171b',
        width: fullWidth,
        height: fullHeight,
        style: {
          overflow: 'visible',
          height: `${fullHeight}px`,
          maxHeight: 'none',
        },
        filter: (domNode) => {
          if (domNode instanceof HTMLElement && domNode.dataset.noExport === 'true') {
            return false;
          }
          return true;
        },
      });

      const filename = `${clubConfig.clubName.replace(/\s+/g, '_')}_Round${activeScorecardMatch.roundNumber}_Scorecard.png`;

      // Trigger automatic file download
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Attempt to copy image to clipboard so user can instantly paste into WhatsApp
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          showToast(`Whole scorecard picture saved to Downloads & copied to clipboard! Paste directly into WhatsApp.`);
        } catch {
          showToast(`Whole scorecard picture downloaded as ${filename}! Ready to send.`);
        }
      } else {
        showToast(`Whole scorecard picture downloaded as ${filename}! Ready to send.`);
      }
    } catch (err) {
      console.warn('html-to-image export warning, falling back to canvas:', err);
      generateScorecardCanvasPicture(activeScorecardMatch);
    } finally {
      // Restore styles
      originalStyles.forEach((styles, el) => {
        el.style.overflow = styles.overflow;
        el.style.height = styles.height;
        el.style.maxHeight = styles.maxHeight;
      });
      setIsExporting(false);
    }
  };

  // Matches filtered by selected year
  const yearMatches = useMemo(() => {
    return matchResults.filter((m) => getMatchYear(m) === selectedYear);
  }, [matchResults, selectedYear]);

  // Year telemetry stats
  const totalGamesInYear = yearMatches.length;
  const redWins = yearMatches.filter((m) => m.seriesWinner === 'RED').length;
  const blackWins = yearMatches.filter((m) => m.seriesWinner === 'BLACK').length;
  const draws = yearMatches.filter((m) => m.seriesWinner === 'DRAW').length;
  const totalTriesInYear = yearMatches.reduce((acc, m) => acc + (m.redTotalTries || 0) + (m.blackTotalTries || 0), 0);
  const avgTriesPerGame = totalGamesInYear > 0 ? (totalTriesInYear / totalGamesInYear).toFixed(1) : '0.0';

  // Find top scorer or MVP in this year
  const yearMvpCount: Record<string, number> = {};
  yearMatches.forEach((m) => {
    if (m.mvpPlayerId) {
      yearMvpCount[m.mvpPlayerId] = (yearMvpCount[m.mvpPlayerId] || 0) + 1;
    }
  });
  const topMvpId = Object.keys(yearMvpCount).sort((a, b) => yearMvpCount[b] - yearMvpCount[a])[0];
  const topMvpPlayer = players.find((p) => p.id === topMvpId);

  // Filtered by outcome and search query
  const filteredMatches = yearMatches.filter((match) => {
    const matchesOutcome = filterOutcome === 'ALL' || match.seriesWinner === filterOutcome;
    const searchLower = searchTerm.toLowerCase();
    const mvpPlayer = players.find((p) => p.id === match.mvpPlayerId);
    const matchesSearch =
      !searchTerm ||
      match.roundNumber.toString().includes(searchLower) ||
      match.pitch.toLowerCase().includes(searchLower) ||
      (match.date && match.date.toLowerCase().includes(searchLower)) ||
      (mvpPlayer && mvpPlayer.nickname.toLowerCase().includes(searchLower));
    return matchesOutcome && matchesSearch;
  });

  const handleCreatePastMatch = (e: React.FormEvent) => {
    e.preventDefault();

    const dummyChuckers: [ChuckerScore, ChuckerScore, ChuckerScore] = [
      {
        chuckerNumber: 1,
        redScore: Math.ceil(newRedTries / 3),
        blackScore: Math.floor(newBlackTries / 3),
        elapsedTime: "12' FT",
        winner: newRedTries > newBlackTries ? 'RED' : newRedTries < newBlackTries ? 'BLACK' : 'DRAW',
      },
      {
        chuckerNumber: 2,
        redScore: Math.floor(newRedTries / 3),
        blackScore: Math.ceil(newBlackTries / 3),
        elapsedTime: "12' FT",
        winner: newRedTries > newBlackTries ? 'RED' : newRedTries < newBlackTries ? 'BLACK' : 'DRAW',
      },
      {
        chuckerNumber: 3,
        redScore: newRedTries - Math.ceil(newRedTries / 3) - Math.floor(newRedTries / 3),
        blackScore: newBlackTries - Math.floor(newBlackTries / 3) - Math.ceil(newBlackTries / 3),
        elapsedTime: "12' FT",
        winner: newRedTries > newBlackTries ? 'RED' : newRedTries < newBlackTries ? 'BLACK' : 'DRAW',
      },
    ];

    const matchToRecord: MatchResult = {
      roundNumber: Number(newRoundNumber),
      date: newDate,
      year: selectedYear,
      pitch: newPitch,
      chuckers: dummyChuckers,
      redTotalTries: Number(newRedTries),
      blackTotalTries: Number(newBlackTries),
      seriesWinner: newSeriesWinner,
      seriesScore: `${newRedTries} - ${newBlackTries}`,
      mvpPlayerId: newMvpPlayerId || (players[0] ? players[0].id : ''),
      mvpCitation: newMvpCitation.trim() || 'Outstanding performance and offensive playmaking.',
      redScorers: {},
      blackScorers: {},
    };

    recordMatchResult(matchToRecord);
    setIsRecordModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header Banner */}
      <section className="w-full bg-[#0e0e12] border-b border-[#2a292e]/60 px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-[11px] uppercase tracking-widest rounded-sm">
                  <span className="material-symbols-outlined text-xs text-rose-500">history_edu</span>
                  SEASON ARCHIVES
                </span>
                <span className="text-[#ac8889] font-mono text-[11px] tracking-widest uppercase">
                  {clubConfig.clubName} OFFICIAL LEDGER
                </span>
              </div>
              <h1 className="font-headline text-3xl sm:text-5xl uppercase tracking-tight text-white mt-1">
                MATCH <span className="text-rose-500">HISTORY</span>
              </h1>
              <p className="text-sm text-[#ac8889]">
                5-a-Side Wednesday matchday records, 3-chucker scores, parity indicators, and historical honours by year.
              </p>
            </div>

            {/* Quick Actions */}
            {isAdmin && (
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => {
                    if (filteredMatches.length > 0) {
                      editMatchInScorekeeper(filteredMatches[0].roundNumber);
                    } else if (matchResults.length > 0) {
                      editMatchInScorekeeper(matchResults[0].roundNumber);
                    } else {
                      setActivePage('match-results-capture');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm shadow-md transition-all font-bold"
                  title="Select a match to update scores and chuckers"
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  <span>Select Match to Update</span>
                </button>
                <button
                  onClick={() => {
                    setNewDate(`${selectedYear}-06-15`);
                    setIsRecordModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm border border-[#353439] transition-all font-bold"
                >
                  <span className="material-symbols-outlined text-sm text-rose-400">note_add</span>
                  <span>+ Log New Fixture</span>
                </button>
              </div>
            )}
          </div>

          {/* ================= SMALL TABS FOR THE YEARS ================= */}
          <div className="pt-2 border-t border-[#2a292e]/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#ac8889] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-rose-500">calendar_month</span>
                Select Season Year:
              </span>
              <span className="text-xs font-mono text-[#ac8889]">
                Showing: <strong className="text-white">{selectedYear}</strong> ({totalGamesInYear} {totalGamesInYear === 1 ? 'game' : 'games'})
              </span>
            </div>

            {/* The Year Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {allYears.map((yr) => {
                const count = matchResults.filter((m) => getMatchYear(m) === yr).length;
                const isSelected = selectedYear === yr;

                return (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-sm font-headline text-xs uppercase tracking-wider transition-all duration-150 border ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.4)] font-bold scale-[1.02]'
                        : 'bg-[#1b1b1f] hover:bg-[#25252a] text-[#ac8889] hover:text-white border-[#2a292e]'
                    }`}
                  >
                    <span>{yr}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                        isSelected
                          ? 'bg-white/20 text-white font-bold'
                          : 'bg-[#131317] text-[#ac8889]'
                      }`}
                    >
                      {count} {count === 1 ? 'game' : 'games'}
                    </span>
                  </button>
                );
              })}

              {/* Add Custom Year Tab button */}
              <button
                onClick={() => {
                  const promptYr = prompt('Enter season year to add (e.g. 2028):');
                  if (promptYr && !isNaN(Number(promptYr))) {
                    const parsedYr = Number(promptYr);
                    setSelectedYear(parsedYr);
                  }
                }}
                className="shrink-0 px-2.5 py-2 bg-[#17171b] hover:bg-[#222228] text-[#ac8889] hover:text-white border border-dashed border-[#353439] rounded-sm text-xs font-mono flex items-center gap-1 transition-colors"
                title="Add a custom year tab"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                <span>+ Year</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Selected Year Season Telemetry Strip */}
      <section className="w-full bg-[#131317] border-b border-[#2a292e] px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Games in Year */}
          <div className="bg-[#1b1b1f] p-4 rounded-sm border border-[#2a292e] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#ac8889] text-xs font-mono">
              <span className="uppercase tracking-wider">SEASON FIXTURES</span>
              <span className="material-symbols-outlined text-rose-500 text-sm">stadium</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl text-white font-bold">{totalGamesInYear}</span>
              <span className="text-xs text-[#ac8889] font-mono">Games in {selectedYear}</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 mt-1">
              {totalGamesInYear > 0 ? `${totalGamesInYear * 3} Chuckers Completed` : 'No fixtures logged yet'}
            </span>
          </div>

          {/* Card 2: Red vs Black Breakdown */}
          <div className="bg-[#1b1b1f] p-4 rounded-sm border border-[#2a292e] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#ac8889] text-xs font-mono">
              <span className="uppercase tracking-wider">SERIES OUTCOME</span>
              <span className="material-symbols-outlined text-rose-500 text-sm">balance</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-headline text-sm uppercase text-rose-400 font-bold">
                Red: {redWins}W
              </span>
              <span className="font-mono text-xs text-[#ac8889]">
                {draws > 0 ? `${draws} Draw${draws > 1 ? 's' : ''}` : '0 Draws'}
              </span>
              <span className="font-headline text-sm uppercase text-zinc-300 font-bold">
                Black: {blackWins}W
              </span>
            </div>
            {/* Visual ratio bar */}
            <div className="w-full h-1.5 bg-[#0e0e12] rounded-full overflow-hidden flex mt-2 border border-[#2a292e]">
              <div
                className="bg-rose-600 h-full"
                style={{
                  width: totalGamesInYear > 0 ? `${(redWins / totalGamesInYear) * 100}%` : '50%',
                }}
              ></div>
              <div
                className="bg-zinc-600 h-full"
                style={{
                  width: totalGamesInYear > 0 ? `${(blackWins / totalGamesInYear) * 100}%` : '50%',
                }}
              ></div>
            </div>
          </div>

          {/* Card 3: Try Volume */}
          <div className="bg-[#1b1b1f] p-4 rounded-sm border border-[#2a292e] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#ac8889] text-xs font-mono">
              <span className="uppercase tracking-wider">TRY PRODUCTION</span>
              <span className="material-symbols-outlined text-rose-500 text-sm">sports_rugby</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl text-rose-500 font-bold">{totalTriesInYear}</span>
              <span className="text-xs text-[#ac8889] font-mono">Total Tries</span>
            </div>
            <span className="text-[11px] font-mono text-[#ac8889] mt-1">
              Avg {avgTriesPerGame} tries / matchday
            </span>
          </div>

          {/* Card 4: Season MVP */}
          <div className="bg-[#1b1b1f] p-4 rounded-sm border border-[#2a292e] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#ac8889] text-xs font-mono">
              <span className="uppercase tracking-wider">{selectedYear} MVP HONORS</span>
              <span className="material-symbols-outlined text-rose-500 text-sm">hotel_class</span>
            </div>
            <div className="mt-2 flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-sm bg-[#0e0e12] border border-rose-500/40 flex items-center justify-center font-headline text-xs text-rose-500 font-bold shrink-0">
                {topMvpPlayer ? `#${topMvpPlayer.jerseyNumber}` : '--'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline text-sm uppercase text-white truncate">
                  {topMvpPlayer ? `"${topMvpPlayer.nickname}"` : 'Pending MVP'}
                </span>
                <span className="text-[10px] font-mono text-[#ac8889] truncate">
                  {topMvpId ? `${yearMvpCount[topMvpId]} MVP citations in ${selectedYear}` : 'No awards recorded'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-rose-400 mt-1 uppercase">
              {topMvpPlayer ? `${topMvpPlayer.position} Specialist` : 'Season Honors'}
            </span>
          </div>
        </div>
      </section>

      {/* Fixtures List & Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-8 flex flex-col gap-6">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#1b1b1f] p-3 rounded-sm border border-[#2a292e]">
          {/* Outcome Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterOutcome('ALL')}
              className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm transition-colors ${
                filterOutcome === 'ALL'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-[#131317] text-[#ac8889] hover:text-white'
              }`}
            >
              All Matches ({yearMatches.length})
            </button>
            <button
              onClick={() => setFilterOutcome('RED')}
              className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm transition-colors ${
                filterOutcome === 'RED'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-[#131317] text-[#ac8889] hover:text-white'
              }`}
            >
              Red Wins ({redWins})
            </button>
            <button
              onClick={() => setFilterOutcome('BLACK')}
              className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm transition-colors ${
                filterOutcome === 'BLACK'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-[#131317] text-[#ac8889] hover:text-white'
              }`}
            >
              Black Wins ({blackWins})
            </button>
            <button
              onClick={() => setFilterOutcome('DRAW')}
              className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm transition-colors ${
                filterOutcome === 'DRAW'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-[#131317] text-[#ac8889] hover:text-white'
              }`}
            >
              Draws ({draws})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#ac8889] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search round, pitch, MVP..."
              className="w-full bg-[#131317] text-white border border-[#353439] placeholder-[#ac8889]/60 text-xs pl-9 pr-3 py-2 rounded-sm outline-none focus:border-rose-500 transition-colors"
            />
          </div>
        </div>

        {/* Fixtures Rendering */}
        {filteredMatches.length === 0 ? (
          <div className="bg-[#1b1b1f] border border-[#2a292e] p-12 rounded-sm text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#2a292e] flex items-center justify-center text-rose-500">
              <span className="material-symbols-outlined text-3xl">event_busy</span>
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <h3 className="font-headline text-xl uppercase text-white">
                No Games Recorded for {selectedYear}
              </h3>
              <p className="text-sm text-[#ac8889]">
                {yearMatches.length === 0
                  ? `There are currently 0 games recorded in the ${selectedYear} season tab. Record a fixture or connect your backend to sync past results.`
                  : `No fixtures match the selected filter or search term.`}
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => {
                    setNewDate(`${selectedYear}-10-15`);
                    setIsRecordModalOpen(true);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm flex items-center gap-2 shadow font-bold"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  + Record {selectedYear} Match
                </button>
                <button
                  onClick={() => setActivePage('admin-dashboard')}
                  className="px-4 py-2 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm text-rose-400">sports_score</span>
                  Go to Admin Match Control
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMatches.map((match, idx) => {
              const isRedWinner = match.seriesWinner === 'RED';
              const isBlackWinner = match.seriesWinner === 'BLACK';
              const isDraw = match.seriesWinner === 'DRAW';
              const mvpPlayer = players.find((p) => p.id === match.mvpPlayerId);
              const isSelected = selectedMatchRound === match.roundNumber;

              return (
                <div
                  id={`match-card-${match.roundNumber}`}
                  key={`history-match-${match.year || ''}-${match.roundNumber}-${match.date || ''}-${idx}`}
                  className={`bg-[#1b1b1f] border rounded-sm p-5 shadow-lg flex flex-col justify-between gap-4 transition-all ${
                    isSelected
                      ? 'border-rose-500 ring-2 ring-rose-500/50 shadow-rose-950/40 bg-[#1c181f]'
                      : 'border-[#2a292e] hover:border-rose-500/40'
                  }`}
                >
                  {/* Top Bar: Round & Meta */}
                  <div className="flex items-center justify-between border-b border-[#2a292e] pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-rose-600 text-white font-headline text-xs uppercase rounded-sm font-bold shadow-sm">
                        ROUND #{match.roundNumber}
                      </span>
                      <span className="font-mono text-[11px] text-[#ac8889] uppercase">
                        {match.date || `${selectedYear} Season`}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-[10px] uppercase font-bold rounded-sm animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> MATCH FROM HOMEPAGE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-rose-400 uppercase bg-[#131317] border border-[#2a292e] px-2 py-0.5 rounded-sm">
                        {match.pitch}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove Round #${match.roundNumber} match record?`)) {
                              deleteMatchResult(match.roundNumber);
                            }
                          }}
                          className="text-[#ac8889] hover:text-rose-500 p-1 transition-colors"
                          title="Delete Match (Admin Only)"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Main Score Clash */}
                  {match.isPlayed === false || match.seriesScore === 'TBA' || match.seriesWinner === 'TBA' ? (
                    <div className="flex flex-col items-center justify-center py-4 bg-[#131317] p-3 rounded-sm border border-amber-500/30 text-center gap-2">
                      <div className="flex items-center justify-center gap-6">
                        <span className="font-headline text-base sm:text-lg uppercase text-rose-500 font-bold">
                          TEAM RED
                        </span>
                        <div className="px-5 py-2 bg-[#1b1b1f] border border-amber-500/50 rounded-sm shadow-inner">
                          <span className="font-headline text-2xl sm:text-3xl text-amber-400 font-bold tracking-widest">
                            TBA
                          </span>
                        </div>
                        <span className="font-headline text-base sm:text-lg uppercase text-white font-bold">
                          TEAM BLACK
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-300 font-mono text-[10px] uppercase tracking-wider rounded font-semibold border border-amber-500/20">
                          Match Not Played Yet • Score will be entered on matchday
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 items-center py-2 bg-[#131317] p-3 rounded-sm border border-[#2a292e]">
                      {/* Team Red */}
                      <div className="flex flex-col items-center text-center">
                        <span className="font-headline text-sm uppercase text-rose-500 font-bold">
                          TEAM RED
                        </span>
                        <span className="font-headline text-4xl text-rose-500 font-bold leading-none mt-1">
                          {match.redTotalTries}
                        </span>
                        <span className="font-mono text-[10px] text-[#ac8889] uppercase mt-1">
                          Tries Scored
                        </span>
                      </div>

                      {/* VS / Winner Pill */}
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`px-2 py-0.5 font-headline text-[11px] uppercase tracking-wider rounded-sm font-bold ${
                            isRedWinner
                              ? 'bg-rose-600 text-white'
                              : isBlackWinner
                              ? 'bg-zinc-700 text-white'
                              : 'bg-[#2a292e] text-[#ac8889]'
                          }`}
                        >
                          {isRedWinner ? 'RED VICTORY' : isBlackWinner ? 'BLACK VICTORY' : 'MATCH DRAW'}
                        </span>
                        <span className="font-mono text-[10px] text-[#ac8889]">
                          Score: {match.seriesScore}
                        </span>
                      </div>

                      {/* Team Black */}
                      <div className="flex flex-col items-center text-center">
                        <span className="font-headline text-sm uppercase text-white font-bold">
                          TEAM BLACK
                        </span>
                        <span className="font-headline text-4xl text-white font-bold leading-none mt-1">
                          {match.blackTotalTries}
                        </span>
                        <span className="font-mono text-[10px] text-[#ac8889] uppercase mt-1">
                          Tries Scored
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3 Chuckers breakdown */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase text-[#ac8889] tracking-wider">
                      3-Chucker Score Breakdown:
                    </span>
                    {match.isPlayed === false || match.seriesScore === 'TBA' ? (
                      <div className="p-3 bg-[#131317] rounded-sm border border-[#2a292e] text-center text-xs font-mono text-[#ac8889]">
                        Chuckers scheduled for matchday ({match.date}) • 12 min running clock (Scores TBA)
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {match.chuckers.map((c, cIdx) => (
                          <div
                            key={`history-chucker-${match.roundNumber}-${c.chuckerNumber}-${cIdx}`}
                            className="bg-[#131317] p-2 rounded-sm border border-[#2a292e] flex flex-col items-center gap-0.5 text-center"
                          >
                            <span className="font-mono text-[9px] uppercase text-[#ac8889]">
                              Chucker #{c.chuckerNumber}
                            </span>
                            <span className="font-headline text-sm text-white font-bold">
                              <span className="text-rose-400">{c.redScore}</span> - <span>{c.blackScore}</span>
                            </span>
                            <span
                              className={`font-mono text-[9px] uppercase font-bold ${
                                c.winner === 'RED'
                                  ? 'text-rose-400'
                                  : c.winner === 'BLACK'
                                  ? 'text-zinc-300'
                                  : 'text-[#ac8889]'
                              }`}
                            >
                              {c.winner}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Try Scorers (Who Scored) Breakdown Section */}
                  <div className="bg-[#131317] border border-[#2a292e] rounded-sm p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-rose-500 text-sm">sports_rugby</span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-rose-400 font-bold">
                          TRY SCORERS • WHO SCORED
                        </span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleOpenEditScorers(match)}
                          className="text-[10px] font-mono text-[#ac8889] hover:text-white flex items-center gap-1 hover:underline"
                          title="Edit try scorer distribution for this match"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                          <span>Edit Scorers</span>
                        </button>
                      )}
                    </div>

                    {(() => {
                      const redScorers = Object.entries(match.redScorers || {})
                        .filter(([_, count]) => count > 0)
                        .map(([id, count]) => {
                          const p = players.find((pl) => pl.id === id);
                          return { name: p?.nickname || id, tries: count, jersey: p?.jerseyNumber };
                        });

                      const blackScorers = Object.entries(match.blackScorers || {})
                        .filter(([_, count]) => count > 0)
                        .map(([id, count]) => {
                          const p = players.find((pl) => pl.id === id);
                          return { name: p?.nickname || id, tries: count, jersey: p?.jerseyNumber };
                        });

                      const hasAnyScorers = redScorers.length > 0 || blackScorers.length > 0;

                      if (!hasAnyScorers) {
                        return (
                          <div className="py-2 px-3 bg-[#1b1b1f] border border-dashed border-[#2a292e] rounded-sm flex items-center justify-between text-xs">
                            <span className="text-[#ac8889] text-[11px] font-mono">
                              {match.redTotalTries + match.blackTotalTries} total match tries logged (scorers unassigned)
                            </span>
                            <button
                              onClick={() => handleOpenEditScorers(match)}
                              className="px-2 py-0.5 bg-rose-500/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40 font-headline text-[10px] uppercase rounded-sm transition-colors font-bold"
                            >
                              + Assign Scorers
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {/* Red Scorers */}
                          <div className="bg-[#1b1b1f] p-2.5 rounded-sm border border-rose-500/20 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between border-b border-[#2a292e] pb-1">
                              <span className="font-headline text-[11px] uppercase text-rose-400 font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                TEAM RED ({match.redTotalTries} TRIES)
                              </span>
                            </div>
                            {redScorers.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {redScorers.map((s, idx) => (
                                  <div key={`hist-red-scorer-${match.roundNumber}-${idx}-${s.name}`} className="flex items-center justify-between font-mono text-xs text-white">
                                    <span className="truncate">
                                      {s.jersey ? <span className="text-rose-400 font-bold">#{s.jersey} </span> : ''}
                                      {s.name}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0 font-bold text-rose-400">
                                      <span>{s.tries} {s.tries === 1 ? 'try' : 'tries'}</span>
                                      <span className="text-[10px]">{'🏉'.repeat(Math.min(s.tries, 5))}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono text-[#ac8889] italic">No tries recorded</span>
                            )}
                          </div>

                          {/* Black Scorers */}
                          <div className="bg-[#1b1b1f] p-2.5 rounded-sm border border-zinc-700 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between border-b border-[#2a292e] pb-1">
                              <span className="font-headline text-[11px] uppercase text-zinc-300 font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                                TEAM BLACK ({match.blackTotalTries} TRIES)
                              </span>
                            </div>
                            {blackScorers.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {blackScorers.map((s, idx) => (
                                  <div key={`hist-black-scorer-${match.roundNumber}-${idx}-${s.name}`} className="flex items-center justify-between font-mono text-xs text-white">
                                    <span className="truncate">
                                      {s.jersey ? <span className="text-zinc-400 font-bold">#{s.jersey} </span> : ''}
                                      {s.name}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0 font-bold text-zinc-300">
                                      <span>{s.tries} {s.tries === 1 ? 'try' : 'tries'}</span>
                                      <span className="text-[10px]">{'🏉'.repeat(Math.min(s.tries, 5))}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono text-[#ac8889] italic">No tries recorded</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* MVP Citation */}
                  {match.mvpPlayerId && (
                    <div className="bg-[#131317] p-2.5 rounded-sm border border-[#2a292e] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-rose-500 text-base shrink-0">
                          hotel_class
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-headline text-xs uppercase text-white truncate">
                            MVP: {mvpPlayer ? `"${mvpPlayer.nickname}" (#${mvpPlayer.jerseyNumber})` : 'Registered Teammate'}
                          </span>
                          <p className="text-[10px] text-[#ac8889] italic truncate">
                            "{match.mvpCitation}"
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 px-1.5 py-0.5 bg-rose-600/30 text-rose-400 border border-rose-500/30 font-mono text-[9px] uppercase rounded">
                        Referee Award
                      </span>
                    </div>
                  )}

                  {/* Card Action Footer */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#2a292e]">
                    <button
                      onClick={() => setActiveScorecardMatch(match)}
                      className="flex-1 py-2 px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-all text-center flex items-center justify-center gap-1.5 font-bold shadow-md"
                    >
                      <span className="material-symbols-outlined text-sm">scoreboard</span>
                      <span>Full Scorecard</span>
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => editMatchInScorekeeper(match.roundNumber)}
                          className="py-2 px-2.5 bg-[#1b1b20] hover:bg-rose-600 text-rose-400 hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-rose-500/30 transition-all flex items-center gap-1 font-bold shadow-sm"
                          title={`Select Round #${match.roundNumber} to update its scores & chuckers in scorekeeper`}
                        >
                          <span className="material-symbols-outlined text-sm">edit_note</span>
                          <span>Update Score</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditScorers(match)}
                          className="py-2 px-2.5 bg-[#131317] hover:bg-[#2a292e] text-[#ac8889] hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-[#2a292e] transition-colors flex items-center gap-1"
                          title="Edit / attribute try scorers"
                        >
                          <span className="material-symbols-outlined text-sm">sports_rugby</span>
                          <span className="hidden sm:inline">Scorers</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Log Past Fixture Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1b1b1f] border border-[#353439] rounded-sm p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#2a292e] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">note_add</span>
                <h3 className="font-headline text-lg uppercase text-white">Log Past Fixture ({selectedYear})</h3>
              </div>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-[#ac8889] hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreatePastMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Round Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRoundNumber}
                    onChange={(e) => setNewRoundNumber(Number(e.target.value))}
                    required
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Match Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                  Pitch Location
                </label>
                <input
                  type="text"
                  value={newPitch}
                  onChange={(e) => setNewPitch(e.target.value)}
                  placeholder="Pitch 2 Floodlights"
                  required
                  className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-rose-400 mb-1 font-bold">
                    Team Red Tries
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newRedTries}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewRedTries(val);
                      if (val > newBlackTries) setNewSeriesWinner('RED');
                      else if (val < newBlackTries) setNewSeriesWinner('BLACK');
                      else setNewSeriesWinner('DRAW');
                    }}
                    required
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-white mb-1 font-bold">
                    Team Black Tries
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newBlackTries}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewBlackTries(val);
                      if (newRedTries > val) setNewSeriesWinner('RED');
                      else if (newRedTries < val) setNewSeriesWinner('BLACK');
                      else setNewSeriesWinner('DRAW');
                    }}
                    required
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                  Series Winner
                </label>
                <select
                  value={newSeriesWinner}
                  onChange={(e) => setNewSeriesWinner(e.target.value as 'RED' | 'BLACK' | 'DRAW')}
                  className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                >
                  <option value="RED">Team Red Victory</option>
                  <option value="BLACK">Team Black Victory</option>
                  <option value="DRAW">Match Drawn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                  Referee MVP Player
                </label>
                <select
                  value={newMvpPlayerId}
                  onChange={(e) => setNewMvpPlayerId(e.target.value)}
                  className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                >
                  <option value="">-- No MVP Selected --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.jerseyNumber} "{p.nickname}" ({p.fullName}) - {p.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                  MVP Citation / Referee Notes
                </label>
                <textarea
                  rows={2}
                  value={newMvpCitation}
                  onChange={(e) => setNewMvpCitation(e.target.value)}
                  placeholder="e.g. Scored 3 tries, outstanding link playmaking"
                  className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2a292e]">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 bg-[#2a292e] text-white font-headline text-xs uppercase rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow-md"
                >
                  Save to {selectedYear} Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Scorecard & Who Scored Modal */}
      {activeScorecardMatch && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#17171b] border border-rose-500/40 rounded-sm w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Printable/Exportable Scorecard Content Card */}
            <div ref={scorecardRef} className="bg-[#17171b] flex flex-col overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-[#0e0e12] border-b border-[#2a292e] p-4 sm:p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-rose-600/20 border border-rose-500/50 flex items-center justify-center text-rose-500 shrink-0">
                    <span className="material-symbols-outlined text-2xl">scoreboard</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-rose-600 text-white font-headline text-xs uppercase rounded-sm font-bold">
                        ROUND #{activeScorecardMatch.roundNumber}
                      </span>
                      <span className="font-mono text-xs text-rose-400 uppercase tracking-widest font-bold">
                        OFFICIAL MATCH SCORECARD
                      </span>
                      <span className="font-mono text-[11px] text-[#ac8889]">• {activeScorecardMatch.date || 'Wednesday Touch'}</span>
                    </div>
                    <span className="text-xs text-[#ac8889] mt-0.5">
                      {clubConfig.clubName} • {activeScorecardMatch.pitch} • Official Referee: {clubConfig.referee}
                    </span>
                  </div>
                </div>

                <button
                  data-no-export="true"
                  onClick={() => {
                    setActiveScorecardMatch(null);
                    setScorecardModalRound(null);
                    if (selectedMatchRound === activeScorecardMatch.roundNumber) {
                      setSelectedMatchRound(null);
                    }
                  }}
                  className="w-8 h-8 rounded-sm bg-[#1f1f23] hover:bg-rose-600 text-[#ac8889] hover:text-white flex items-center justify-center transition-colors"
                  title="Close Scorecard"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* Giant Series Result Banner */}
              <div className="bg-[#0e0e12] border border-[#2a292e] p-5 rounded-sm flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 via-rose-500 to-zinc-400"></div>

                <span className="font-mono text-[11px] uppercase tracking-widest text-rose-400 font-bold mb-1">
                  SERIES OUTCOME
                </span>

                <div className="flex items-center justify-center gap-6 my-2">
                  <div className="flex flex-col items-center">
                    <span className="font-headline text-lg sm:text-xl uppercase text-rose-500 font-bold">TEAM RED</span>
                    <span className="font-headline text-4xl sm:text-5xl text-rose-500 font-bold leading-none mt-1">
                      {activeScorecardMatch.redTotalTries}
                    </span>
                    <span className="font-mono text-[10px] text-[#ac8889] uppercase mt-1">Tries</span>
                  </div>

                  <div className="flex flex-col items-center px-4 py-2 bg-[#1b1b1f] border border-[#2a292e] rounded-sm">
                    <span className="font-headline text-2xl text-[#ac8889]">-</span>
                    <span className="font-mono text-xs uppercase text-white font-bold tracking-wider mt-1">
                      {activeScorecardMatch.seriesWinner === 'RED'
                        ? 'RED VICTORY'
                        : activeScorecardMatch.seriesWinner === 'BLACK'
                        ? 'BLACK VICTORY'
                        : 'HONOURS EVEN'}
                    </span>
                    <span className="font-mono text-[10px] text-[#ac8889]">
                      Chucker Score: {activeScorecardMatch.seriesScore}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="font-headline text-lg sm:text-xl uppercase text-zinc-300 font-bold">TEAM BLACK</span>
                    <span className="font-headline text-4xl sm:text-5xl text-white font-bold leading-none mt-1">
                      {activeScorecardMatch.blackTotalTries}
                    </span>
                    <span className="font-mono text-[10px] text-[#ac8889] uppercase mt-1">Tries</span>
                  </div>
                </div>

                <span className="font-mono text-xs text-[#ac8889] uppercase tracking-wider mt-2">
                  Total Match Tries: {activeScorecardMatch.redTotalTries + activeScorecardMatch.blackTotalTries} • 
                  Difference: {Math.abs(activeScorecardMatch.redTotalTries - activeScorecardMatch.blackTotalTries)}
                </span>
              </div>

              {/* 3 Chuckers breakdown */}
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-widest text-[#ac8889] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-rose-500">timer</span>
                  <span>CHUCKER-BY-CHUCKER BREAKDOWN</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activeScorecardMatch.chuckers.map((c) => (
                    <div
                      key={c.chuckerNumber}
                      className="bg-[#1b1b1f] p-3 rounded-sm border border-[#2a292e] flex flex-col items-center gap-1 text-center"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-sm bg-[#2a292e] text-rose-400 font-mono text-xs font-bold flex items-center justify-center">
                          C{c.chuckerNumber}
                        </span>
                        <span className="font-headline text-xs uppercase text-white">
                          CHUCKER {c.chuckerNumber} {c.chuckerNumber === 3 && '• DECIDER'}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 my-1">
                        <span className="font-headline text-2xl text-rose-500 font-bold">{c.redScore}</span>
                        <span className="text-[#ac8889] font-mono text-sm">-</span>
                        <span className="font-headline text-2xl text-white font-bold">{c.blackScore}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-headline uppercase rounded-sm font-bold ${
                            c.winner === 'RED'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                              : c.winner === 'BLACK'
                              ? 'bg-zinc-800 text-zinc-300 border border-zinc-600'
                              : 'bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          {c.winner} WIN
                        </span>
                        <span className="font-mono text-[10px] text-[#ac8889]">{c.elapsedTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complete Try Scorers (Who Scored) Roster Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#2a292e] pb-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-white font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-rose-500 text-base">sports_rugby</span>
                    <span>WHO SCORED • COMPLETE SQUAD TRY BREAKDOWN</span>
                  </span>
                  <button
                    data-no-export="true"
                    onClick={() => handleOpenEditScorers(activeScorecardMatch)}
                    className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Edit / Attribute Tries</span>
                  </button>
                </div>

                {(() => {
                  const redScorersList = Object.entries(activeScorecardMatch.redScorers || {})
                    .filter(([_, count]) => count > 0)
                    .map(([id, count]) => {
                      const p = players.find((pl) => pl.id === id);
                      return {
                        id,
                        name: p ? `"${p.nickname}" (${p.fullName})` : id,
                        nickname: p?.nickname || id,
                        tries: count,
                        jersey: p?.jerseyNumber,
                        position: p?.position || 'Touch Specialist',
                      };
                    });

                  const blackScorersList = Object.entries(activeScorecardMatch.blackScorers || {})
                    .filter(([_, count]) => count > 0)
                    .map(([id, count]) => {
                      const p = players.find((pl) => pl.id === id);
                      return {
                        id,
                        name: p ? `"${p.nickname}" (${p.fullName})` : id,
                        nickname: p?.nickname || id,
                        tries: count,
                        jersey: p?.jerseyNumber,
                        position: p?.position || 'Touch Specialist',
                      };
                    });

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Team Red Scorers Column */}
                      <div className="bg-[#141418] border border-rose-500/30 rounded-sm p-4 flex flex-col justify-between gap-3 shadow-md">
                        <div className="flex items-center justify-between border-b border-[#2a292e] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-600"></span>
                            <span className="font-headline text-sm uppercase text-rose-400 font-bold">
                              TEAM RED SCORERS
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-rose-600/20 text-rose-400 font-mono text-xs font-bold rounded border border-rose-500/30">
                            {activeScorecardMatch.redTotalTries} Tries Total
                          </span>
                        </div>

                        {redScorersList.length > 0 ? (
                          <div className="space-y-2">
                            {redScorersList.map((scorer, idx) => (
                              <div
                                key={idx}
                                className="bg-[#1b1b1f] p-2.5 rounded-sm border border-[#2a292e] flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-sm bg-[#0e0e12] border border-rose-500/40 text-rose-500 font-headline text-xs font-bold flex items-center justify-center shrink-0">
                                    {scorer.jersey ? `#${scorer.jersey}` : '🏉'}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-headline text-xs uppercase text-white truncate">
                                      {scorer.nickname}
                                    </span>
                                    <span className="font-mono text-[10px] text-[#ac8889] truncate">
                                      {scorer.position}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end shrink-0">
                                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-rose-400">
                                    <span>{scorer.tries}</span>
                                    <span>{scorer.tries === 1 ? 'try' : 'tries'}</span>
                                    <span className="text-sm">{'🏉'.repeat(Math.min(scorer.tries, 4))}</span>
                                  </div>
                                  <span className="font-mono text-[9px] text-[#ac8889]">
                                    {activeScorecardMatch.redTotalTries > 0
                                      ? `${Math.round((scorer.tries / activeScorecardMatch.redTotalTries) * 100)}% of team tries`
                                      : ''}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-[#ac8889] text-xs font-mono bg-[#1b1b1f] border border-dashed border-[#2a292e] rounded-sm p-4">
                            <span>No individual scorers assigned for Team Red yet.</span>
                            <div className="mt-2">
                              <button
                                data-no-export="true"
                                onClick={() => handleOpenEditScorers(activeScorecardMatch)}
                                className="px-3 py-1 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-xs font-headline uppercase rounded-sm transition-colors"
                              >
                                + Assign Red Scorers
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Team Black Scorers Column */}
                      <div className="bg-[#141418] border border-zinc-700 rounded-sm p-4 flex flex-col justify-between gap-3 shadow-md">
                        <div className="flex items-center justify-between border-b border-[#2a292e] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-zinc-400"></span>
                            <span className="font-headline text-sm uppercase text-zinc-300 font-bold">
                              TEAM BLACK SCORERS
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 font-mono text-xs font-bold rounded border border-zinc-700">
                            {activeScorecardMatch.blackTotalTries} Tries Total
                          </span>
                        </div>

                        {blackScorersList.length > 0 ? (
                          <div className="space-y-2">
                            {blackScorersList.map((scorer, idx) => (
                              <div
                                key={idx}
                                className="bg-[#1b1b1f] p-2.5 rounded-sm border border-[#2a292e] flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-sm bg-[#0e0e12] border border-zinc-600 text-white font-headline text-xs font-bold flex items-center justify-center shrink-0">
                                    {scorer.jersey ? `#${scorer.jersey}` : '🏉'}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-headline text-xs uppercase text-white truncate">
                                      {scorer.nickname}
                                    </span>
                                    <span className="font-mono text-[10px] text-[#ac8889] truncate">
                                      {scorer.position}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end shrink-0">
                                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-zinc-300">
                                    <span>{scorer.tries}</span>
                                    <span>{scorer.tries === 1 ? 'try' : 'tries'}</span>
                                    <span className="text-sm">{'🏉'.repeat(Math.min(scorer.tries, 4))}</span>
                                  </div>
                                  <span className="font-mono text-[9px] text-[#ac8889]">
                                    {activeScorecardMatch.blackTotalTries > 0
                                      ? `${Math.round((scorer.tries / activeScorecardMatch.blackTotalTries) * 100)}% of team tries`
                                      : ''}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-[#ac8889] text-xs font-mono bg-[#1b1b1f] border border-dashed border-[#2a292e] rounded-sm p-4">
                            <span>No individual scorers assigned for Team Black yet.</span>
                            <div className="mt-2">
                              <button
                                data-no-export="true"
                                onClick={() => handleOpenEditScorers(activeScorecardMatch)}
                                className="px-3 py-1 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-600 text-xs font-headline uppercase rounded-sm transition-colors"
                              >
                                + Assign Black Scorers
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Official Match MVP Citation */}
              {activeScorecardMatch.mvpPlayerId && (
                <div className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-rose-600 text-white rounded-sm flex items-center justify-center font-bold text-2xl shadow">
                      <span className="material-symbols-outlined text-2xl">star</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] uppercase text-rose-400 tracking-wider font-bold">
                        OFFICIAL REFEREE MVP RECOGNITION
                      </span>
                      {(() => {
                        const mvp = players.find((p) => p.id === activeScorecardMatch.mvpPlayerId);
                        return (
                          <>
                            <span className="font-headline text-base uppercase text-white font-bold">
                              {mvp ? `"${mvp.nickname}" (${mvp.fullName}) • #${mvp.jerseyNumber}` : 'Match MVP Player'}
                            </span>
                            <p className="text-xs text-[#ac8889] italic mt-0.5">
                              "{activeScorecardMatch.mvpCitation}"
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-xs uppercase tracking-wider rounded-sm font-bold shrink-0 self-start sm:self-auto">
                    Verified Award
                  </span>
                </div>
              )}

              {/* Card Bottom Watermark Banner for Exported Picture */}
              <div className="bg-[#0e0e12] border-t border-[#2a292e] p-3.5 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#ac8889] rounded-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="font-bold text-white uppercase">{clubConfig.clubName}</span>
                  <span className="text-[#ac8889]">• OFFICIAL TOUCH RUGBY ARCHIVE</span>
                </div>
                <span className="uppercase text-rose-400 font-bold">CYCLE #{activeScorecardMatch.roundNumber} • VERIFIED RESULT</span>
              </div>
            </div>
          </div>

            {/* Modal Footer (Excluded from Export) */}
            <div className="bg-[#0e0e12] border-t border-[#2a292e] p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPicture}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-headline text-xs uppercase tracking-wider rounded-sm shadow-md flex items-center gap-2 transition-all font-bold disabled:opacity-50 active:scale-95"
                title="Export scorecard as a picture to send on WhatsApp"
              >
                <span className="material-symbols-outlined text-base">
                  {isExporting ? 'hourglass_top' : 'photo_camera'}
                </span>
                <span>{isExporting ? 'Generating Picture...' : 'Export as Picture'}</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveScorecardMatch(null);
                        setScorecardModalRound(null);
                        editMatchInScorekeeper(activeScorecardMatch.roundNumber);
                      }}
                      className="px-3.5 py-2 bg-[#1f1f24] hover:bg-rose-600 text-rose-300 hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm flex items-center gap-1.5 border border-rose-500/30 transition-colors font-bold shadow-sm"
                      title="Open scorekeeper to update scores and chuckers for this round"
                    >
                      <span className="material-symbols-outlined text-sm">edit_note</span>
                      <span>Update Scores</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditScorers(activeScorecardMatch)}
                      className="px-3.5 py-2 bg-[#2a292e] hover:bg-[#353439] text-white font-headline text-xs uppercase tracking-wider rounded-sm flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm text-rose-400">sports_rugby</span>
                      <span>Edit Scorers</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveScorecardMatch(null);
                    setScorecardModalRound(null);
                    if (selectedMatchRound === activeScorecardMatch.roundNumber) {
                      setSelectedMatchRound(null);
                    }
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow-md transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Attribute Try Scorers Modal */}
      {editingScorersMatch && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b1b1f] border border-[#353439] rounded-sm p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2a292e] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">sports_rugby</span>
                <h3 className="font-headline text-lg uppercase text-white">
                  Edit Try Scorers • Round #{editingScorersMatch.roundNumber}
                </h3>
              </div>
              <button onClick={() => setEditingScorersMatch(null)} className="text-[#ac8889] hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveScorers} className="space-y-4">
              <p className="text-xs text-[#ac8889]">
                Distribute and assign individual tries scored in this fixture. Try counts will update individual player career records automatically.
              </p>

              {players.length === 0 ? (
                <div className="p-4 bg-[#141418] border border-dashed border-[#2a292e] text-center text-xs text-[#ac8889] rounded-sm">
                  No squad members registered yet. Please add players in the Availability Pool first to attribute tries by name.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Team Red Scorers Inputs */}
                  <div className="bg-[#141418] p-3 rounded-sm border border-rose-500/30 flex flex-col gap-2">
                    <span className="font-headline text-xs uppercase text-rose-400 font-bold border-b border-[#2a292e] pb-1">
                      Team Red Players ({Object.values(tempRedScorers).reduce((a, b) => a + b, 0)} Tries)
                    </span>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {players.map((p) => {
                        const tries = tempRedScorers[p.id] || 0;
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between bg-[#1b1b1f] p-2 rounded-sm border border-[#2a292e] text-xs"
                          >
                            <span className="text-white font-mono truncate max-w-[140px]">
                              #{p.jerseyNumber} "{p.nickname}"
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setTempRedScorers((prev) => ({
                                    ...prev,
                                    [p.id]: Math.max(0, (prev[p.id] || 0) - 1),
                                  }))
                                }
                                className="w-6 h-6 bg-[#2a292e] hover:bg-rose-600 text-white rounded font-bold flex items-center justify-center text-sm"
                              >
                                -
                              </button>
                              <span className="font-mono text-sm font-bold text-rose-400 w-5 text-center">
                                {tries}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setTempRedScorers((prev) => ({
                                    ...prev,
                                    [p.id]: (prev[p.id] || 0) + 1,
                                  }))
                                }
                                className="w-6 h-6 bg-[#2a292e] hover:bg-rose-600 text-white rounded font-bold flex items-center justify-center text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Team Black Scorers Inputs */}
                  <div className="bg-[#141418] p-3 rounded-sm border border-zinc-700 flex flex-col gap-2">
                    <span className="font-headline text-xs uppercase text-zinc-300 font-bold border-b border-[#2a292e] pb-1">
                      Team Black Players ({Object.values(tempBlackScorers).reduce((a, b) => a + b, 0)} Tries)
                    </span>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {players.map((p) => {
                        const tries = tempBlackScorers[p.id] || 0;
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between bg-[#1b1b1f] p-2 rounded-sm border border-[#2a292e] text-xs"
                          >
                            <span className="text-white font-mono truncate max-w-[140px]">
                              #{p.jerseyNumber} "{p.nickname}"
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setTempBlackScorers((prev) => ({
                                    ...prev,
                                    [p.id]: Math.max(0, (prev[p.id] || 0) - 1),
                                  }))
                                }
                                className="w-6 h-6 bg-[#2a292e] hover:bg-zinc-600 text-white rounded font-bold flex items-center justify-center text-sm"
                              >
                                -
                              </button>
                              <span className="font-mono text-sm font-bold text-zinc-300 w-5 text-center">
                                {tries}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setTempBlackScorers((prev) => ({
                                    ...prev,
                                    [p.id]: (prev[p.id] || 0) + 1,
                                  }))
                                }
                                className="w-6 h-6 bg-[#2a292e] hover:bg-zinc-600 text-white rounded font-bold flex items-center justify-center text-sm"
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
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2a292e]">
                <button
                  type="button"
                  onClick={() => setEditingScorersMatch(null)}
                  className="px-4 py-2 bg-[#2a292e] text-white font-headline text-xs uppercase rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow-md"
                >
                  Save Try Distribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
