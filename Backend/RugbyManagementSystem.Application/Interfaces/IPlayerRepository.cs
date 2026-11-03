using RugbyManagementSystem.Domain.Entities;
using RugbyManagementSystem.Application.DTOs.CreatePlayerDTOs;
using RugbyManagementSystem.Application.DTOs.UpdatePlayer;
using RugbyManagementSystem.Application.DTOs.PlayerDTOs;





namespace RugbyManagementSystem.Application.Interfaces
{
    public interface IPlayerRepository
    {
        Task<List<GetPlayerDTO>> GetAllAsync();
        Task<GetPlayerDTO?> GetPlayerByIdAsync(Guid id);
        Task<GetPlayerDTO> CreatePlayerAsync(GetPlayerDTO player);
        Task<GetPlayerDTO?> UpdatePlayerAsync(GetPlayerDTO player);
        Task<GetPlayerDTO?> DeletePlayerAsync(Guid id);
    }
}
