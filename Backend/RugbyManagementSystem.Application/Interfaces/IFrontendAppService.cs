using RugbyManagementSystem.Application.DTOs.Frontend;

namespace RugbyManagementSystem.Application.Interfaces;

public interface IFrontendAppService
{
    Task EnsureDevelopmentAdminAsync(string username, string email, string password, string fullName);
    Task<List<FrontendPlayerDto>> GetPlayersAsync();
    Task<FrontendPlayerDto> CreatePlayerAsync(FrontendPlayerDto player);
    Task<FrontendPlayerDto?> UpdatePlayerAsync(string id, FrontendPlayerDto updates);
    Task<bool> DeletePlayerAsync(string id);
    Task ClearPlayersAsync();
    Task<List<FrontendMatchDto>> GetMatchesAsync();
    Task<FrontendMatchDto> UpsertMatchAsync(FrontendMatchDto match);
    Task<bool> DeleteMatchAsync(int roundNumber, int? year = null);
    Task ClearMatchesAsync();
    Task<List<FrontendPhotoDto>> GetPhotosAsync();
    Task<FrontendPhotoDto> AddPhotoAsync(FrontendPhotoDto photo);
    Task<FrontendPhotoDto?> LikePhotoAsync(string id);
    Task<bool> DeletePhotoAsync(string id);
    Task<FrontendClubConfigDto> GetClubConfigAsync();
    Task<FrontendClubConfigDto> SaveClubConfigAsync(FrontendClubConfigDto config);
    Task<List<FrontendUserDto>> GetUsersAsync();
    Task<FrontendUserDto?> GetUserAsync(string id);
    Task<FrontendUserDto?> AuthenticateAsync(string identifier, string password);
    Task<FrontendUserDto> RegisterAsync(RegisterRequestDto request);
    Task<FrontendUserDto?> UpdateUserAsync(string id, FrontendUserDto updates);
    Task<FrontendUserDto?> SetApprovalAsync(string id, string status);
    Task<FrontendUserDto?> SetSelectorAsync(string id, bool isSelector);
    Task<FrontendRosterDto> GetRosterAsync();
    Task<FrontendRosterDto> SaveRosterAsync(FrontendRosterDto roster);
}
