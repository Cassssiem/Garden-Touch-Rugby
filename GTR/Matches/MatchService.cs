using GTR.Application.Abstractions.Repositories;
using GTR.Application.Matches.Dtos;
using GTR.Domain.Entities;
using GTR.Domain.Enums;

namespace GTR.Application.Matches
{
    public class MatchService : IMatchService
    {
        private readonly IMatchRepository _matchRepository;
        private readonly IPlayerRepository _playerRepository;

        public MatchService(
            IMatchRepository matchRepository,
            IPlayerRepository playerRepository)
        {
            _matchRepository = matchRepository;
            _playerRepository = playerRepository;
        }

        public async Task<IReadOnlyList<MatchResponse>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            var matches =
                await _matchRepository.GetAllAsync(
                    cancellationToken
                );

            return matches
                .Select(MatchResponse.FromEntity)
                .ToList();
        }

        public async Task<MatchResponse?> GetByIdAsync(
            Guid matchId,
            CancellationToken cancellationToken = default)
        {
            var match =
                await _matchRepository.GetWithDetailsAsync(
                    matchId,
                    cancellationToken
                );

            return match is null
                ? null
                : MatchResponse.FromEntity(match);
        }

        public async Task<MatchResponse> CreateAsync(
            CreateMatchRequest request,
            CancellationToken cancellationToken = default)
        {
            if (request.MatchDate == default)
            {
                throw new ArgumentException(
                    "Match date is required."
                );
            }

            if (request.MatchDate.DayOfWeek
                != DayOfWeek.Wednesday)
            {
                throw new ArgumentException(
                    "Touch rugby matches must be played " +
                    "on a Wednesday."
                );
            }

            var exists =
                await _matchRepository.ExistsOnDateAsync(
                    request.MatchDate,
                    cancellationToken
                );

            if (exists)
            {
                throw new InvalidOperationException(
                    "A match already exists for this date."
                );
            }

            var match = new Match
            {
                MatchDate = request.MatchDate
            };

            match.ChuckerResults.Add(
                new ChuckerResult
                {
                    ChuckerNumber = 1
                }
            );

            match.ChuckerResults.Add(
                new ChuckerResult
                {
                    ChuckerNumber = 2
                }
            );

            match.ChuckerResults.Add(
                new ChuckerResult
                {
                    ChuckerNumber = 3
                }
            );

            await _matchRepository.AddAsync(
                match,
                cancellationToken
            );

            await _matchRepository.SaveChangesAsync(
                cancellationToken
            );

            return MatchResponse.FromEntity(match);
        }

        public async Task<MatchResponse>
            SetPlayerAvailabilityAsync(
                Guid matchId,
                SetPlayerAvailabilityRequest request,
                CancellationToken cancellationToken = default)
        {
            if (request.PlayerId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Player ID is required."
                );
            }

            var match =
                await _matchRepository.GetWithDetailsAsync(
                    matchId,
                    cancellationToken
                );

            if (match is null)
            {
                throw new KeyNotFoundException(
                    "The match was not found."
                );
            }

            var player =
                await _playerRepository.GetByIdAsync(
                    request.PlayerId,
                    cancellationToken
                );

            if (player is null)
            {
                throw new KeyNotFoundException(
                    "The player was not found."
                );
            }

            if (!player.IsActive)
            {
                throw new InvalidOperationException(
                    "An inactive player cannot be added " +
                    "to the pool."
                );
            }

            match.SetPlayerAvailability(
                player.Id,
                request.IsAvailable
            );

            await _matchRepository.SaveChangesAsync(
                cancellationToken
            );

