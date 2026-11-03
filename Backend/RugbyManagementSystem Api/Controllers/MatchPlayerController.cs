using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RugbyManagementSystem.Application.DTOs.MatchPlayerDTOs;
using RugbyManagementSystem.Application.Interfaces;
using RugbyManagementSystem.Domain.Enums;

namespace RugbyManagementSystem_Api.Controllers
{
    [Route("api")]
    [ApiController]
    public class MatchPlayerController : ControllerBase
    {
        private readonly IMatchPlayerServices _matchPlayerServices;

        public MatchPlayerController(IMatchPlayerServices matchPlayerServices)
        {
            _matchPlayerServices = matchPlayerServices;
        }

        [HttpPost("matches/{matchId:int}/players/{playerId:guid}")]
        [Authorize(Roles = nameof(UserRoles.Admin))]
        public async Task<IActionResult> AddPlayerToMatch(int matchId, Guid playerId, AddMatchPlayerDTO dto)
        {
            var result = await _matchPlayerServices.AddPlayerToMatchAsync(playerId, matchId, dto);
            return CreatedAtAction(nameof(GetPlayerMatch), new { matchId, playerId }, result);
        }

        [HttpGet("players/{playerId:guid}/matches/{matchId:int}")]
        public async Task<ActionResult<GetMatchPLayerDTO>> GetPlayerMatch(Guid playerId, int matchId)
        {
            var playerMatch = await _matchPlayerServices.GetPlayerMatchAsync(playerId, matchId);
            if (playerMatch == null)
                return NotFound();
            return Ok(playerMatch);
        }

        [HttpGet("matches/{matchId:int}/players")]
        public async Task<IActionResult> GetPlayersByMatch(int matchId)
        {
            return Ok(await _matchPlayerServices.GetPlayersByMatchAsync(matchId));
        }

        [HttpGet("players/{playerId:guid}/matches")]
        public async Task<IActionResult> GetMatchesByPlayer(Guid playerId)
        {
            return Ok(await _matchPlayerServices.GetMatchesByPlayerAsync(playerId));
        }


        [HttpPut("matches/{matchId:int}/players/{playerId:guid}")]
        [Authorize(Roles = nameof(UserRoles.Admin))]
        public async Task<IActionResult> UpdatePlayerMatchStats(int matchId, Guid playerId, UpdateMatchPlayerDto dto)
        {
            if (matchId != dto.MatchId || playerId != dto.PlayerId)
                return BadRequest("Route parameters do not match the request body.");

            var result = await _matchPlayerServices.UpdatePlayerMatchStatsAsync(dto);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpDelete("matches/{matchId:int}/players/{playerId:guid}")]
        [Authorize(Roles = nameof(UserRoles.Admin))]
        public async Task<IActionResult> RemovePlayerFromMatch(int matchId, Guid playerId)
        {
            var removed = await _matchPlayerServices.RemovePlayerFromMatchAsync(playerId, matchId);
            if (!removed)
                return NotFound();

            return NoContent();
        }
    }
}