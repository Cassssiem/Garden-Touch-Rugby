using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RugbyManagementSystem.Application.DTOs.Frontend;
using RugbyManagementSystem.Application.Interfaces;
using RugbyManagementSystem.Application.Services;

namespace RugbyManagementSystem_Api.Controllers;

[ApiController]
[Route("api/players")]
public sealed class FrontendPlayersController(IFrontendAppService service) : ControllerBase
{
    [HttpGet] public async Task<ActionResult<List<FrontendPlayerDto>>> Get() => Ok(await service.GetPlayersAsync());

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<FrontendPlayerDto>> Create(FrontendPlayerDto player)
    {
        var created = await service.CreatePlayerAsync(player);
        return Created($"/api/players/{created.Id}", created);
    }

    [HttpPut("{id}"), Authorize]
    public async Task<ActionResult<FrontendPlayerDto>> Update(string id, FrontendPlayerDto player)
    {
        var existing = (await service.GetPlayersAsync()).FirstOrDefault(x => x.Id == id);
        if (existing is null) return NotFound();
        var availabilityChanged = !existing.AvailabilityByDate.OrderBy(x => x.Key)
            .SequenceEqual(player.AvailabilityByDate.OrderBy(x => x.Key)) || existing.Status != player.Status;
        if (availabilityChanged && !User.IsInRole("Admin")) return Forbid();

        if (!User.IsInRole("Admin") && !User.IsInRole("SELECTOR"))
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = string.IsNullOrWhiteSpace(userId) ? null : await service.GetUserAsync(userId);
            if (user?.PlayerId != id) return Forbid();
        }
        var updated = await service.UpdatePlayerAsync(id, player);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(string id) => await service.DeletePlayerAsync(id) ? NoContent() : NotFound();

