using RugbyManagementSystem.Domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace RugbyManagementSystem.Application.DTOs.CreatePlayerDTOs
{
    public class CreatePlayerDTOs
        {
        [Required(ErrorMessage = "Name is required.")]
        [StringLength(50, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string Surname { get; set; } = string.Empty;

        [StringLength(30)]
        public string NickName { get; set; } = string.Empty;
        [Required]
        public int Age { get; set; }

        [Required]
        public PlayerPosition Position { get; set; }


    }
}
