namespace GTR.Application.Auth.Dtos
{
    public sealed class LoginResponse
    {
        public string AccessToken { get; init; }
            = string.Empty;

        public DateTimeOffset ExpiresAtUtc { get; init; }

        public string Username { get; init; }
            = string.Empty;

        public string Role { get; init; }
            = string.Empty;

        public Guid? PlayerId { get; init; }
    }
}