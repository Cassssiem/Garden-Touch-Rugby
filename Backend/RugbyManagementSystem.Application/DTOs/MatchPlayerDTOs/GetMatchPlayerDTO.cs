using RugbyManagementSystem.Domain.Enums;

namespace RugbyManagementSystem.Application.DTOs.MatchPlayerDTOs
{
    public class GetMatchPLayerDTO
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int MatchId { get; set; }
        public string Opponent { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public Teams Team { get; set; }   // add this
        public PlayerPosition Position { get; set; }
        public int Tries { get; set; }
        public int Conversions { get; set; }
    }
}
