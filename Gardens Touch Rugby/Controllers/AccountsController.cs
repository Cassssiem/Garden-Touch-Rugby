using GTR.Application.Accounts;
using GTR.Application.Accounts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gardens_Touch_Rugby.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/accounts")]
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountsController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpPost("player")]
        public async Task<ActionResult<AccountResponse>> CreatePlayerAccount(
            [FromBody] CreatePlayerAccountRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                return Ok(await _accountService.CreatePlayerAccountAsync(request, cancellationToken));
            }
            catch (ArgumentException e) { return BadRequest(new { message = e.Message }); }
            catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
            catch (InvalidOperationException e) { return Conflict(new { message = e.Message }); }
        }
    }
}