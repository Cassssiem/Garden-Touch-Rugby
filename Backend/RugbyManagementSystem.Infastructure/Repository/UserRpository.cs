using Microsoft.EntityFrameworkCore;
using RugbyManagementSystem.Application.DTOs.UserDTOs;
using RugbyManagementSystem.Application.Interfaces;
using RugbyManagementSystem.Domain.Entities;
using RugbyManagementSystem.Domain.Enums;
using RugbyManagementSystem.Infastructure.Data;

namespace RugbyManagementSystem.Infastructure.Repository
{
    public class UserRpository : IUserRepository
    {
        private readonly AppDbContext _context;
        public UserRpository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CreateUserDTOs> CreateUserAsync(CreateUserDTOs user)
        {
            var entity = new UserDetails
            {
                Username = user.Username,
                Password = user.Password!,       // already hashed by the service
                Role = UserRoles.User            // forced here — the only place Role gets set for self-registration
            };

            await _context.Users.AddAsync(entity);
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<List<GetUserDTOs>> GetAllUsersAsync()
        {
            return await _context.Users
                .Select(u => new GetUserDTOs
                {
                    Username = u.Username,
                    Role = u.Role
                })
                .ToListAsync();
        }

        public async Task<GetUserDTOs?> GetUserByIdAsync(Guid id)
        {
            return await _context.Users
                .Where(u => u.Id == id)
                .Select(u => new GetUserDTOs { Username = u.Username, Role = u.Role })
                .FirstOrDefaultAsync();
        }

        // UserRpository.cs — the method itself
        public async Task<UserDetails?> UpdateUserAsync(UserDetails user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }
        public async Task<UserDetails?> DeleteUserAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return null;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<UserDetails?> GetByUsernameAsync(string username)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<UserDetails?> GetUserEntityByIdAsync(Guid id)
        {
            return await _context.Users.FindAsync(id);
        }
    }
}
