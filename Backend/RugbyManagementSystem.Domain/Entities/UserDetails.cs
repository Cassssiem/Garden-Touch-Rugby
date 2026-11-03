

using RugbyManagementSystem.Domain.Enums;

namespace RugbyManagementSystem.Domain.Entities
{
    public class UserDetails
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public UserRoles Role { get; set; } 
    }
}
