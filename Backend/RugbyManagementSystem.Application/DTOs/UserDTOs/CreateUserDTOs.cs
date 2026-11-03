using System.ComponentModel.DataAnnotations;

namespace RugbyManagementSystem.Application.DTOs.UserDTOs
{
    public class CreateUserDTOs
    {
        [Required(ErrorMessage = "Username is required.")]
        [StringLength(50, MinimumLength = 2)]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please enter a password")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters.")]
        public string? Password { get; set; }
    }
}
