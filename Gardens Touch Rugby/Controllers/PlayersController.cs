using GTR.Application.Matches.Dtos;
using GTR.Application.Players;
using GTR.Application.Players.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace Gardens_Touch_Rugby.Controllers
{
    [ApiController]
    [Route("api/players")]
    public class PlayersController : ControllerBase
    {
        private readonly IPlayerService _playerService;

        public PlayersController(IPlayerService playerService)
        {
            _playerService = playerService;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<PlayerResponse>>> GetAll(
            CancellationToken cancellationToken)
        {
            var players = await _playerService.GetAllAsync(
                cancellationToken
            );

            return Ok(players);
        }

        [HttpGet("{playerId:guid}")]
        public async Task<ActionResult<PlayerResponse>> GetById(
            Guid playerId,
            CancellationToken cancellationToken)
        {
            var player = await _playerService.GetByIdAsync(
                playerId,
                cancellationToken
            );

            if (player is null)
            {
                return NotFound(new
                {
                    message = "The player was not found."
                });
            }

            return Ok(player);
        }
      
        [HttpPost]
        public async Task<ActionResult<PlayerResponse>> Create(
            [FromBody] CreatePlayerRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var player = await _playerService.CreateAsync(
                    request,
                    cancellationToken
                );

                return CreatedAtAction(
                    nameof(GetById),
                    new { playerId = player.Id },
                    player
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
    }
}