using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RugbyManagementSystem.Application.DTOs.UserDTOs;
using RugbyManagementSystem.Application.Interfaces;
using RugbyManagementSystem.Application.Services;
using RugbyManagementSystem.Domain.Entities;
using RugbyManagementSystem.Domain.Enums;
using System.Numerics;

namespace RugbyManagementSystem_Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserServices _userServices;
        private readonly TokenService _tokenService;

        public UserController(IUserServices userServices, TokenService tokenService)
        {
            _userServices = userServices;
            _tokenService = tokenService;
        }

        [HttpPost]
        public async Task<ActionResult<CreateUserDTOs>> CreateUserAsync(CreateUserDTOs user)
        {
            var newUser = await _userServices.CreateUserAsync(user);
            return Ok(newUser);
        }

        [HttpGet]
        [Authorize(Roles = nameof(UserRoles.Admin))]
        public async Task<ActionResult<UserDetails>> GetAllUsersAsync()
        {
            var user = await _userServices.GetAllUsersAsync();

            return Ok(user);
        }

        [HttpGet("{Id}")]
        [Authorize(Roles = nameof(UserRoles.Admin))]
        public async Task<ActionResult<UserDetails>> GetUserById(Guid Id)
        {
            var user = await _userServices.GetUserByIdAsync(Id);

            if (user == null)
                return NotFound();

            return Ok(user);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO dto)
        {
            var user = await _userServices.GetByUsernameAsync(dto.Username);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
                return Unauthorized("Invalid username or password.");

            var token = _tokenService.GenerateToken(user);
            return Ok(new { token });
        }


        [HttpPut("{userId:guid}")]
        [Authorize(Roles = nameof(UserRoles.Admin))]
        public async Task<ActionResult<UserDetails>> UpdateUserAsync(Guid userId, UserDetails user)
        {
            if (userId != user.Id)
                return BadRequest("The route ID does not match the user ID.");

            var updatedUser = await _userServices.UpdateUserAsync(userId, user);

            if (updatedUser == null)
                return NotFound();

            return Ok(updatedUser);
        }


        [HttpDelete("{Id:guid}")]
        [Authorize(Roles = nameof(UserRoles.Admin))]
        public async Task<ActionResult> DeleteUserAsync(Guid Id)
        {

            var result = await _userServices.DeleteUserAsync(Id);

            if (result == null)
                return NotFound("User was not found");

            return Ok("User was deleted");
        }

    }
}
