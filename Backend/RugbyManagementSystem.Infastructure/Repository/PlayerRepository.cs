using Microsoft.EntityFrameworkCore;
using RugbyManagementSystem.Application.DTOs.CreatePlayerDTOs;
using RugbyManagementSystem.Application.DTOs.MatchPlayerDTOs;
using RugbyManagementSystem.Application.DTOs.PlayerDTOs;
using RugbyManagementSystem.Application.DTOs.UpdatePlayer;
using RugbyManagementSystem.Application.Interfaces;
using RugbyManagementSystem.Domain.Entities;
using RugbyManagementSystem.Infastructure.Data;


namespace RugbyManagementSystem.Infastructure.Repository
{
    public class PlayerRepository : IPlayerRepository
    {
        private readonly AppDbContext _context;
        public PlayerRepository(AppDbContext context)
        {
            _context = context;
        }
        private static GetPlayerDTO ToDto(PlayerDetails p) => new GetPlayerDTO
        {
            Id = p.Id,
            Name = p.Name,
            Surname = p.Surname,
            NickName = p.NickName,
            Age = p.Age,
            Position = p.Position,
            MatchesPlayed = p.MatchesPlayed,
            Tries = p.Tries,
            Conversions = p.Conversions
        };
        public async Task<List<GetPlayerDTO>> GetAllAsync()
        {
            var players = await _context.Players.ToListAsync();
            return players.Select(ToDto).ToList();
        }

        public async Task<GetPlayerDTO?> GetPlayerByIdAsync(Guid id)
        {
            var player = await _context.Players
                .FirstOrDefaultAsync(p => p.Id == id);   // .Include(p => p.MatchPlayers) no longer needed

            if (player == null)
                return null;

            return ToDto(player);   // just use your existing ToDto helper, no manual mapping needed anymore
        }

        public async Task<GetPlayerDTO> CreatePlayerAsync(GetPlayerDTO player)
        {
            var entity = new PlayerDetails
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

            _context.Players.Add(entity);
            await _context.SaveChangesAsync();

            return ToDto(entity);
        }

        public async Task<GetPlayerDTO?> UpdatePlayerAsync(GetPlayerDTO player)
        {
            var entity = await _context.Players.FindAsync(player.Id);
            if (entity == null)
                return null;

            entity.Name = player.Name;
            entity.Surname = player.Surname;
            entity.NickName = player.NickName;
            entity.Age = player.Age;
            entity.Position = player.Position;
            entity.MatchesPlayed = player.MatchesPlayed;
            entity.Tries = player.Tries;
            entity.Conversions = player.Conversions;

            await _context.SaveChangesAsync();
            return ToDto(entity);
        }

        public async Task<GetPlayerDTO?> DeletePlayerAsync(Guid id)
        {
            var entity = await _context.Players.FindAsync(id);
            if (entity == null)
                return null;

            _context.Players.Remove(entity);
            await _context.SaveChangesAsync();
            return ToDto(entity);
        }


    }
}
