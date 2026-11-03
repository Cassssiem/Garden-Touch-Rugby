using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RugbyManagementSystem.Application.DTOs.MatchDTOs;
using RugbyManagementSystem.Application.Interfaces;

namespace RugbyManagementSystem_Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MatchController : ControllerBase
    {
        private readonly IMatchServices _matchServices;

        public MatchController(IMatchServices matchServices)
        {
            _matchServices = matchServices;
        }

        [HttpGet]
        public async Task<ActionResult<List<GetMatchDTO>>> GetAllMatches()
        {
            return Ok(await _matchServices.GetAllMatchesAsync());
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<GetMatchDTO>> GetMatchById(int id)
        {
            var match = await _matchServices.GetMatchByIdAsync(id);
            if (match == null)
                return NotFound();
            return Ok(match);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<GetMatchDTO>> CreateMatch(CreateMatchDTOs match)
        {
            var newMatch = await _matchServices.CreateMatchAsync(match);
            return CreatedAtAction(nameof(GetMatchById), new { id = newMatch.Id }, newMatch);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<GetMatchDTO>> UpdateMatch(int id, UpdateMatchDTOs match)
        {
            var updated = await _matchServices.UpdateMatchAsync(id, match);
            if (updated == null)
                return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteMatch(int id)
        {
            var result = await _matchServices.DeleteMatchAsync(id);
            if (result == null)
                return NotFound();
            return Ok("Match was deleted");
        }
    }
}