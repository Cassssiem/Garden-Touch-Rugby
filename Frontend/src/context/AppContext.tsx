import React, { createContext, useContext, useState, useEffect } from 'react';
import { Player, Position, PlayerStatus, MatchResult, PhotoEntry, ClubConfig, UserAccount, UserRole } from '../types';

interface AppContextType {
  clubConfig: ClubConfig;
  setClubConfig: React.Dispatch<React.SetStateAction<ClubConfig>>;
  updateClubConfig: (updates: Partial<ClubConfig>) => void;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  activePage: string;
  setActivePage: (page: string) => void;
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;

  // Authentication & Member Approvals
  users: UserAccount[];
  currentUser: UserAccount | null;
  isSelector: boolean;
  canSelectLineup: boolean;
  toggleUserSelectorRole: (userId: string) => Promise<void>;
  login: (email: string, password?: string) => Promise<{ success: boolean; message: string }>;
  signup: (data: {
    email: string;
    password?: string;
    fullName: string;
    nickname: string;
    position: Position;
    jerseyNumber: string;
    notes?: string;
  }) => Promise<{ success: boolean; message: string }>;
  updateCurrentUserProfile: (profileData: {
    fullName?: string;
    nickname?: string;
    position?: Position;
    jerseyNumber?: string;
    notes?: string;
    roleSpecialty?: string;
    heightCm?: number;
    weightKg?: number;
    speedIndex?: number;
    avatarUrl?: string;
  }) => Promise<void>;
  logout: () => void;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string, reason?: string) => Promise<void>;
  pendingApprovalsCount: number;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'signup';
  setAuthModalMode: (mode: 'login' | 'signup') => void;
  switchUserDemo: (role: 'admin' | 'approved' | 'pending') => void;

  // Backend Integration
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  fetchBackendData: () => Promise<void>;
  
  // Player Actions
  addPlayer: (player: Omit<Player, 'id' | 'caps' | 'chuckersPlayed' | 'chuckersWon' | 'tries' | 'mvps'> & Partial<Player>) => Promise<void>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  togglePlayerStatus: (id: string) => void;
  setPlayerStatus: (id: string, status: PlayerStatus) => void;
  assignPlayerTeam: (id: string, team: 'red' | 'black' | 'pool', isSub?: boolean) => void;
  
  // Roster Draft Operations
  autoBalanceDraft: () => { parity: number; redScore: number; blackScore: number };
  resetDraft: () => void;
  lockRoster: () => void;
  
  // Results & History
  matchResults: MatchResult[];
  selectedMatchRound: number | null;
  setSelectedMatchRound: (round: number | null) => void;
  scorecardModalRound: number | null;
  setScorecardModalRound: (round: number | null) => void;
  viewMatchScorecard: (roundNumber: number) => void;
  editMatchInScorekeeper: (roundNumber: number) => void;
  adminDashboardTab: 'selection' | 'add-match' | 'update-match' | 'approvals' | 'selectors';
  setAdminDashboardTab: (tab: 'selection' | 'add-match' | 'update-match' | 'approvals' | 'selectors') => void;
  openAdminDashboard: (tab?: 'selection' | 'add-match' | 'update-match' | 'approvals' | 'selectors', roundNumber?: number) => void;
  updateMatchScorers: (roundNumber: number, redScorers: Record<string, number>, blackScorers: Record<string, number>) => void;
  recordMatchResult: (result: MatchResult) => Promise<void>;
  deleteMatchResult: (roundNumber: number) => Promise<void>;
  
  // Photo Gallery
  photos: PhotoEntry[];
  addPhoto: (photo: Omit<PhotoEntry, 'id' | 'likes'>) => void;
  likePhoto: (photoId: string) => void;
  deletePhoto: (photoId: string) => void;
  
  // Data Reset & Templates
  clearAllPlayers: () => void;
  clearAllGames: () => void;
  
  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const DEFAULT_CLUB_CONFIG: ClubConfig = {
  clubName: 'GARDENS RFC',
  tagline: 'TOUCH RUGBY • EST. 1879',
  establishedYear: '1879',
  matchdayCycle: 1,
  nextMatchdayDate: 'Wednesday 18:30 Kickoff',
  pitchLocation: 'Main Arena Lawn A • Pitch 2 Floodlights',
  referee: 'T. Harris (Grade 2)',
  kickoffTime: '18:30',
};

