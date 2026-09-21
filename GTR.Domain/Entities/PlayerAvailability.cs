namespace GTR.Domain.Entities
{
    public class PlayerAvailability
    {

        public Guid MatchId { get; set; }

        public Match Match { get; set; } = null!;

        public Guid PlayerId { get; set; }

        public Player Player { get; set; } = null!;

        public bool IsAvailable { get; set; }

        public DateTimeOffset UpdatedAtUtc { get; set; }
            = DateTimeOffset.UtcNow;
    }
}