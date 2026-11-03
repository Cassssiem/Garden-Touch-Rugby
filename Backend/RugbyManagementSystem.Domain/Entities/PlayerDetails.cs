using RugbyManagementSystem.Domain.Enums;
using System;

namespace RugbyManagementSystem.Domain.Entities
{
    public class PlayerDetails
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string NickName { get; set; } = string.Empty;
        public int Age { get; set; }
        public PlayerPosition Position { get; set; }
        public int MatchesPlayed { get; set; }
        public int Tries { get; set; }
        public int Conversions { get; set; }
        public ICollection<MatchPlayer> MatchPlayers { get; set; } = new List<MatchPlayer>();
    }
}