const DEFAULT_USERS: UserAccount[] = [];
const CLEAN_SLATE_VERSION = 'accounts-and-players-cleared-v1';

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5056').replace(/\/$/, '');

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (localStorage.getItem('touch_clean_slate_version') !== CLEAN_SLATE_VERSION) {
    localStorage.removeItem('touch_users_v2');
    localStorage.removeItem('touch_current_user_v2');
    localStorage.removeItem('touch_auth_token');
    localStorage.removeItem('touch_players_data_v2');
    localStorage.setItem('touch_clean_slate_version', CLEAN_SLATE_VERSION);
  }
  const [activePage, setActivePage] = useState<string>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedMatchRound, setSelectedMatchRound] = useState<number | null>(null);
  const [scorecardModalRound, setScorecardModalRound] = useState<number | null>(null);
  const [adminDashboardTab, setAdminDashboardTab] = useState<'selection' | 'add-match' | 'update-match' | 'approvals' | 'selectors'>('selection');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication & Member Approval State
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('touch_users_v2');
    if (!saved) return DEFAULT_USERS;
    try {
      const parsed: UserAccount[] = JSON.parse(saved);
      return parsed;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('touch_current_user_v2');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    localStorage.setItem('touch_users_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('touch_current_user_v2', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('touch_current_user_v2');
    }
  }, [currentUser]);

  const pendingApprovalsCount = users.filter((u) => u.status === 'PENDING').length;

  // Selector Permissions
  const isSelector = currentUser?.role === 'ADMIN' || currentUser?.role === 'SELECTOR' || !!currentUser?.isSelector;
  const canSelectLineup = isSelector;

  const toggleUserSelectorRole = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const nextIsSelector = !targetUser.isSelector;
    const nextRole: UserRole = targetUser.role === 'ADMIN' ? 'ADMIN' : (nextIsSelector ? 'SELECTOR' : 'MEMBER');

    let updatedUser: UserAccount = {
      ...targetUser,
      isSelector: nextIsSelector,
      role: nextRole,
    };

    if (backendUrl) {
      updatedUser = await apiRequest<UserAccount>(`/api/users/${encodeURIComponent(userId)}/selector`, {
        method: 'PATCH', body: JSON.stringify({ isSelector: nextIsSelector }),
      });
    }

    const updatedUsers = users.map((u) => (u.id === userId ? updatedUser : u));
    setUsers(updatedUsers);
    localStorage.setItem('touch_users_v2', JSON.stringify(updatedUsers));

    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
    }

    if (nextIsSelector) {
      showToast(`Role Granted: "${targetUser.nickname || targetUser.fullName}" is now a Lineup Selector!`);
    } else {
      showToast(`Role Revoked: "${targetUser.nickname || targetUser.fullName}" is no longer a Lineup Selector.`);
    }
  };

  // Backend API URL (configurable by user so their backend connects easily)
  const [backendUrl, setBackendUrlState] = useState<string>(() => {
    return localStorage.getItem('touch_backend_url') || DEFAULT_BACKEND_URL;
  });

  const setBackendUrl = (url: string) => {
    const normalized = url.trim().replace(/\/$/, '');
    setBackendUrlState(normalized);
    localStorage.setItem('touch_backend_url', normalized);
  };

  const apiRequest = async <T,>(path: string, options: RequestInit = {}, explicitBaseUrl?: string): Promise<T> => {
    const baseUrl = explicitBaseUrl || backendUrl || localStorage.getItem('touch_backend_url') || '';
    if (!baseUrl) throw new Error('No backend URL configured.');
    const token = localStorage.getItem('touch_auth_token');
    const headers = new Headers(options.headers);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const problem = await response.json();
        message = problem.detail || problem.title || problem.message || message;
      } catch { /* non-JSON error */ }
      if (response.status === 401) localStorage.removeItem('touch_auth_token');
      throw new Error(message);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  };

  // Club Config State
  const [clubConfig, setClubConfig] = useState<ClubConfig>(() => {
    const saved = localStorage.getItem('touch_club_config');
    return saved ? JSON.parse(saved) : DEFAULT_CLUB_CONFIG;
  });

  // NO HARDCODED PLAYERS: starts empty as requested by user, with duplicate key safety
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('touch_players_data_v2');
    if (!saved) return [];
    try {
      const parsed: Player[] = JSON.parse(saved);
      const seen = new Set<string>();
      return parsed.filter((p, idx) => {
        const id = p.id || `p-${idx}`;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    } catch {
      return [];
    }
  });

  // NO HARDCODED GAMES / MATCHES: starts empty as requested by user, with duplicate key safety
  const [matchResults, setMatchResults] = useState<MatchResult[]>(() => {
    const saved = localStorage.getItem('touch_match_results_v2');
    if (!saved) return [];
    try {
      const parsed: MatchResult[] = JSON.parse(saved);
      const seen = new Set<string>();
      return parsed.filter((m) => {
        const key = `${m.year || 2026}-${m.roundNumber}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch {
      return [];
    }
  });

  // NO HARDCODED PHOTOS: starts empty
  const [photos, setPhotos] = useState<PhotoEntry[]>(() => {
    const saved = localStorage.getItem('touch_gallery_photos_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('touch_club_config', JSON.stringify(clubConfig));
  }, [clubConfig]);

  useEffect(() => {
    localStorage.setItem('touch_players_data_v2', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('touch_match_results_v2', JSON.stringify(matchResults));
  }, [matchResults]);

  useEffect(() => {
    localStorage.setItem('touch_gallery_photos_v2', JSON.stringify(photos));
  }, [photos]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  // Optional backend data fetch if user specifies backendUrl
  const fetchBackendData = async () => {
    const baseUrl = backendUrl || localStorage.getItem('touch_backend_url') || '';
    if (!baseUrl) return;
    try {
      const [loadedPlayers, loadedMatches, loadedPhotos, loadedConfig] = await Promise.all([
        apiRequest<Player[]>('/api/players', {}, baseUrl),
        apiRequest<MatchResult[]>('/api/matches', {}, baseUrl),
        apiRequest<PhotoEntry[]>('/api/photos', {}, baseUrl),
        apiRequest<ClubConfig>('/api/club-config', {}, baseUrl),
      ]);
      setPlayers(loadedPlayers);
      setMatchResults(loadedMatches);
      setPhotos(loadedPhotos);
      setClubConfig(loadedConfig);
      if (localStorage.getItem('touch_auth_token')) {
        const me = await apiRequest<UserAccount>('/api/users/me', {}, baseUrl);
        setCurrentUser(me);
        if (me.role === 'ADMIN') setUsers(await apiRequest<UserAccount[]>('/api/users', {}, baseUrl));
      }
      showToast(`Backend connected: loaded ${loadedPlayers.length} players and ${loadedMatches.length} matches`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not reach backend; using local state');
    }
  };

  useEffect(() => {
    if (backendUrl) void fetchBackendData();
    // Load a previously configured backend once on application startup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateClubConfig = (updates: Partial<ClubConfig>) => {
    const updated = { ...clubConfig, ...updates };
    setClubConfig(updated);
    if (backendUrl) void apiRequest<ClubConfig>('/api/club-config', { method: 'PUT', body: JSON.stringify(updated) }).catch((e) => showToast(e.message));
    showToast('Club details updated');
  };

  const addPlayer = async (
    newPlayerData: Omit<Player, 'id' | 'caps' | 'chuckersPlayed' | 'chuckersWon' | 'tries' | 'mvps'> & Partial<Player>
  ) => {
    const newPlayer: Player = {
      ...newPlayerData,
      id: newPlayerData.id || 'p-' + Date.now(),
      caps: newPlayerData.caps ?? 0,
      chuckersPlayed: newPlayerData.chuckersPlayed ?? 0,
      chuckersWon: newPlayerData.chuckersWon ?? 0,
      tries: newPlayerData.tries ?? 0,
      mvps: newPlayerData.mvps ?? 0,
      roleSpecialty: newPlayerData.roleSpecialty || `${newPlayerData.position} Specialist`,
      status: newPlayerData.status || 'available',
      team: newPlayerData.team || 'pool',
      isSub: newPlayerData.isSub ?? false,
    };

    if (backendUrl) {
      try {
        const saved = await apiRequest<Player>('/api/players', {
          method: 'POST',
          body: JSON.stringify(newPlayer),
        });
        setPlayers((prev) => [saved, ...prev]);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Player could not be saved');
        throw error;
      }
    } else {
      setPlayers((prev) => [newPlayer, ...prev]);
    }

    showToast(`Player "${newPlayer.nickname}" added`);
  };

  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    const existing = players.find((p) => p.id === id);
    if (!existing) return;
    let updatedPlayer = { ...existing, ...updates };
    if (backendUrl) {
      try {
        updatedPlayer = await apiRequest<Player>(`/api/players/${encodeURIComponent(id)}`, {
          method: 'PUT', body: JSON.stringify(updatedPlayer),
        });
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Player update failed');
        throw error;
      }
    }
    setPlayers((prev) => prev.map((p) => (p.id === id ? updatedPlayer : p)));

    // Synchronize currentUser and users list if this is the active user's player profile
    setCurrentUser((prev) => {
      if (!prev || (prev.playerId !== id && prev.nickname?.toLowerCase() !== updates.nickname?.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        fullName: updates.fullName || prev.fullName,
        nickname: updates.nickname || prev.nickname,
        position: updates.position || prev.position,
        jerseyNumber: updates.jerseyNumber || prev.jerseyNumber,
      };
    });

    setUsers((prev) =>
      prev.map((u) => {
        if (u.playerId === id || (updates.nickname && u.nickname.toLowerCase() === updates.nickname.toLowerCase())) {
          return {
            ...u,
            fullName: updates.fullName || u.fullName,
            nickname: updates.nickname || u.nickname,
            position: updates.position || u.position,
            jerseyNumber: updates.jerseyNumber || u.jerseyNumber,
          };
        }
        return u;
      })
    );

    showToast('Player profile updated successfully');
  };

  const deletePlayer = async (id: string) => {
    if (backendUrl) {
      try {
        await apiRequest<void>(`/api/players/${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Player deletion failed');
        throw error;
      }
    }
    setPlayers((prev) => prev.filter((p) => p.id !== id));

    showToast('Player removed from roster');
  };

  const togglePlayerStatus = (id: string) => {
    const player = players.find((p) => p.id === id);
    if (!player) return;
    const cycle: Record<PlayerStatus, PlayerStatus> = { available: 'pending', pending: 'unavailable', unavailable: 'available' };
    void updatePlayer(id, { status: cycle[player.status] });
  };

  const setPlayerStatus = (id: string, status: PlayerStatus) => {
    void updatePlayer(id, { status });
  };

  const assignPlayerTeam = (id: string, team: 'red' | 'black' | 'pool', isSub?: boolean) => {
    const target = players.find((p) => p.id === id);
    if (!target) return;
    const teamStarters = players.filter((p) => p.id !== id && p.team === team && !p.isSub);
    const determinedIsSub = team === 'pool' ? false : (isSub !== undefined ? isSub : teamStarters.length >= 5);
    void updatePlayer(id, { team, isSub: determinedIsSub });
    const playerName = target.nickname || target.fullName;
    const teamLabel = team === 'pool' ? 'Reserve Pool' : team === 'red' ? 'Team Red ONLY' : 'Team Black ONLY';
    showToast(`${playerName} assigned to ${teamLabel}`);
  };

  // Draft Parity Auto-Balance Algorithm
  const autoBalanceDraft = () => {
    const availablePlayers = players.filter((p) => p.status === 'available');
    if (availablePlayers.length === 0) {
      showToast('No available players in pool to balance');
      return { parity: 100, redScore: 0, blackScore: 0 };
    }

    const sorted = [...availablePlayers].sort((a, b) => b.tries - a.tries);
    let redTries = 0;
    let blackTries = 0;
    const redAssigned: string[] = [];
    const blackAssigned: string[] = [];

    sorted.forEach((player) => {
      if (redAssigned.length >= 6 && blackAssigned.length >= 6) {
        return;
      }
      if (redAssigned.length >= 6) {
        blackAssigned.push(player.id);
        blackTries += player.tries;
      } else if (blackAssigned.length >= 6) {
        redAssigned.push(player.id);
        redTries += player.tries;
      } else if (redTries <= blackTries) {
        redAssigned.push(player.id);
        redTries += player.tries;
      } else {
        blackAssigned.push(player.id);
        blackTries += player.tries;
      }
    });

    const balancedPlayers: Player[] = players.map((p) => {
        const redIdx = redAssigned.indexOf(p.id);
        const blackIdx = blackAssigned.indexOf(p.id);
        if (redIdx !== -1) {
          return { ...p, team: 'red', isSub: redIdx === 5 };
        }
        if (blackIdx !== -1) {
          return { ...p, team: 'black', isSub: blackIdx === 5 };
        }
        return { ...p, team: 'pool', isSub: false };
      });
    setPlayers(balancedPlayers);
    if (backendUrl) void Promise.all(balancedPlayers.map((p) => apiRequest<Player>(`/api/players/${encodeURIComponent(p.id)}`, { method: 'PUT', body: JSON.stringify(p) })))
      .catch((error) => showToast(error instanceof Error ? error.message : 'Balanced roster could not be saved'));

    const total = redTries + blackTries;
    const diff = Math.abs(redTries - blackTries);
    const parity = total > 0 ? Number((100 - (diff / total) * 100).toFixed(1)) : 100;
    showToast(`Teams Auto-Balanced: Parity rating is ${parity}%!`);
    return { parity, redScore: redTries, blackScore: blackTries };
  };

  const resetDraft = () => {
    const resetPlayers = players.map((p) => ({ ...p, team: 'pool' as const, isSub: false }));
    setPlayers(resetPlayers);
    if (backendUrl) void Promise.all(resetPlayers.map((p) => apiRequest<Player>(`/api/players/${encodeURIComponent(p.id)}`, { method: 'PUT', body: JSON.stringify(p) })))
      .catch((error) => showToast(error instanceof Error ? error.message : 'Roster reset could not be saved'));
    showToast('Draft lineup reset to Available Pool');
  };

  const lockRoster = () => {
    if (backendUrl) void apiRequest('/api/rosters/current', {
      method: 'PUT',
      body: JSON.stringify({
        isLocked: true,
        redPlayerIds: players.filter((p) => p.team === 'red').map((p) => p.id),
        blackPlayerIds: players.filter((p) => p.team === 'black').map((p) => p.id),
      }),
    }).catch((error) => showToast(error instanceof Error ? error.message : 'Roster could not be locked'));
    showToast('Matchday rosters confirmed & locked for 3 Chuckers!');
  };

  const recordMatchResult = async (result: MatchResult) => {
    const computedYear =
      result.year ||
      (result.date && !isNaN(new Date(result.date).getFullYear())
        ? new Date(result.date).getFullYear()
        : 2026);
    const finalizedResult: MatchResult = {
      ...result,
      year: computedYear,
    };

    if (backendUrl) {
      try {
        await apiRequest<MatchResult>('/api/matches', { method: 'POST', body: JSON.stringify(finalizedResult) });
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Match could not be saved');
        throw error;
      }
    }

    let updatedMatches: MatchResult[];
    const existingIndex = matchResults.findIndex((m) => m.roundNumber === finalizedResult.roundNumber);
    const isUpdate = existingIndex >= 0;

    if (isUpdate) {
      updatedMatches = matchResults.map((m) =>
        m.roundNumber === finalizedResult.roundNumber ? finalizedResult : m
      );
    } else {
      updatedMatches = [finalizedResult, ...matchResults];
    }
    setMatchResults(updatedMatches);

    // Automatically update individual player career stats based on played matches
    const playedMatches = updatedMatches.filter((m) => m.isPlayed !== false && m.seriesScore !== 'TBA');
    setPlayers((prev) =>
      prev.map((p) => {
        const totalTries = playedMatches.reduce((sum, m) => {
          return sum + (m.redScorers?.[p.id] || 0) + (m.blackScorers?.[p.id] || 0);
        }, 0);

        const totalMvps = playedMatches.filter((m) => m.mvpPlayerId === p.id).length;

        const matchesInvolved = playedMatches.filter((m) => {
          const scored = (m.redScorers && m.redScorers[p.id] != null) || (m.blackScorers && m.blackScorers[p.id] != null);
          const isMvp = m.mvpPlayerId === p.id;
          return scored || isMvp;
        }).length;

        const caps = Math.max(p.caps, matchesInvolved);
        const chuckersPlayed = Math.max(p.chuckersPlayed, caps * 3);

        return {
          ...p,
          caps,
          chuckersPlayed,
          tries: totalTries,
          mvps: totalMvps,
        };
      })
    );

    if (finalizedResult.isPlayed === false || finalizedResult.seriesScore === 'TBA') {
      showToast(`Round #${finalizedResult.roundNumber} scheduled! Score set to TBA until matchday.`);
    } else if (isUpdate) {
      showToast(`Round #${finalizedResult.roundNumber} official scores updated & published!`);
    } else {
      showToast(`Round #${finalizedResult.roundNumber} (${computedYear}) Result Officially Verified and Saved!`);
    }
  };

  const deleteMatchResult = async (roundNumber: number) => {
    if (backendUrl) {
      try {
        await apiRequest<void>(`/api/matches/${roundNumber}`, { method: 'DELETE' });
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Match could not be deleted');
        throw error;
      }
    }
    const updated = matchResults.filter((m) => m.roundNumber !== roundNumber);
    setMatchResults(updated);

    // Recalculate player stats across remaining played matches
    const remainingPlayed = updated.filter((m) => m.isPlayed !== false && m.seriesScore !== 'TBA');
    setPlayers((prev) =>
      prev.map((p) => {
        const totalTries = remainingPlayed.reduce((sum, m) => {
          return sum + (m.redScorers?.[p.id] || 0) + (m.blackScorers?.[p.id] || 0);
        }, 0);
        const totalMvps = remainingPlayed.filter((m) => m.mvpPlayerId === p.id).length;
        const matchesInvolved = remainingPlayed.filter((m) => {
          const scored = (m.redScorers && m.redScorers[p.id] != null) || (m.blackScorers && m.blackScorers[p.id] != null);
          const isMvp = m.mvpPlayerId === p.id;
          return scored || isMvp;
        }).length;
        const caps = Math.max(0, matchesInvolved);
        return {
          ...p,
          caps,
          chuckersPlayed: caps * 3,
          tries: totalTries,
          mvps: totalMvps,
        };
      })
    );

    showToast(`Round ${roundNumber} match record removed`);
  };

  const viewMatchScorecard = (roundNumber: number) => {
    setScorecardModalRound(roundNumber);
    setActivePage('match-history');
  };

  const editMatchInScorekeeper = (roundNumber: number) => {
    setScorecardModalRound(null);
    setSelectedMatchRound(roundNumber);
    setAdminDashboardTab('update-match');
    setActivePage('admin-dashboard');
  };

  const openAdminDashboard = (tab: 'selection' | 'add-match' | 'update-match' | 'approvals' | 'selectors' = 'selection', roundNumber?: number) => {
    setScorecardModalRound(null);
    if (roundNumber != null) {
      setSelectedMatchRound(roundNumber);
    }
    setAdminDashboardTab(tab);
    setActivePage('admin-dashboard');
  };

  const updateMatchScorers = (
    roundNumber: number,
    redScorers: Record<string, number>,
    blackScorers: Record<string, number>
  ) => {
    const match = matchResults.find((m) => m.roundNumber === roundNumber);
    if (!match) return;
    const redTotal = Object.values(redScorers).reduce((a, b) => a + b, 0);
    const blackTotal = Object.values(blackScorers).reduce((a, b) => a + b, 0);
    const updatedMatch = {
      ...match,
      redScorers,
      blackScorers,
      redTotalTries: redTotal || match.redTotalTries,
      blackTotalTries: blackTotal || match.blackTotalTries,
    };
    setMatchResults((prev) =>
      prev.map((m) => m.roundNumber === roundNumber ? updatedMatch : m)
    );
    if (backendUrl) void apiRequest<MatchResult>('/api/matches', { method: 'POST', body: JSON.stringify(updatedMatch) })
      .catch((error) => showToast(error instanceof Error ? error.message : 'Scorers could not be saved'));
    showToast(`Try scorers updated for Round #${roundNumber}`);
  };

  const addPhoto = (newPhoto: Omit<PhotoEntry, 'id' | 'likes'>) => {
    const photo: PhotoEntry = {
      ...newPhoto,
      id: 'photo-' + Date.now(),
      likes: 1,
    };
    if (backendUrl) {
      void apiRequest<PhotoEntry>('/api/photos', { method: 'POST', body: JSON.stringify(photo) })
        .then((saved) => setPhotos((prev) => [saved, ...prev]))
        .catch((error) => showToast(error instanceof Error ? error.message : 'Photo could not be saved'));
    } else setPhotos((prev) => [photo, ...prev]);
    showToast('Action photo published to Profile & Highlight Reel');
  };

  const likePhoto = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, likes: p.likes + 1 } : p))
    );
    if (backendUrl) void apiRequest<PhotoEntry>(`/api/photos/${encodeURIComponent(photoId)}/like`, { method: 'POST' })
      .catch((error) => showToast(error instanceof Error ? error.message : 'Like could not be saved'));
  };

  const deletePhoto = (photoId: string) => {
    if (backendUrl) void apiRequest<void>(`/api/photos/${encodeURIComponent(photoId)}`, { method: 'DELETE' })
      .then(() => setPhotos((prev) => prev.filter((p) => p.id !== photoId)))
      .catch((error) => showToast(error instanceof Error ? error.message : 'Photo could not be deleted'));
    else setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    showToast('Photo removed from gallery');
  };

  const signup = async (data: {
    email: string;
    password?: string;
    fullName: string;
    nickname: string;
    position: Position;
    jerseyNumber: string;
    notes?: string;
  }) => {
    const cleanEmail = data.email.toLowerCase().trim();
    if (backendUrl) {
      try {
        const result = await apiRequest<{ token: string; user: UserAccount }>('/api/auth/register', {
          method: 'POST', body: JSON.stringify({ ...data, email: cleanEmail, password: data.password || 'player123' }),
        });
        localStorage.setItem('touch_auth_token', result.token);
        setCurrentUser(result.user);
        setUsers((prev) => [result.user, ...prev.filter((u) => u.id !== result.user.id)]);
        await fetchBackendData();
        showToast('Application submitted! Awaiting administrator approval.');
        return { success: true, message: 'Application submitted! Awaiting administrator approval.' };
      } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Registration failed.' };
      }
    }
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email is already registered.' };
    }

    const cleanNickname = data.nickname.trim() || data.fullName.split(' ')[0];
    const playerId = 'p-' + Date.now();

    const newPlayer: Player = {
      id: playerId,
      fullName: data.fullName.trim(),
      nickname: cleanNickname,
      position: data.position,
      jerseyNumber: data.jerseyNumber.trim() || '11',
      roleSpecialty: `${data.position} Specialist`,
      tacticalNotes: data.notes?.trim() || 'Registered squad member',
      status: 'pending',
      team: 'pool',
      caps: 0,
      chuckersPlayed: 0,
      chuckersWon: 0,
      tries: 0,
      mvps: 0,
      heightCm: 180,
      weightKg: 80,
      speedIndex: 8.5,
      memberSince: new Date().getFullYear().toString(),
    };

    const newUser: UserAccount = {
      id: 'usr-' + Date.now(),
      email: cleanEmail,
      password: data.password || 'player123',
      fullName: data.fullName.trim(),
      nickname: cleanNickname,
      role: 'MEMBER',
      status: 'PENDING', // PENDING APPROVAL! Admin must accept before being added!
      position: data.position,
      jerseyNumber: data.jerseyNumber.trim() || '11',
      notes: data.notes?.trim() || '',
      appliedAt: new Date().toISOString().split('T')[0],
      playerId: playerId,
    };

    setPlayers((prev) => [newPlayer, ...prev]);
    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    showToast(`Application submitted! Awaiting administrator approval before joining the squad.`);
    return { success: true, message: 'Application submitted! Awaiting administrator approval.' };
  };

  const updateCurrentUserProfile = async (profileData: {
    fullName?: string;
    nickname?: string;
    position?: Position;
    jerseyNumber?: string;
    notes?: string;
    roleSpecialty?: string;
    heightCm?: number;
    weightKg?: number;
    speedIndex?: number;
    avatarUrl?: string;
  }) => {
    if (!currentUser) return;

    let targetPlayerId = currentUser.playerId;
    const existingPlayer = players.find(
      (p) => p.id === targetPlayerId || (p.nickname && p.nickname.toLowerCase() === currentUser.nickname?.toLowerCase())
    );

    if (!existingPlayer) {
      targetPlayerId = targetPlayerId || ('p-' + Date.now());
      const createdPlayer: Player = {
        id: targetPlayerId,
        fullName: profileData.fullName || currentUser.fullName,
        nickname: profileData.nickname || currentUser.nickname,
        position: profileData.position || currentUser.position,
        jerseyNumber: profileData.jerseyNumber || currentUser.jerseyNumber,
        roleSpecialty: profileData.roleSpecialty || `${profileData.position || currentUser.position} Specialist`,
        tacticalNotes: profileData.notes || currentUser.notes || '',
        status: currentUser.status === 'APPROVED' ? 'available' : 'pending',
        team: 'pool',
        caps: 0,
        chuckersPlayed: 0,
        chuckersWon: 0,
        tries: 0,
        mvps: 0,
        heightCm: profileData.heightCm || 180,
        weightKg: profileData.weightKg || 80,
        speedIndex: profileData.speedIndex || 8.5,
        avatarUrl: profileData.avatarUrl,
        memberSince: new Date().getFullYear().toString(),
      };
      setPlayers((prev) => [createdPlayer, ...prev]);
    } else {
      targetPlayerId = existingPlayer.id;
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === targetPlayerId
            ? {
                ...p,
                fullName: profileData.fullName ?? p.fullName,
                nickname: profileData.nickname ?? p.nickname,
                position: profileData.position ?? p.position,
                jerseyNumber: profileData.jerseyNumber ?? p.jerseyNumber,
                roleSpecialty: profileData.roleSpecialty ?? p.roleSpecialty,
                tacticalNotes: profileData.notes ?? p.tacticalNotes,
                heightCm: profileData.heightCm ?? p.heightCm,
                weightKg: profileData.weightKg ?? p.weightKg,
                speedIndex: profileData.speedIndex ?? p.speedIndex,
                avatarUrl: profileData.avatarUrl ?? p.avatarUrl,
              }
            : p
        )
      );
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      fullName: profileData.fullName ?? currentUser.fullName,
      nickname: profileData.nickname ?? currentUser.nickname,
      position: profileData.position ?? currentUser.position,
      jerseyNumber: profileData.jerseyNumber ?? currentUser.jerseyNumber,
      notes: profileData.notes ?? currentUser.notes,
      playerId: targetPlayerId,
    };

    if (backendUrl) {
      const savedUser = await apiRequest<UserAccount>('/api/users/me', { method: 'PUT', body: JSON.stringify(updatedUser) });
      Object.assign(updatedUser, savedUser);
      if (targetPlayerId && existingPlayer) {
        const updatedPlayer = {
          ...existingPlayer,
          fullName: profileData.fullName ?? existingPlayer.fullName,
          nickname: profileData.nickname ?? existingPlayer.nickname,
          position: profileData.position ?? existingPlayer.position,
          jerseyNumber: profileData.jerseyNumber ?? existingPlayer.jerseyNumber,
          roleSpecialty: profileData.roleSpecialty ?? existingPlayer.roleSpecialty,
          tacticalNotes: profileData.notes ?? existingPlayer.tacticalNotes,
          heightCm: profileData.heightCm ?? existingPlayer.heightCm,
          weightKg: profileData.weightKg ?? existingPlayer.weightKg,
          speedIndex: profileData.speedIndex ?? existingPlayer.speedIndex,
          avatarUrl: profileData.avatarUrl ?? existingPlayer.avatarUrl,
        };
        await apiRequest<Player>(`/api/players/${encodeURIComponent(targetPlayerId)}`, { method: 'PUT', body: JSON.stringify(updatedPlayer) });
      }
    }

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    showToast('Your player profile was updated successfully!');
  };

  const login = async (identifier: string, password?: string) => {
    const cleanIdentifier = identifier.toLowerCase().trim();
    if (backendUrl) {
      try {
        const result = await apiRequest<{ token: string; user: UserAccount }>('/api/auth/login', {
          method: 'POST', body: JSON.stringify({ identifier: cleanIdentifier, password: password || '' }),
        });
        localStorage.setItem('touch_auth_token', result.token);
        setCurrentUser(result.user);
        if (result.user.role === 'ADMIN') setUsers(await apiRequest<UserAccount[]>('/api/users'));
        await fetchBackendData();
        showToast(`Welcome back, ${result.user.nickname}!`);
        return { success: true, message: 'Signed in successfully.' };
      } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Sign in failed.' };
      }
    }
    const found = users.find((u) =>
      u.email.toLowerCase() === cleanIdentifier || u.username?.toLowerCase() === cleanIdentifier
    );
    if (!found) {
      return { success: false, message: 'No registered user found with this email.' };
    }
    if (password && found.password && found.password !== password) {
      return { success: false, message: 'Incorrect password entered.' };
    }

    setCurrentUser(found);
    if (found.role === 'ADMIN') {
      showToast(`Logged in as Club Admin (${found.fullName})`);
    } else if (found.status === 'PENDING') {
      showToast(`Welcome, ${found.nickname}. Your application is currently under admin review.`);
    } else if (found.status === 'REJECTED') {
      showToast(`Notice: Your application was reviewed and not accepted.`);
    } else {
      showToast(`Welcome back, ${found.nickname}!`);
    }
    return { success: true, message: 'Signed in successfully.' };
  };

  const logout = () => {
    localStorage.removeItem('touch_auth_token');
    setCurrentUser(null);
    showToast('Signed out of club session.');
  };

  const approveUser = async (userId: string) => {
    const userToApprove = users.find((u) => u.id === userId);
    if (!userToApprove) return;

    if (backendUrl) {
      const approved = await apiRequest<UserAccount>(`/api/users/${encodeURIComponent(userId)}/approval`, {
        method: 'PATCH', body: JSON.stringify({ status: 'APPROVED' }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? approved : u)));
      await fetchBackendData();
      showToast(`Approved ${approved.fullName}! Added to official club players & roster.`);
      return;
    }

    let linkedPlayerId = userToApprove.playerId;
    if (!linkedPlayerId) {
      const existingPlayer = players.find(
        (p) =>
          p.fullName.toLowerCase() === userToApprove.fullName.toLowerCase() ||
          p.nickname.toLowerCase() === userToApprove.nickname.toLowerCase()
      );
      if (existingPlayer) {
        linkedPlayerId = existingPlayer.id;
      } else {
        linkedPlayerId = 'p-' + Date.now();
        await addPlayer({
          id: linkedPlayerId,
          fullName: userToApprove.fullName,
          nickname: userToApprove.nickname,
          position: userToApprove.position,
          jerseyNumber: userToApprove.jerseyNumber || '15',
          roleSpecialty: `${userToApprove.position} Specialist`,
          tacticalNotes: userToApprove.notes || 'Approved club member',
          status: 'available',
          team: 'pool',
          isSub: false,
          caps: 0,
          chuckersPlayed: 0,
          chuckersWon: 0,
          tries: 0,
          mvps: 0,
        });
      }
    }

    const updatedUser: UserAccount = {
      ...userToApprove,
      status: 'APPROVED',
      approvedAt: new Date().toISOString().split('T')[0],
      playerId: linkedPlayerId,
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
    }
    showToast(`Approved ${userToApprove.fullName}! Added to official club players & roster.`);
  };

  const rejectUser = async (userId: string) => {
    const userToReject = users.find((u) => u.id === userId);
    if (!userToReject) return;

    if (backendUrl) {
      const rejected = await apiRequest<UserAccount>(`/api/users/${encodeURIComponent(userId)}/approval`, {
        method: 'PATCH', body: JSON.stringify({ status: 'REJECTED' }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? rejected : u)));
      showToast(`Application for ${rejected.fullName} declined.`);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'REJECTED' } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
    }
    showToast(`Application for ${userToReject.fullName} declined.`);
  };

  const switchUserDemo = (role: 'admin' | 'approved' | 'pending') => {
    void role;
    showToast('Demo accounts have been removed. Please log in or sign up.');
  };

  const clearAllPlayers = () => {
    if (backendUrl) void apiRequest<void>('/api/players', { method: 'DELETE' }).catch((e) => showToast(e.message));
    setPlayers([]);
    setSelectedPlayerId(null);
    localStorage.removeItem('touch_players_data_v2');
    showToast('All players removed. Ready for your own backend data.');
  };

  const clearAllGames = () => {
    if (backendUrl) void apiRequest<void>('/api/matches', { method: 'DELETE' }).catch((e) => showToast(e.message));
    setMatchResults([]);
    localStorage.removeItem('touch_match_results_v2');
    showToast('All games and match records removed.');
  };

  return (
    <AppContext.Provider
      value={{
        clubConfig,
        setClubConfig,
        updateClubConfig,
        players,
        setPlayers,
        activePage,
        setActivePage,
        selectedPlayerId,
        setSelectedPlayerId,
        users,
        currentUser,
        isSelector,
        canSelectLineup,
        toggleUserSelectorRole,
        login,
        signup,
        updateCurrentUserProfile,
        logout,
        approveUser,
        rejectUser,
        pendingApprovalsCount,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        switchUserDemo,
        backendUrl,
        setBackendUrl,
        fetchBackendData,
        addPlayer,
        updatePlayer,
        deletePlayer,
        togglePlayerStatus,
        setPlayerStatus,
        assignPlayerTeam,
        autoBalanceDraft,
        resetDraft,
        lockRoster,
        matchResults,
        selectedMatchRound,
        setSelectedMatchRound,
        scorecardModalRound,
        setScorecardModalRound,
        viewMatchScorecard,
        editMatchInScorekeeper,
        adminDashboardTab,
        setAdminDashboardTab,
        openAdminDashboard,
        updateMatchScorers,
        recordMatchResult,
        deleteMatchResult,
        photos,
        addPhoto,
        likePhoto,
        deletePhoto,
        clearAllPlayers,
        clearAllGames,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
