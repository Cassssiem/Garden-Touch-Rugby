using GTR.Application.Abstractions.Security;
using GTR.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace GTR.Infrastructure.Authentication
{
    public class JwtTokenService : ITokenService
    {
        private readonly JwtOptions _options;

        public JwtTokenService(
            IOptions<JwtOptions> options)
        {
            _options = options.Value;
        }

        public (
            string Token,
            DateTimeOffset ExpiresAtUtc
        ) CreateToken(Account account)
        {
            var now = DateTimeOffset.UtcNow;

            var expiresAtUtc = now.AddMinutes(
                _options.ExpiryMinutes
            );

            var claims = new List<Claim>
            {
                new(
                    JwtRegisteredClaimNames.Sub,
                    account.Id.ToString()
                ),
                new(
                    JwtRegisteredClaimNames.Jti,
                    Guid.NewGuid().ToString()
                ),
                new(
                    ClaimTypes.NameIdentifier,
                    account.Id.ToString()
                ),
                new(
                    ClaimTypes.Name,
                    account.Username
                ),
                new(
                    ClaimTypes.Role,
                    account.Role.ToString()
                )
            };

            var keyBytes =
                Convert.FromBase64String(
                    _options.Key
                );

            var securityKey =
                new SymmetricSecurityKey(keyBytes);

            var credentials =
                new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.HmacSha256
                );

            var token = new JwtSecurityToken(
                issuer: _options.Issuer,
                audience: _options.Audience,
                claims: claims,
                notBefore: now.UtcDateTime,
                expires: expiresAtUtc.UtcDateTime,
                signingCredentials: credentials
            );

            var encodedToken =
                new JwtSecurityTokenHandler()
                    .WriteToken(token);

            return (
                encodedToken,
                expiresAtUtc
            );
        }
    }
}