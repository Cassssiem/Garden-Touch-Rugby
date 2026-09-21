using GTR.Domain.Entities;

namespace GTR.Application.Abstractions.Repositories
{
    public interface IPlayerRepository
    {
        Task<IReadOnlyList<Player>> GetAllAsync(
            CancellationToken cancellationToken = default
        );

        Task<IReadOnlyList<Player>> GetAllWithStatsAsync(
            CancellationToken cancellationToken = default
        );

        Task<Player?> GetByIdAsync(
            Guid playerId,
            CancellationToken cancellationToken = default
        );

        Task<Player?> GetByIdWithStatsAsync(
            Guid playerId,
            CancellationToken cancellationToken = default
        );

        Task<bool> NicknameExistsAsync(
            string nickname,
            CancellationToken cancellationToken = default
        );

        Task AddAsync(
            Player player,
            CancellationToken cancellationToken = default
        );

        Task SaveChangesAsync(
            CancellationToken cancellationToken = default
        );
    }
}