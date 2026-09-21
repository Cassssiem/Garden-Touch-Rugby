using GTR.Application.Matches;
using GTR.Application.Matches.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace Gardens_Touch_Rugby.Controllers
{
    [ApiController]
    [Route("api/matches")]
    public class MatchesController : ControllerBase
    {
        private readonly IMatchService _matchService;

        public MatchesController(IMatchService matchService)
        {
            _matchService = matchService;
        }

        [HttpGet]
        public async Task<
            ActionResult<IReadOnlyList<MatchResponse>>
        > GetAll(CancellationToken cancellationToken)
        {
            var matches =
                await _matchService.GetAllAsync(
                    cancellationToken
                );

            return Ok(matches);
        }

        [HttpGet("{matchId:guid}")]
        public async Task<ActionResult<MatchResponse>>
            GetById(
                Guid matchId,
                CancellationToken cancellationToken)
        {
            var match =
                await _matchService.GetByIdAsync(
                    matchId,
                    cancellationToken
                );

            if (match is null)
            {
                return NotFound(new
                {
                    message = "The match was not found."
                });
            }

            return Ok(match);
        }

        [HttpPost]
        public async Task<ActionResult<MatchResponse>>
            Create(
                [FromBody] CreateMatchRequest request,
                CancellationToken cancellationToken)
        {
            try
            {
                var match =
                    await _matchService.CreateAsync(
                        request,
                        cancellationToken
                    );

                return CreatedAtAction(
                    nameof(GetById),
                    new { matchId = match.Id },
                    match
                );
            }
            catch (ArgumentException exception)
            {
                return BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new
                {
                    message = exception.Message
                });
            }
        }

        [HttpPut("{matchId:guid}/availability")]
        public async Task<ActionResult<MatchResponse>>
            SetAvailability(
                Guid matchId,
                [FromBody]
                SetPlayerAvailabilityRequest request,
                CancellationToken cancellationToken)
        {
            try
            {
                var match =
                    await _matchService
                        .SetPlayerAvailabilityAsync(
                            matchId,
                            request,
                            cancellationToken
                        );

                return Ok(match);
            }
            catch (ArgumentException exception)
            {
                return BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new
                {
                    message = exception.Message
                });
            }
        }

        [HttpPut(
            "{matchId:guid}/players/{playerId:guid}/team"
        )]
        public async Task<ActionResult<MatchResponse>>
            AssignPlayerToTeam(
                Guid matchId,
                Guid playerId,
                [FromBody]
                AssignPlayerToTeamRequest request,
                CancellationToken cancellationToken)
        {
            try
            {
                var match =
                    await _matchService
                        .AssignPlayerToTeamAsync(
                            matchId,
                            playerId,
                            request,
                            cancellationToken
                        );

                return Ok(match);
            }
            catch (ArgumentException exception)
            {
                return BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new
                {
                    message = exception.Message
                });
            }
        }

        [HttpPut(
            "{matchId:guid}/players/{playerId:guid}/tries"
        )]
        public async Task<ActionResult<MatchResponse>>
            SetPlayerTries(
                Guid matchId,
                Guid playerId,
                [FromBody]
                SetPlayerTriesRequest request,
                CancellationToken cancellationToken)
        {
            try
            {
                var match =
                    await _matchService.SetPlayerTriesAsync(
                        matchId,
                        playerId,
                        request,
                        cancellationToken
                    );

                return Ok(match);
            }
            catch (ArgumentException exception)
            {
                return BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new
                {
                    message = exception.Message
                });
            }
        }
        [HttpPut(
    "{matchId:guid}/chuckers/{chuckerNumber:int}"
)]
        public async Task<ActionResult<MatchResponse>>
    SetChuckerWinner(
        Guid matchId,
        int chuckerNumber,
        [FromBody] SetChuckerWinnerRequest request,
        CancellationToken cancellationToken)
        {
            try
            {
                var match =
                    await _matchService.SetChuckerWinnerAsync(
                        matchId,
                        chuckerNumber,
                        request,
                        cancellationToken
                    );

                return Ok(match);
            }
            catch (ArgumentException exception)
            {
                return BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new
                {
                    message = exception.Message
                });
            }
        }

        [HttpPut("{matchId:guid}/mvp")]
        public async Task<ActionResult<MatchResponse>> SetMvp(
    Guid matchId,
    [FromBody] SetMvpRequest request,
    CancellationToken cancellationToken)
        {
            try
            {
                var match = await _matchService.SetMvpAsync(
                    matchId,
                    request,
                    cancellationToken
                );

                return Ok(match);
            }
            catch (ArgumentException exception)
            {
                return BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new
                {
                    message = exception.Message
                });
            }
        }

        [HttpPost("{matchId:guid}/finalise")]
        public async Task<ActionResult<MatchResponse>>
            Finalise(
                Guid matchId,
                CancellationToken cancellationToken)
        {
            try
            {
                var match =
                    await _matchService.FinaliseAsync(
                        matchId,
                        cancellationToken
                    );

                return Ok(match);
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new
                {
                    message = exception.Message
                });
            }
        }
    }
}