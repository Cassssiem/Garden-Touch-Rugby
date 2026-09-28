using GTR.Application.Matches;
using GTR.Application.Matches.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gardens_Touch_Rug.Controllers
{
    [Authorize]
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
        > GetAll(
            CancellationToken cancellationToken)
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

        [Authorize(Roles = "Selector,Admin")]
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

        // PLAYER SETS THEIR OWN AVAILABILITY
        // Player sets THEIR OWN availability. The player is taken from the login token,
        // so a player can never change someone else's.
        [Authorize(Roles = "Player")]
        [HttpPut("{matchId:guid}/availability/me")]
        public async Task<ActionResult<MatchResponse>> SetMyAvailability(
            Guid matchId,
            [FromBody] SetPlayerAvailabilityRequest request,
            CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(User.FindFirst("playerId")?.Value, out var playerId))
                return Unauthorized(new { message = "This login is not linked to a player." });

            try
            {
                var match = await _matchService.SetPlayerAvailabilityAsync(
                    matchId, playerId, request.IsAvailable, cancellationToken);
                return Ok(match);
            }
            catch (ArgumentException e) { return BadRequest(new { message = e.Message }); }
            catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
            catch (InvalidOperationException e) { return Conflict(new { message = e.Message }); }
        }

        // Selector/Admin sets availability on a player's behalf (optional fallback).
        [Authorize(Roles = "Selector,Admin")]
        [HttpPut("{matchId:guid}/players/{playerId:guid}/availability")]
        public async Task<ActionResult<MatchResponse>> SetPlayerAvailability(
            Guid matchId,
            Guid playerId,
            [FromBody] SetPlayerAvailabilityRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var match = await _matchService.SetPlayerAvailabilityAsync(
                    matchId, playerId, request.IsAvailable, cancellationToken);
                return Ok(match);
            }
            catch (ArgumentException e) { return BadRequest(new { message = e.Message }); }
            catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
            catch (InvalidOperationException e) { return Conflict(new { message = e.Message }); }
        }

        [Authorize(Roles = "Selector,Admin")]
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

        [Authorize(Roles = "Selector,Admin")]
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

        [Authorize(Roles = "Admin,Selector")]
        [HttpPut(
            "{matchId:guid}/chuckers/{chuckerNumber:int}"
        )]
        public async Task<ActionResult<MatchResponse>>
            SetChuckerWinner(
                Guid matchId,
                int chuckerNumber,
                [FromBody]
                SetChuckerWinnerRequest request,
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

        [Authorize(Roles = "Admin,Selector")]
        [HttpPut("{matchId:guid}/mvp")]
        public async Task<ActionResult<MatchResponse>>
            SetMvp(
                Guid matchId,
                [FromBody] SetMvpRequest request,
                CancellationToken cancellationToken)
        {
            try
            {
                var match =
                    await _matchService.SetMvpAsync(
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
        [Authorize(Roles = "Admin,Selector")]
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