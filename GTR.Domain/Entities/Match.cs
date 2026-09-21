using GTR.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace GTR.Domain.Entities
{
    public class Match
    {
        private const int MaximumPlayersPerTeam = 9;
        public Guid Id { get; set; } = Guid.NewGuid();

        public DateOnly MatchDate { get; set; }

        public MatchStatus Status { get; set; }
            = MatchStatus.TeamSelection;

        public Guid? MvpPlayerId { get; set; }

        public Player? MvpPlayer { get; set; }

        public DateTimeOffset? FinalisedAtUtc { get; set; }

        public ICollection<MatchPlayer> MatchPlayers
        {
            get;
            set;
        } = new List<MatchPlayer>();

        public ICollection<PlayerAvailability>
            PlayerAvailabilities
        {
            get;
            set;
        } = new List<PlayerAvailability>();

        public ICollection<ChuckerResult> ChuckerResults
        {
            get;
            set;
        } = new List<ChuckerResult>();

        [NotMapped]
        public Team? OverallWinner =>
            CalculateOverallWinner();

        public void SetPlayerAvailability(
            Guid playerId,
            bool isAvailable)
        {
            if (Status == MatchStatus.Completed)
            {
                throw new InvalidOperationException(
                    "Availability cannot be changed after " +
                    "the match is completed."
                );
            }

            var existingAvailability =
                PlayerAvailabilities.FirstOrDefault(
                    record =>
                        record.PlayerId == playerId
                );

            var alreadyAvailable =
                existingAvailability?.IsAvailable == true;

            if (isAvailable && !alreadyAvailable)
            {
                var availableCount =
                    PlayerAvailabilities.Count(
                        record => record.IsAvailable
                    );

                if (availableCount >= 18)
                {
                    throw new InvalidOperationException(
                        "The player pool cannot contain " +
                        "more than 18 players."
                    );
                }
            }

            if (existingAvailability is null)
            {
                PlayerAvailabilities.Add(
                    new PlayerAvailability
                    {
                        MatchId = Id,
                        PlayerId = playerId,
                        IsAvailable = isAvailable,
                        UpdatedAtUtc =
                            DateTimeOffset.UtcNow
                    }
                );
            }
            else
            {
                existingAvailability.IsAvailable =
                    isAvailable;

                existingAvailability.UpdatedAtUtc =
                    DateTimeOffset.UtcNow;
            }

            if (!isAvailable)
            {
                var selectedPlayer =
                    MatchPlayers.FirstOrDefault(
                        matchPlayer =>
                            matchPlayer.PlayerId
                            == playerId
                    );

                if (selectedPlayer is not null)
                {
                    MatchPlayers.Remove(selectedPlayer);
                }
            }
        }

        public void AssignPlayerToTeam(
            Player player,
            Team team)
        {
            if (Status == MatchStatus.Completed)
            {
                throw new InvalidOperationException(
                    "Teams cannot be changed after the " +
                    "match is completed."
                );
            }

            if (player.Id == Guid.Empty)
            {
                throw new ArgumentException(
                    "Player ID is required."
                );
            }

            if (!Enum.IsDefined(typeof(Team), team))
            {
                throw new ArgumentException(
                    "A valid team is required."
                );
            }

            var availability =
                PlayerAvailabilities.FirstOrDefault(
                    record =>
                        record.PlayerId == player.Id
                );

            if (availability is null
                || !availability.IsAvailable)
            {
                throw new InvalidOperationException(
                    "The player must be available before " +
                    "being assigned to a team."
                );
            }

            var existingSelection =
                MatchPlayers.FirstOrDefault(
                    matchPlayer =>
                        matchPlayer.PlayerId == player.Id
                );

            if (existingSelection?.Team == team)
            {
                return;
            }

            var playersAlreadyInTeam =
                MatchPlayers.Count(
                    matchPlayer =>
                        matchPlayer.Team == team
                        && matchPlayer.PlayerId != player.Id
                );

            if (playersAlreadyInTeam
                >= MaximumPlayersPerTeam)
            {
                throw new InvalidOperationException(
                    $"{team} cannot contain more than " +
                    $"{MaximumPlayersPerTeam} players."
                );
            }

            if (existingSelection is null)
            {
                MatchPlayers.Add(
                    new MatchPlayer
                    {
                        MatchId = Id,
                        PlayerId = player.Id,
                        Player = player,
                        Team = team,
                        Tries = 0
                    }
                );

                return;
            }

            existingSelection.Team = team;
            existingSelection.Player = player;
        }

        public void SetPlayerTries(
            Guid playerId,
            int tries)
        {
            if (Status == MatchStatus.Completed)
            {
                throw new InvalidOperationException(
                    "Tries cannot be changed after the " +
                    "match is completed."
                );
            }

            if (tries < 0)
            {
                throw new ArgumentException(
                    "Tries cannot be negative."
                );
            }

            var selectedPlayer =
                MatchPlayers.FirstOrDefault(
                    matchPlayer =>
                        matchPlayer.PlayerId == playerId
                );

            if (selectedPlayer is null)
            {
                throw new InvalidOperationException(
                    "The player must be selected before " +
                    "tries can be recorded."
                );
            }

            if (selectedPlayer.Team is null)
            {
                throw new InvalidOperationException(
                    "The player must be assigned to a team " +
                    "before tries can be recorded."
                );
            }

            selectedPlayer.Tries = tries;
        }

        public void SetChuckerWinner(
    int chuckerNumber,
    Team winner)
        {
            if (Status == MatchStatus.Completed)
            {
                throw new InvalidOperationException(
                    "Chucker results cannot be changed after " +
                    "the match is completed."
                );
            }

            if (chuckerNumber < 1 || chuckerNumber > 3)
            {
                throw new ArgumentException(
                    "Chucker number must be between 1 and 3."
                );
            }

            if (!Enum.IsDefined(typeof(Team), winner))
            {
                throw new ArgumentException(
                    "A valid winning team is required."
                );
            }

            var teamHasPlayers = MatchPlayers.Any(
                matchPlayer => matchPlayer.Team == winner
            );

            if (!teamHasPlayers)
            {
                throw new InvalidOperationException(
                    $"{winner} does not have any selected players."
                );
            }

            var chucker = ChuckerResults.FirstOrDefault(
                result =>
                    result.ChuckerNumber == chuckerNumber
            );

            if (chucker is null)
            {
                throw new InvalidOperationException(
                    $"Chucker {chuckerNumber} does not exist."
                );
            }

            chucker.Winner = winner;
        }

        public void SetMvp(Guid playerId)
        {
            if (Status == MatchStatus.Completed)
            {
                throw new InvalidOperationException(
                    "The MVP cannot be changed after the match is completed."
                );
            }

            if (playerId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Player ID is required."
                );
            }

            var playerWasSelected = MatchPlayers.Any(
                matchPlayer => matchPlayer.PlayerId == playerId
            );

            if (!playerWasSelected)
            {
                throw new InvalidOperationException(
                    "The MVP must be one of the selected players."
                );
            }

            MvpPlayerId = playerId;
        }

        public Team? CalculateOverallWinner()
        {
            var completedChuckers =
                ChuckerResults
                    .Where(result =>
                        result.Winner.HasValue)
                    .ToList();

            if (completedChuckers.Count != 3)
            {
                return null;
            }

            var teamAWins =
                completedChuckers.Count(
                    result =>
                        result.Winner == Team.Red
                );

            var teamBWins =
                completedChuckers.Count(
                    result =>
                        result.Winner == Team.Black
                );

            if (teamAWins >= 2)
            {
                return Team.Red;
            }

            if (teamBWins >= 2)
            {
                return Team.Black;
            }

            return null;
        }

        public void Finalise()
        {
            if (Status == MatchStatus.Completed)
            {
                throw new InvalidOperationException(
                    "The match has already been finalised."
                );
            }

            ValidateTeams();
            ValidateChuckerResults();
            ValidateMvp();

            if (CalculateOverallWinner() is null)
            {
                throw new InvalidOperationException(
                    "An overall winner could not be " +
                    "calculated."
                );
            }

            Status = MatchStatus.Completed;
            FinalisedAtUtc = DateTimeOffset.UtcNow;
        }

        private void ValidateTeams()
        {
            if (MatchPlayers.Count == 0)
            {
                throw new InvalidOperationException(
                    "The match does not have any selected " +
                    "players."
                );
            }

            if (MatchPlayers.Any(
                    player => player.Team is null))
            {
                throw new InvalidOperationException(
                    "Every selected player must be assigned " +
                    "to a team."
                );
            }

            var hasTeamA =
                MatchPlayers.Any(
                    player =>
                        player.Team == Team.Red
                );

            var hasTeamB =
                MatchPlayers.Any(
                    player =>
                        player.Team == Team.Black
                );

            if (!hasTeamA || !hasTeamB)
            {
                throw new InvalidOperationException(
                    "The match must have players in both " +
                    "teams."
                );
            }

            if (MatchPlayers.Any(
                    player => player.Tries < 0))
            {
                throw new InvalidOperationException(
                    "A player's tries cannot be negative."
                );
            }
        }

        private void ValidateChuckerResults()
        {
            var numbers =
                ChuckerResults
                    .Select(result =>
                        result.ChuckerNumber)
                    .OrderBy(number => number)
                    .ToList();

            var requiredNumbers =
                new List<int>
                {
                    1,
                    2,
                    3
                };

            if (!numbers.SequenceEqual(requiredNumbers))
            {
                throw new InvalidOperationException(
                    "The match must contain chuckers " +
                    "1, 2 and 3."
                );
            }

            if (ChuckerResults.Any(
                    result => result.Winner is null))
            {
                throw new InvalidOperationException(
                    "Every chucker must have a winning team."
                );
            }
        }

        private void ValidateMvp()
        {
            if (MvpPlayerId is null)
            {
                throw new InvalidOperationException(
                    "An MVP must be selected before " +
                    "finalising."
                );
            }

            var mvpPlayed =
                MatchPlayers.Any(
                    player =>
                        player.PlayerId
                        == MvpPlayerId.Value
                );

            if (!mvpPlayed)
            {
                throw new InvalidOperationException(
                    "The MVP must be one of the selected " +
                    "players."
                );
            }
        }
    }
}