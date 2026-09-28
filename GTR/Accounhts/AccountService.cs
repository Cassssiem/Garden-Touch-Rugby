using GTR.Application.Abstractions.Repositories;
using GTR.Application.Accounts.Dtos;
using GTR.Domain.Entities;
using GTR.Domain.Enums;

namespace GTR.Application.Accounts
{
    public class AccountService : IAccountService
    {
        private readonly IAccountRepository _accounts;
        private readonly IPlayerRepository _players;

        public AccountService(IAccountRepository accounts, IPlayerRepository players)
        {
            _accounts = accounts;
            _players = players;
        }

        public async Task<AccountResponse> CreatePlayerAccountAsync(
            CreatePlayerAccountRequest request,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
                throw new ArgumentException("Username is required.");
            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                throw new ArgumentException("Password must be at least 8 characters.");
            if (request.PlayerId == Guid.Empty)
                throw new ArgumentException("Player ID is required.");

            var player = await _players.GetByIdAsync(request.PlayerId, cancellationToken)
                ?? throw new KeyNotFoundException("The player was not found.");

            if (await _accounts.PlayerHasAccountAsync(player.Id, cancellationToken))
                throw new InvalidOperationException("This player already has a login.");

            var username = request.Username.Trim();
            var normalized = username.ToUpperInvariant();

            if (await _accounts.UsernameExistsAsync(normalized, cancellationToken))
                throw new InvalidOperationException("That username is already taken.");

            var account = new Account
            {
                Username = username,
                NormalizedUsername = normalized,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
                Role = AccountRole.Player,
                PlayerId = player.Id,
                IsActive = true,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };

            await _accounts.AddAsync(account, cancellationToken);

            return new AccountResponse
            {
                Id = account.Id,
                Username = account.Username,
                Role = account.Role.ToString(),
                PlayerId = account.PlayerId
            };
        }
    }
}