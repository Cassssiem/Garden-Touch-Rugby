export type Position = 'MIDDLE' | 'LINK' | 'WING';
export type PlayerStatus = 'available' | 'pending' | 'unavailable';
export type AssignedTeam = 'red' | 'black' | 'pool';

export type UserRole = 'ADMIN' | 'MEMBER' | 'SELECTOR';
export type UserApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserAccount {
  id: string;
  username?: string;
  email: string;
  password?: string;
  fullName: string;
  nickname: string;
  role: UserRole;
  isSelector?: boolean; // Toggle option for Selector role (allows selecting lineup)
  status: UserApprovalStatus;
  position: Position;
  jerseyNumber: string;
  notes?: string;
  appliedAt: string;
  approvedAt?: string;
  playerId?: string; // Linked Player ID once approved
}

export interface Player {
  id: string;
  jerseyNumber: string;
  nickname: string;
  fullName: string;
  position: Position;
  secondaryPosition?: string;
  roleSpecialty: string;
  status: PlayerStatus;
  availabilityByDate?: Record<string, PlayerStatus>;
  team: AssignedTeam;
  isSub?: boolean;
  caps: number;
  chuckersPlayed: number;
  chuckersWon: number;
  tries: number;
  mvps: number;
  avatarUrl?: string;
  heightCm?: number;
  weightKg?: number;
  speedIndex?: number;
  memberSince?: string;
  tacticalNotes?: string;
  recentForm?: Array<{
    round: string;
    team: 'TEAM RED' | 'TEAM BLACK';
    result: 'W' | 'D' | 'L';
    score: string;
    tries: number;
    chuckersText: string;
    isMvp?: boolean;
    note?: string;
  }>;
}

export interface ChuckerScore {
  chuckerNumber: 1 | 2 | 3;
  redScore: number;
  blackScore: number;
  elapsedTime: string;
  winner: 'RED' | 'BLACK' | 'DRAW';
}

export interface MatchResult {
  roundNumber: number;
  date: string;
  year?: number;
  isPlayed?: boolean; // false when created and not played yet; true once played & scores saved
  formatNotes?: string;
  chuckers: [ChuckerScore, ChuckerScore, ChuckerScore];
  redTotalTries: number;
  blackTotalTries: number;
  seriesWinner: 'RED' | 'BLACK' | 'DRAW' | 'TBA';
  seriesScore: string;
  mvpPlayerId: string;
  mvpCitation: string;
  redScorers: Record<string, number>;
  blackScorers: Record<string, number>;
  redLineup?: string[]; // Player IDs selected for Team Red
  blackLineup?: string[]; // Player IDs selected for Team Black
  isFinalized?: boolean;
  finalizedAt?: string;
  correctionReason?: string;
}

export interface PhotoEntry {
  id: string;
  imageUrl: string;
  title: string;
  caption: string;
  fixture: string;
  photographer: string;
  taggedPlayerIds: string[];
  likes: number;
  isPinned?: boolean;
  date: string;
  tagCategory: 'tries' | 'huddle' | 'mvp' | 'all';
}

export interface ClubConfig {
  clubName: string;
  tagline: string;
  establishedYear: string;
  matchdayCycle: number;
  nextMatchdayDate: string;
  kickoffTime: string;
}
