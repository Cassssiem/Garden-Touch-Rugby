using GTR.Application.Abstractions.Repositories;
using GTR.Application.Abstractions.Security;
using GTR.Application.Auth.Dtos;

namespace GTR.Application.Auth
{
    public class AuthService : IAuthService
    {
        private readonly IAccountRepository _accountRepository;
        private readonly ITokenService _tokenService;

        public AuthService(
            IAccountRepository accountRepository,
            ITokenService tokenService)
        {
            _accountRepository = accountRepository;
            _tokenService = tokenService;
        }

        public async Task<LoginResponse> LoginAsync(
            LoginRequest request,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                throw new UnauthorizedAccessException(
                    "Invalid username or password."
                );
            }

            var normalizedUsername =
                request.Username.Trim().ToUpperInvariant();

            var account =
                await _accountRepository
                    .GetByNormalizedUsernameAsync(
                        normalizedUsername,
                        cancellationToken
                    );

            if (account is null || !account.IsActive)
            {
                throw new UnauthorizedAccessException(
                    "Invalid username or password."
                );
            }

            var passwordIsValid =
                BCrypt.Net.BCrypt.Verify(
                    request.Password,
                    account.PasswordHash
                );

            if (!passwordIsValid)
            {
                throw new UnauthorizedAccessException(
                    "Invalid username or password."
                );
            }

            var tokenResult =
                _tokenService.CreateToken(account);

            return new LoginResponse
            {
                AccessToken = tokenResult.Token,
                ExpiresAtUtc =
                    tokenResult.ExpiresAtUtc,
                Username = account.Username,
                Role = account.Role.ToString()
            };
        }
    }
}