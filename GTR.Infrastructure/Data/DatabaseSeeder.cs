using GTR.Domain.Entities;
using GTR.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GTR.Infrastructure.Data
{
    public class DatabaseSeeder
    {
        private readonly AppDbContext _context;

        public DatabaseSeeder(AppDbContext context)
        {
            _context = context;
        }

        public async Task SeedAdminAsync(
            string? username,
            string? password,
            CancellationToken cancellationToken = default)
        {
            var adminExists =
                await _context.Accounts.AnyAsync(
                    account =>
                        account.Role == AccountRole.Admin,
                    cancellationToken
                );

            if (adminExists)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(username))
            {
                throw new InvalidOperationException(
                    "SeedAdmin:Username is missing."
                );
            }

            if (string.IsNullOrWhiteSpace(password) ||
                password.Length < 12)
            {
                throw new InvalidOperationException(
                    "SeedAdmin:Password must contain at least 12 characters."
                );
            }

            var cleanUsername = username.Trim();

            var account = new Account
            {
                Username = cleanUsername,
                NormalizedUsername =
                    cleanUsername.ToUpperInvariant(),
                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        password,
                        workFactor: 12
                    ),
                Role = AccountRole.Admin,
                IsActive = true,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };

            _context.Accounts.Add(account);

            await _context.SaveChangesAsync(
                cancellationToken
            );
        }
    }
}