            return MatchResponse.FromEntity(match);
        }

        public async Task<MatchResponse>
            AssignPlayerToTeamAsync(
                Guid matchId,
                Guid playerId,
                AssignPlayerToTeamRequest request,
                CancellationToken cancellationToken = default)
        {
            if (matchId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Match ID is required."
                );
            }

            if (playerId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Player ID is required."
                );
            }

            if (!Enum.IsDefined(
                    typeof(Team),
                    request.Team))
            {
                throw new ArgumentException(
                    "A valid team is required."
                );
            }

            var match =
                await _matchRepository.GetWithDetailsAsync(
                    matchId,
                    cancellationToken
                );

            if (match is null)
            {
                throw new KeyNotFoundException(
                    "The match was not found."
                );
            }

            var player =
                await _playerRepository.GetByIdAsync(
                    playerId,
                    cancellationToken
                );

            if (player is null)
            {
                throw new KeyNotFoundException(
                    "The player was not found."
                );
            }

            if (!player.IsActive)
            {
                throw new InvalidOperationException(
                    "An inactive player cannot be selected."
                );
            }

            match.AssignPlayerToTeam(
                player,
                request.Team
            );

            await _matchRepository.SaveChangesAsync(
                cancellationToken
            );

            return MatchResponse.FromEntity(match);
        }

        public async Task<MatchResponse>
            SetPlayerTriesAsync(
                Guid matchId,
                Guid playerId,
                SetPlayerTriesRequest request,
                CancellationToken cancellationToken = default)
        {
            if (matchId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Match ID is required."
                );
            }

            if (playerId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Player ID is required."
                );
            }

            if (request.Tries < 0)
            {
                throw new ArgumentException(
                    "Tries cannot be negative."
                );
            }

            var match =
                await _matchRepository.GetWithDetailsAsync(
                    matchId,
                    cancellationToken
                );

            if (match is null)
            {
                throw new KeyNotFoundException(
                    "The match was not found."
                );
            }

            match.SetPlayerTries(
                playerId,
                request.Tries
            );

            await _matchRepository.SaveChangesAsync(
                cancellationToken
            );

            return MatchResponse.FromEntity(match);
        }
        public async Task<MatchResponse> SetChuckerWinnerAsync(
    Guid matchId,
    int chuckerNumber,
    SetChuckerWinnerRequest request,
    CancellationToken cancellationToken = default)
        {
            if (matchId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Match ID is required."
                );
            }

            if (chuckerNumber < 1 || chuckerNumber > 3)
            {
                throw new ArgumentException(
                    "Chucker number must be between 1 and 3."
                );
            }

            if (!Enum.IsDefined(
                    typeof(Team),
                    request.Winner))
            {
                throw new ArgumentException(
                    "A valid winning team is required."
                );
            }

            var match =
                await _matchRepository.GetWithDetailsAsync(
                    matchId,
                    cancellationToken
                );

            if (match is null)
            {
                throw new KeyNotFoundException(
                    "The match was not found."
                );
            }

            match.SetChuckerWinner(
                chuckerNumber,
                request.Winner
            );

            await _matchRepository.SaveChangesAsync(
                cancellationToken
            );

            return MatchResponse.FromEntity(match);
        }

        public async Task<MatchResponse> SetMvpAsync(
    Guid matchId,
    SetMvpRequest request,
    CancellationToken cancellationToken = default)
        {
            if (matchId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Match ID is required."
                );
            }

            if (request.PlayerId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Player ID is required."
                );
            }

            var match =
                await _matchRepository.GetWithDetailsAsync(
                    matchId,
                    cancellationToken
                );

            if (match is null)
            {
                throw new KeyNotFoundException(
                    "The match was not found."
                );
            }

            match.SetMvp(request.PlayerId);

            await _matchRepository.SaveChangesAsync(
                cancellationToken
            );

            return MatchResponse.FromEntity(match);
        }

        public async Task<MatchResponse> FinaliseAsync(
            Guid matchId,
            CancellationToken cancellationToken = default)
        {
            var match =
                await _matchRepository.GetWithDetailsAsync(
                    matchId,
                    cancellationToken
                );

            if (match is null)
            {
                throw new KeyNotFoundException(
                    "The match was not found."
                );
            }

            match.Finalise();

            await _matchRepository.SaveChangesAsync(
                cancellationToken
            );

            return MatchResponse.FromEntity(match);
        }
    }
}