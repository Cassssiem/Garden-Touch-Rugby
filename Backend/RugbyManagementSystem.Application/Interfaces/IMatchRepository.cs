using RugbyManagementSystem.Application.DTOs.MatchDTOs;

namespace RugbyManagementSystem.Application.Interfaces
{
    public interface IMatchRepository
    {
        Task<List<GetMatchDTO>> GetAllAsync();
        Task<GetMatchDTO?> GetMatchByIdAsync(int id);
        Task<GetMatchDTO> CreateMatchAsync(GetMatchDTO match);
        Task<GetMatchDTO?> UpdateMatchAsync(GetMatchDTO match);
        Task<GetMatchDTO?> DeleteMatchAsync(int id);
    }
}