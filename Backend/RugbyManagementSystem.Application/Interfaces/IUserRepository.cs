using RugbyManagementSystem.Application.DTOs.UserDTOs;
using RugbyManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace RugbyManagementSystem.Application.Interfaces
{
    public interface IUserRepository
    {
        Task<List<GetUserDTOs>> GetAllUsersAsync();
        Task<GetUserDTOs?> GetUserByIdAsync(Guid Id);
        Task<CreateUserDTOs> CreateUserAsync(CreateUserDTOs user);
        Task<UserDetails?> UpdateUserAsync(UserDetails user);
        Task<UserDetails?> DeleteUserAsync(Guid Id);
        Task<UserDetails?> GetByUsernameAsync(string username);
        Task<UserDetails?> GetUserEntityByIdAsync(Guid Id);
    }
}
