using GTR.Domain.Entities;

namespace GTR.Application.Abstractions.Security
{
    public interface ITokenService
    {
        (string Token, DateTimeOffset ExpiresAtUtc)
            CreateToken(Account account);
    }
}