    [HttpDelete, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Clear() { await service.ClearPlayersAsync(); return NoContent(); }
}

[ApiController]
[Route("api/matches")]
public sealed class FrontendMatchesController(IFrontendAppService service) : ControllerBase
{
    [HttpGet] public async Task<ActionResult<List<FrontendMatchDto>>> Get() => Ok(await service.GetMatchesAsync());
    [HttpPost, Authorize(Roles = "Admin,SELECTOR")]
    public async Task<ActionResult<FrontendMatchDto>> Upsert(FrontendMatchDto match)
    {
        if (!DateOnly.TryParseExact(
                match.Date,
                "yyyy-MM-dd",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None,
                out var matchDate))
        {
            return BadRequest(new { message = "Enter a valid match date." });
        }

        if (matchDate.DayOfWeek != DayOfWeek.Wednesday)
        {
            return BadRequest(new { message = "Matches can only be created on Wednesdays." });
        }

        var redLineup = match.RedLineup ?? [];
        var blackLineup = match.BlackLineup ?? [];
        if (redLineup.Intersect(blackLineup).Any())
            return BadRequest(new { message = "A player cannot be selected for both teams." });
        if (redLineup.Concat(blackLineup).Distinct().Count() > 18)
            return BadRequest(new { message = "A match pool cannot contain more than 18 players." });
        if ((redLineup.Count > 0 || blackLineup.Count > 0) && (redLineup.Count < 5 || blackLineup.Count < 5))
            return BadRequest(new { message = "Both teams require at least 5 selected players." });

        var existing = (await service.GetMatchesAsync()).FirstOrDefault(x =>
            x.RoundNumber == match.RoundNumber && x.Year == (match.Year ?? matchDate.Year));

        if (existing?.IsFinalized == true && string.IsNullOrWhiteSpace(match.CorrectionReason))
            return BadRequest(new { message = "Enter a correction reason before changing a finalized match." });

        if (match.IsPlayed == true)
        {
            if (match.Chuckers.Count != 3 || match.Chuckers.Any(chucker =>
                    !((chucker.RedScore == 5 && chucker.BlackScore is >= 0 and < 5) ||
                      (chucker.BlackScore == 5 && chucker.RedScore is >= 0 and < 5))))
                return BadRequest(new { message = "Each chucker must have one team on 5 and the other team between 0 and 4." });

            var participants = redLineup.Concat(blackLineup).ToHashSet();
            if (string.IsNullOrWhiteSpace(match.MvpPlayerId) || !participants.Contains(match.MvpPlayerId))
                return BadRequest(new { message = "Select an MVP from the saved match lineups." });
            if (match.RedScorers.Keys.Any(id => !redLineup.Contains(id)) ||
                match.BlackScorers.Keys.Any(id => !blackLineup.Contains(id)))
                return BadRequest(new { message = "Try scorers must belong to their saved match team." });
            match.IsFinalized = true;
            match.FinalizedAt ??= DateTimeOffset.UtcNow;
        }

        return Ok(await service.UpsertMatchAsync(match));
    }
    [HttpDelete("{roundNumber:int}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int roundNumber, [FromQuery] int? year = null) => await service.DeleteMatchAsync(roundNumber, year) ? NoContent() : NotFound();
    [HttpDelete, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Clear() { await service.ClearMatchesAsync(); return NoContent(); }
}

[ApiController]
[Route("api/auth")]
public sealed class FrontendAuthController(IFrontendAppService service, TokenService tokens) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<FrontendAuthResponseDto>> Login(FrontendLoginRequestDto request)
    {
        var user = await service.AuthenticateAsync(request.Identifier, request.Password);
        if (user is null) return Unauthorized(new ProblemDetails { Title = "Invalid username/email or password." });
        return Ok(new FrontendAuthResponseDto { Token = tokens.GenerateFrontendToken(user), User = user });
    }

    [HttpPost("register")]
    public async Task<ActionResult<FrontendAuthResponseDto>> Register(RegisterRequestDto request)
    {
        var user = await service.RegisterAsync(request);
        return Ok(new FrontendAuthResponseDto { Token = tokens.GenerateFrontendToken(user), User = user });
    }

    [HttpPost("refresh"), Authorize]
    public async Task<ActionResult<FrontendAuthResponseDto>> Refresh()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var user = await service.GetUserAsync(id);
        return user is null
            ? Unauthorized()
            : Ok(new FrontendAuthResponseDto { Token = tokens.GenerateFrontendToken(user), User = user });
    }
}

[ApiController]
[Route("api/users")]
[Authorize]
public sealed class FrontendUsersController(IFrontendAppService service) : ControllerBase
{
    private string CurrentId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    [HttpGet, Authorize(Roles = "Admin")] public async Task<ActionResult<List<FrontendUserDto>>> Get() => Ok(await service.GetUsersAsync());
    [HttpGet("me")]
    public async Task<ActionResult<FrontendUserDto>> Me() { var user = await service.GetUserAsync(CurrentId); return user is null ? NotFound() : Ok(user); }
    [HttpPut("me")]
    public async Task<ActionResult<FrontendUserDto>> UpdateMe(FrontendUserDto updates) { var user = await service.UpdateUserAsync(CurrentId, updates); return user is null ? NotFound() : Ok(user); }
    [HttpPatch("{id}/approval"), Authorize(Roles = "Admin")]
    public async Task<ActionResult<FrontendUserDto>> Approval(string id, ApprovalRequestDto request) { var user = await service.SetApprovalAsync(id, request.Status); return user is null ? NotFound() : Ok(user); }
    [HttpPatch("{id}/selector"), Authorize(Roles = "Admin")]
    public async Task<ActionResult<FrontendUserDto>> Selector(string id, SelectorRequestDto request) { var user = await service.SetSelectorAsync(id, request.IsSelector); return user is null ? NotFound() : Ok(user); }
}

[ApiController]
[Route("api/photos")]
public sealed class FrontendPhotosController(IFrontendAppService service) : ControllerBase
{
    [HttpGet] public async Task<ActionResult<List<FrontendPhotoDto>>> Get() => Ok(await service.GetPhotosAsync());
    [HttpPost, Authorize] public async Task<ActionResult<FrontendPhotoDto>> Add(FrontendPhotoDto photo) => Ok(await service.AddPhotoAsync(photo));
    [HttpPost("{id}/like")]
    public async Task<ActionResult<FrontendPhotoDto>> Like(string id) { var photo = await service.LikePhotoAsync(id); return photo is null ? NotFound() : Ok(photo); }
    [HttpDelete("{id}"), Authorize]
    public async Task<IActionResult> Delete(string id) => await service.DeletePhotoAsync(id) ? NoContent() : NotFound();
}

[ApiController]
[Route("api/club-config")]
public sealed class FrontendClubConfigController(IFrontendAppService service) : ControllerBase
{
    [HttpGet] public async Task<ActionResult<FrontendClubConfigDto>> Get() => Ok(await service.GetClubConfigAsync());
    [HttpPut, Authorize(Roles = "Admin,SELECTOR")] public async Task<ActionResult<FrontendClubConfigDto>> Put(FrontendClubConfigDto config) => Ok(await service.SaveClubConfigAsync(config));
}

[ApiController]
[Route("api/rosters/current")]
public sealed class FrontendRosterController(IFrontendAppService service) : ControllerBase
{
    [HttpGet] public async Task<ActionResult<FrontendRosterDto>> Get() => Ok(await service.GetRosterAsync());
    [HttpPut, Authorize(Roles = "Admin,SELECTOR")] public async Task<ActionResult<FrontendRosterDto>> Put(FrontendRosterDto roster) => Ok(await service.SaveRosterAsync(roster));
}
