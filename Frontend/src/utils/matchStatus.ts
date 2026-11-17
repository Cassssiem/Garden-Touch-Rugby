import { MatchResult } from '../types';

export const isMatchPending = (match: MatchResult) =>
  match.isPlayed === false || match.seriesScore === 'TBA';

export const isMatchOverdue = (match: MatchResult, now = new Date()) => {
  if (!isMatchPending(match) || !match.date) return false;

  const parts = match.date.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return false;

  const [year, month, day] = parts;
  const matchDay = new Date(year, month - 1, day);
  if (
    matchDay.getFullYear() !== year ||
    matchDay.getMonth() !== month - 1 ||
    matchDay.getDate() !== day
  ) return false;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return matchDay < today;
};

export const getPendingScoreDisplay = (match: MatchResult) =>
  isMatchOverdue(match) ? '0 - 0' : 'TBA';
