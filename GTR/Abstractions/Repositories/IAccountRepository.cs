using GTR.Domain.Entities;

namespace GTR.Application.Abstractions.Repositories
{
    public interface IAccountRepository
    {
        Task<Account?> GetByNormalizedUsernameAsync(
            string normalizedUsername,
            CancellationToken cancellationToken = default
        );
    }
}