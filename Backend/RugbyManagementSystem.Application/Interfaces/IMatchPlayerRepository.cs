using RugbyManagementSystem.Domain.Entities;
using RugbyManagementSystem.Domain.Enums;

namespace RugbyManagementSystem.Application.Interfaces
{
    public interface IMatchPlayerRepository
    {
        Task<MatchPlayer?> GetPlayerMatchAsync(Guid playerId, int matchId);
        Task<MatchPlayer> AddPlayerToMatchAsync(MatchPlayer matchPlayer);
        Task<MatchPlayer> UpdateAsync(MatchPlayer matchPlayer);
        Task DeleteAsync(MatchPlayer matchPlayer);
        Task<List<MatchPlayer>> GetPlayersByMatchAsync(int matchId);
        Task<List<MatchPlayer>> GetMatchesByPlayerAsync(Guid playerId);
        Task<List<MatchPlayer>> GetAllByPlayerIdAsync(Guid playerId);
        Task<List<MatchPlayer>> GetPlayersByTeamAsync(Teams team);
    }
}