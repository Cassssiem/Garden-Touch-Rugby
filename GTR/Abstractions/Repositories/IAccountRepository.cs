using GTR.Domain.Entities;

namespace GTR.Application.Abstractions.Repositories
{
    public interface IAccountRepository
    {
        Task<Account?> GetByNormalizedUsernameAsync(
            string normalizedUsername,
            CancellationToken cancellationToken = default);

        Task<bool> UsernameExistsAsync(
            string normalizedUsername,
            CancellationToken cancellationToken = default);

        Task<bool> PlayerHasAccountAsync(
            Guid playerId,
            CancellationToken cancellationToken = default);

        Task AddAsync(
            Account account,
            CancellationToken cancellationToken = default);
    }
}