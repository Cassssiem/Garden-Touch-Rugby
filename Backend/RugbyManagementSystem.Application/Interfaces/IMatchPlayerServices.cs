using RugbyManagementSystem.Application.DTOs.MatchPlayerDTOs;
using RugbyManagementSystem.Domain.Entities;
using RugbyManagementSystem.Domain.Enums;

namespace RugbyManagementSystem.Application.Interfaces
{
    public interface IMatchPlayerServices
    {
        Task<MatchPlayer> AddPlayerToMatchAsync(Guid playerId, int matchId, AddMatchPlayerDTO dto);
        Task<MatchPlayer> UpdatePlayerMatchStatsAsync(UpdateMatchPlayerDto dto);
        Task<GetMatchPLayerDTO?> GetPlayerMatchAsync(Guid playerId, int matchId);
        Task<List<GetMatchPLayerDTO>> GetPlayersByMatchAsync(int matchId);
        Task<List<GetMatchPLayerDTO>> GetMatchesByPlayerAsync(Guid playerId);
        Task<List<GetMatchPLayerDTO>> GetPlayersByTeamAsync(Teams team);
        Task<bool> RemovePlayerFromMatchAsync(Guid playerId, int matchId);
    }
}