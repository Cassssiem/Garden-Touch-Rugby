using RugbyManagementSystem.Application.DTOs.MatchDTOs;

namespace RugbyManagementSystem.Application.Interfaces
{
    public interface IMatchServices
    {
        Task<List<GetMatchDTO>> GetAllMatchesAsync();
        Task<GetMatchDTO?> GetMatchByIdAsync(int id);
        Task<GetMatchDTO> CreateMatchAsync(CreateMatchDTOs match);
        Task<GetMatchDTO?> UpdateMatchAsync(int id, UpdateMatchDTOs match);
        Task<GetMatchDTO?> DeleteMatchAsync(int id);
    }
}