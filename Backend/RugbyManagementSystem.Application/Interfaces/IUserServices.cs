using RugbyManagementSystem.Application.DTOs.UserDTOs;
using RugbyManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace RugbyManagementSystem.Application.Interfaces
{
    public interface IUserServices
    {
        Task<List<GetUserDTOs>> GetAllUsersAsync();
        Task<GetUserDTOs?> GetUserByIdAsync(Guid userId);
        Task<CreateUserDTOs> CreateUserAsync(CreateUserDTOs user);
        // IUserServices.cs
        Task<UserDetails?> UpdateUserAsync(Guid userId, UserDetails user);
        Task<UserDetails?> DeleteUserAsync(Guid Id);
        Task<UserDetails?> GetByUsernameAsync(string username);
    }
}
