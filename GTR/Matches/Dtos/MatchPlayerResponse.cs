using GTR.Domain.Entities;

namespace GTR.Application.Matches.Dtos
{
    public class MatchPlayerResponse
    {
        public Guid PlayerId { get; set; }

        public string FirstName { get; set; }
            = string.Empty;

        public string LastName { get; set; }
            = string.Empty;

        public string Nickname { get; set; }
            = string.Empty;

        public string? Team { get; set; }

        public int Tries { get; set; }

        public static MatchPlayerResponse FromEntity(
            MatchPlayer matchPlayer)
        {
            return new MatchPlayerResponse
            {
                PlayerId = matchPlayer.PlayerId,
                FirstName =
                    matchPlayer.Player?.FirstName
                    ?? string.Empty,
                LastName =
                    matchPlayer.Player?.LastName
                    ?? string.Empty,
                Nickname =
                    matchPlayer.Player?.Nickname
                    ?? string.Empty,
                Team = matchPlayer.Team?.ToString(),
                Tries = matchPlayer.Tries
            };
        }
    }
}