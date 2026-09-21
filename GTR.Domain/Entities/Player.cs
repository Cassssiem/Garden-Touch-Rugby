using System;
using System.Collections.Generic;
using System.Text;

namespace GTR.Domain.Entities
{
    public class Player
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Nickname { get; set; } = string.Empty;

        public DateOnly? DateOfBirth { get; set; }

        public string? ImageUrl { get; set; }
        public string? Bio { get; set; }

        public bool IsActive { get; set; } = true;

        public string FullName => $"{FirstName} {LastName}".Trim();
        public ICollection<MatchPlayer> MatchPlayers { get; set; }
    = new List<MatchPlayer>();

        public ICollection<PlayerAvailability> AvailabilityRecords { get; set; }
    = new List<PlayerAvailability>();

    }
}
