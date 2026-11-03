using RugbyManagementSystem.Domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace RugbyManagementSystem.Application.DTOs.UpdatePlayer
{

    public class UpdatePlayerDTOs
    {
        public Guid Id { get; set; }
        [Required(ErrorMessage = "Name is required.")]
        [StringLength(50, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string Surname { get; set; } = string.Empty;

        [StringLength(30)]
        public string NickName { get; set; } = string.Empty;


        [Required(ErrorMessage = "Age is required.")]
        public int Age { get; set; }

        [Required]
        public PlayerPosition Position { get; set; }

        [Range(0, int.MaxValue)]
        public int MatchesPlayed { get; set; }

        [Range(0, int.MaxValue)]
        public int Tries { get; set; }

        [Range(0, int.MaxValue)]
        public int Conversions { get; set; }
    }
}
