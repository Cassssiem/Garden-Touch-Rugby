namespace RugbyManagementSystem.Application.DTOs.MatchPlayerDTOs
{
    public class MatchPLayerDTO
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int MatchId { get; set; }
        public string Opponent { get; set; } = string.Empty;
        public DateTime? MatchDate { get; set; }
        public int Tries { get; set; }
        public int Conversions { get; set; }

    }
}
