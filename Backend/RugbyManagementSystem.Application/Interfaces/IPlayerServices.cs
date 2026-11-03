

using RugbyManagementSystem.Application.DTOs.CreatePlayerDTOs;
using RugbyManagementSystem.Application.DTOs.PlayerDTOs;
using RugbyManagementSystem.Application.DTOs.UpdatePlayer;
using RugbyManagementSystem.Domain.Entities;

namespace RugbyManagementSystem.Application.Interfaces
{
    public interface IPlayerServices
    {
        Task<List<GetPlayerDTO>> GetAllPlayersAsync();
        Task<GetPlayerDTO?> GetPlayerByIdAsync(Guid playerId);
        Task<GetPlayerDTO> CreatePlayerAsync(CreatePlayerDTOs player);
        Task<GetPlayerDTO?> UpdatePlayerAsync(Guid playerId, UpdatePlayerDTOs player);
        Task<GetPlayerDTO?> DeletePlayerAsync(Guid playerId);
    }
}
