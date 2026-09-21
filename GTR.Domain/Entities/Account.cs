using GTR.Domain.Enums;

namespace GTR.Domain.Entities
{
    public class Account
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Username { get; set; }
            = string.Empty;

        public string NormalizedUsername { get; set; }
            = string.Empty;

        public string PasswordHash { get; set; }
            = string.Empty;

        public AccountRole Role { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTimeOffset CreatedAtUtc { get; set; }
            = DateTimeOffset.UtcNow;
    }
}