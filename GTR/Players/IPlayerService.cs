using GTR.Application.Players.Dtos;

namespace GTR.Application.Players
{
    public interface IPlayerService
    {
        Task<IReadOnlyList<PlayerResponse>> GetAllAsync(
            CancellationToken cancellationToken = default
        );

        Task<PlayerResponse?> GetByIdAsync(
            Guid playerId,
            CancellationToken cancellationToken = default
        );

        Task<PlayerResponse> CreateAsync(
            CreatePlayerRequest request,
            CancellationToken cancellationToken = default
        );
    }
}