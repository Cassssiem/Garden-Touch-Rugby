using GTR.Application.Auth;
using GTR.Application.Auth.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gardens_Touch_Rugby.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login(
            [FromBody] LoginRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var response =
                    await _authService.LoginAsync(
                        request,
                        cancellationToken
                    );

                return Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid username or password."
                });
            }
        }
    }
}