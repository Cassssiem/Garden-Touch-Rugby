namespace GTR.Application.Players.Dtos
{
    public class CreatePlayerRequest
    {
        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Nickname { get; set; } = string.Empty;

        public DateOnly? DateOfBirth { get; set; }

        public string? ImageUrl { get; set; }

        public string? Bio { get; set; }
    }
}