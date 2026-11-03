using Microsoft.AspNetCore.Http.HttpResults;
using RugbyManagementSystem.Application.DTOs.CreatePlayerDTOs;
using RugbyManagementSystem.Application.DTOs.PlayerDTOs;
using RugbyManagementSystem.Application.DTOs.UpdatePlayer;
using RugbyManagementSystem.Application.Interfaces;
using RugbyManagementSystem.Domain.Entities;

namespace RugbyManagementSystem.Application.Services
{
        public class PlayerServices : IPlayerServices
        {
            private readonly IPlayerRepository _playerRepository;
        public PlayerServices(IPlayerRepository playerRepository)
            {
            _playerRepository = playerRepository;
            }

        public async Task<List<GetPlayerDTO>> GetAllPlayersAsync()
        {
            return await _playerRepository.GetAllAsync();
        }

        public async Task<GetPlayerDTO?> GetPlayerByIdAsync(Guid playerId)
        {
            if (playerId == Guid.Empty)
                throw new ArgumentException("Please enter a valid player Id.");

            return await _playerRepository.GetPlayerByIdAsync(playerId);
        }

        public async Task<GetPlayerDTO> CreatePlayerAsync(CreatePlayerDTOs player)
        {
            if (string.IsNullOrWhiteSpace(player.Name))
                throw new ArgumentException("Please enter a player name.");

            if (player.Age < 18)
                throw new ArgumentException("Player has to be over 18 to be registered as a senior.");

            var newPlayer = new GetPlayerDTO
            {
                Name = player.Name,
                Surname = player.Surname,
                NickName = player.NickName,
                Age = player.Age,
                Position = player.Position,
                MatchesPlayed = 0,
                Tries = 0,
                Conversions = 0
            };

            return await _playerRepository.CreatePlayerAsync(newPlayer);
        }

        public async Task<GetPlayerDTO?> UpdatePlayerAsync(Guid playerId, UpdatePlayerDTOs player)
        {
            if (playerId == Guid.Empty)
                throw new ArgumentException("Please enter a valid player Id.");

            var existing = await _playerRepository.GetPlayerByIdAsync(playerId);
            if (existing == null)
                return null;

            existing.Name = player.Name;
            existing.Surname = player.Surname;
            existing.NickName = player.NickName;
            existing.Age = player.Age;
            existing.Position = player.Position;
            // MatchesPlayed, Tries, Conversion intentionally NOT set here —
            // they're derived from MatchPlayer records via RecalculatePlayerStatsAsync

            return await _playerRepository.UpdatePlayerAsync(existing);
        }

        public async Task<GetPlayerDTO?> DeletePlayerAsync(Guid playerId)
        {
            if (playerId == Guid.Empty)
                throw new ArgumentException("Please enter a valid player Id.");

            return await _playerRepository.DeletePlayerAsync(playerId);
        }


    }
}
