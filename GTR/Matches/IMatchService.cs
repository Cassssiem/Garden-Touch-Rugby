using GTR.Application.Matches.Dtos;

namespace GTR.Application.Matches
{
    public interface IMatchService
    {
        Task<IReadOnlyList<MatchResponse>> GetAllAsync(
            CancellationToken cancellationToken = default
        );

        Task<MatchResponse?> GetByIdAsync(
            Guid matchId,
            CancellationToken cancellationToken = default
        );

        Task<MatchResponse> CreateAsync(
            CreateMatchRequest request,
            CancellationToken cancellationToken = default
        );

        Task<MatchResponse> SetPlayerAvailabilityAsync(
            Guid matchId,
            SetPlayerAvailabilityRequest request,
            CancellationToken cancellationToken = default
        );

        Task<MatchResponse> AssignPlayerToTeamAsync(
            Guid matchId,
            Guid playerId,
            AssignPlayerToTeamRequest request,
            CancellationToken cancellationToken = default
        );

        Task<MatchResponse> SetPlayerTriesAsync(
            Guid matchId,
            Guid playerId,
            SetPlayerTriesRequest request,
            CancellationToken cancellationToken = default
        );

        Task<MatchResponse> SetChuckerWinnerAsync(
            Guid matchId,
            int chuckerNumber,
            SetChuckerWinnerRequest request,
            CancellationToken cancellationToken = default
        );

        Task<MatchResponse> SetMvpAsync(
            Guid matchId,
            SetMvpRequest request,
            CancellationToken cancellationToken = default
        );

        Task<MatchResponse> FinaliseAsync(
            Guid matchId,
            CancellationToken cancellationToken = default
        );


    }
}