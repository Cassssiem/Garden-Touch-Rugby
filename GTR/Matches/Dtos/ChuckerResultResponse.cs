using GTR.Domain.Entities;

namespace GTR.Application.Matches.Dtos
{
    public class ChuckerResultResponse
    {
        public int ChuckerNumber { get; set; }

        public string? Winner { get; set; }

        public static ChuckerResultResponse FromEntity(
            ChuckerResult result)
        {
            return new ChuckerResultResponse
            {
                ChuckerNumber = result.ChuckerNumber,
                Winner = result.Winner?.ToString()
            };
        }
    }
}