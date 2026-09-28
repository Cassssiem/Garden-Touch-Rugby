using GTR.Application.Abstractions.Repositories;
using GTR.Domain.Entities;
using GTR.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GTR.Infrastructure.Repositories
{
    public class AccountRepository : IAccountRepository
    {
        private readonly AppDbContext _context;

        public AccountRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Account?>
            GetByNormalizedUsernameAsync(
                string normalizedUsername,
                CancellationToken cancellationToken = default)
        {
            return await _context.Accounts
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    account =>
                        account.NormalizedUsername
                        == normalizedUsername,
                    cancellationToken
                );
        }

        public async Task<bool> UsernameExistsAsync(
    string normalizedUsername,
    CancellationToken cancellationToken = default)
        {
            return await _context.Accounts.AnyAsync(
                account => account.NormalizedUsername == normalizedUsername,
                cancellationToken);
        }

        public async Task<bool> PlayerHasAccountAsync(
            Guid playerId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Accounts.AnyAsync(
                account => account.PlayerId == playerId,
                cancellationToken);
        }

        public async Task AddAsync(
            Account account,
            CancellationToken cancellationToken = default)
        {
            await _context.Accounts.AddAsync(account, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}