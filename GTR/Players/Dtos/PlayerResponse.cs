using GTR.Domain.Entities;
using GTR.Domain.Enums;

namespace GTR.Application.Players.Dtos
{
    public class PlayerResponse
    {
        public Guid Id { get; set; }

        public string FirstName { get; set; }
            = string.Empty;

        public string LastName { get; set; }
            = string.Empty;

        public string FullName { get; set; }
            = string.Empty;

        public string Nickname { get; set; }
            = string.Empty;

        public DateOnly? DateOfBirth { get; set; }

        public string? ImageUrl { get; set; }

        public string? Bio { get; set; }

        public bool IsActive { get; set; }

        public int Appearances { get; set; }

        public int TotalTries { get; set; }

        public int ChuckersWon { get; set; }

        public int MvpCount { get; set; }

        public static PlayerResponse FromEntity(Player player)
        {
            var completedSelections = player.MatchPlayers
                .Where(matchPlayer =>
                    matchPlayer.Match.Status
                    == MatchStatus.Completed)
                .ToList();

            var appearances = completedSelections.Count;

            var totalTries = completedSelections.Sum(
                matchPlayer => matchPlayer.Tries
            );

            var chuckersWon = completedSelections.Sum(
                matchPlayer =>
                    matchPlayer.Match.ChuckerResults.Count(
                        result =>
                            result.Winner
                            == matchPlayer.Team
                    )
            );

            var mvpCount = completedSelections.Count(
                matchPlayer =>
                    matchPlayer.Match.MvpPlayerId
                    == player.Id
            );

            return new PlayerResponse
            {
                Id = player.Id,
                FirstName = player.FirstName,
                LastName = player.LastName,
                FullName = player.FullName,
                Nickname = player.Nickname,
                DateOfBirth = player.DateOfBirth,
                ImageUrl = player.ImageUrl,
                Bio = player.Bio,
                IsActive = player.IsActive,
                Appearances = appearances,
                TotalTries = totalTries,
                ChuckersWon = chuckersWon,
                MvpCount = mvpCount
            };
        }
    }
}