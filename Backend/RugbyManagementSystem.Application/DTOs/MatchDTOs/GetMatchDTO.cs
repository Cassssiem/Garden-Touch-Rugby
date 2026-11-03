using RugbyManagementSystem.Domain.Enums;

namespace RugbyManagementSystem.Application.DTOs.MatchDTOs
{
    public class GetMatchDTO
    {
        public int Id { get; set; }
        public string Opponent { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Location { get; set; } = string.Empty;
        public Teams Team { get; set; }
        public int Titans { get; set; }
        public int OpponentScore { get; set; }
    }
}
