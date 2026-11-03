using Microsoft.EntityFrameworkCore;
using RugbyManagementSystem.Application.Interfaces;
using RugbyManagementSystem.Domain.Entities;
using RugbyManagementSystem.Domain.Enums;
using RugbyManagementSystem.Infastructure.Data;

namespace RugbyManagementSystem.Infastructure.Repository
{
    public class MatchPlayerRepository : IMatchPlayerRepository
    {
        private readonly AppDbContext _context;

        public MatchPlayerRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MatchPlayer?> GetPlayerMatchAsync(Guid playerId, int matchId)
        {
            return await _context.MatchPlayers
                .Include(mp => mp.Player)
                .Include(mp => mp.Match)
                .FirstOrDefaultAsync(mp => mp.PlayerId == playerId && mp.MatchId == matchId);
        }

        public async Task<MatchPlayer> AddPlayerToMatchAsync(MatchPlayer matchPlayer)
        {
            _context.MatchPlayers.Add(matchPlayer);
            await _context.SaveChangesAsync();
            return matchPlayer;
        }

        public async Task<MatchPlayer> UpdateAsync(MatchPlayer matchPlayer)
        {
            _context.MatchPlayers.Update(matchPlayer);
            await _context.SaveChangesAsync();
            return matchPlayer;
        }

        public async Task DeleteAsync(MatchPlayer matchPlayer)
        {
            _context.MatchPlayers.Remove(matchPlayer);
            await _context.SaveChangesAsync();
        }

        public async Task<List<MatchPlayer>> GetPlayersByMatchAsync(int matchId)
        {
            return await _context.MatchPlayers
                .Where(mp => mp.MatchId == matchId)
                .Include(mp => mp.Player)
                .Include(mp => mp.Match)
                .ToListAsync();
        }

        public async Task<List<MatchPlayer>> GetMatchesByPlayerAsync(Guid playerId)
        {
            return await _context.MatchPlayers
                .Where(mp => mp.PlayerId == playerId)
                .Include(mp => mp.Match)
                .Include(mp => mp.Player)
                .ToListAsync();
        }

        public async Task<List<MatchPlayer>> GetAllByPlayerIdAsync(Guid playerId)
        {
            return await _context.MatchPlayers
                .Where(mp => mp.PlayerId == playerId)
                .ToListAsync();
        }

        public async Task<List<MatchPlayer>> GetPlayersByTeamAsync(Teams team)
        {
            return await _context.MatchPlayers
                .Where(mp => mp.Match.Team == team)
                .Include(mp => mp.Player)
                .Include(mp => mp.Match)
                .ToListAsync();
        }
    }
}