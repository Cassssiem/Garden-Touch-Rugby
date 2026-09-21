using GTR.Domain.Entities;

namespace GTR.Application.Abstractions.Repositories
{
    public interface IMatchRepository
    {
        Task<IReadOnlyList<Match>> GetAllAsync(
            CancellationToken cancellationToken = default
        );

        Task<Match?> GetWithDetailsAsync(
            Guid matchId,
            CancellationToken cancellationToken = default
        );

        Task<bool> ExistsOnDateAsync(
            DateOnly matchDate,
            CancellationToken cancellationToken = default
        );

        Task AddAsync(
            Match match,
            CancellationToken cancellationToken = default
        );

        Task SaveChangesAsync(
            CancellationToken cancellationToken = default
        );
    }
}