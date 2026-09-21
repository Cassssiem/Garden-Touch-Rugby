using GTR.Domain.Entities;

namespace GTR.Application.Matches.Dtos
{
    public class MatchResponse
    {
        public Guid Id { get; set; }

        public DateOnly MatchDate { get; set; }

        public string Status { get; set; } = string.Empty;

        public Guid? MvpPlayerId { get; set; }

        public string? OverallWinner { get; set; }

        public DateTimeOffset? FinalisedAtUtc { get; set; }

        public int AvailablePlayerCount { get; set; }

        public int SelectedPlayerCount { get; set; }

        public IReadOnlyList<MatchPlayerResponse> SelectedPlayers
        {
            get;
            set;
        } = new List<MatchPlayerResponse>();

        public IReadOnlyList<ChuckerResultResponse> ChuckerResults
        {
            get;
            set;
        } = new List<ChuckerResultResponse>();

        public static MatchResponse FromEntity(Match match)
        {
            return new MatchResponse
            {
                Id = match.Id,
                MatchDate = match.MatchDate,
                Status = match.Status.ToString(),
                MvpPlayerId = match.MvpPlayerId,
                OverallWinner =
                    match.OverallWinner?.ToString(),
                FinalisedAtUtc = match.FinalisedAtUtc,

                AvailablePlayerCount =
                    match.PlayerAvailabilities.Count(
                        availability =>
                            availability.IsAvailable
                    ),

                SelectedPlayerCount =
                    match.MatchPlayers.Count,

                SelectedPlayers = match.MatchPlayers
                    .OrderBy(matchPlayer =>
                        matchPlayer.Team)
                    .ThenBy(matchPlayer =>
                        matchPlayer.Player?.Nickname)
                    .Select(
                        MatchPlayerResponse.FromEntity
                    )
                    .ToList(),

                ChuckerResults = match.ChuckerResults
                    .OrderBy(result =>
                        result.ChuckerNumber)
                    .Select(
                        ChuckerResultResponse.FromEntity
                    )
                    .ToList()
            };
        }
    }
}