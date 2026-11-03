using RugbyManagementSystem.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace RugbyManagementSystem.Application.DTOs.UserDTOs
{
    public class UpdateUserDTOs
    {

        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

    }
}
