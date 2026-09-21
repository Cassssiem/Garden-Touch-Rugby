using GTR.Domain.Enums;

namespace GTR.Domain.Entities
{
    public class MatchPlayer
    {
        public Guid MatchId { get; set; }
        public Match Match { get; set; } = null!;

        public Guid PlayerId { get; set; }
        public Player Player { get; set; } = null!;

        public Team? Team { get; set; }

        public int Tries { get; set; }
    }
}