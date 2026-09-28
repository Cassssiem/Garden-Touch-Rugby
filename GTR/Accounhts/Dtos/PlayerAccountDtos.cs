namespace GTR.Application.Accounts.Dtos
{
    public class CreatePlayerAccountRequest
    {
        public Guid PlayerId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AccountResponse
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public Guid? PlayerId { get; set; }
    }
}