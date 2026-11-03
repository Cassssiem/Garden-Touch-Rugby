using RugbyManagementSystem.Domain.Enums;

namespace RugbyManagementSystem.Application.DTOs.MatchPlayerDTOs
{
    public class AddMatchPlayerDTO
    {
        public PlayerPosition Position { get; set; }
        public int Tries { get; set; }
        public int Conversions { get; set; }
    }
}