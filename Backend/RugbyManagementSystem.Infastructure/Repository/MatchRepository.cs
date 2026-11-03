using Microsoft.EntityFrameworkCore;
using RugbyManagementSystem.Application.DTOs.MatchDTOs;
using RugbyManagementSystem.Application.Interfaces;
using RugbyManagementSystem.Domain.Entities;
using RugbyManagementSystem.Infastructure.Data;

namespace RugbyManagementSystem.Infastructure.Repository
{
    public class MatchRepository : IMatchRepository
    {
        private readonly AppDbContext _context;

        public MatchRepository(AppDbContext context)
        {
            _context = context;
        }

        private static GetMatchDTO ToDto(MatchDetails m) => new GetMatchDTO
        {
            Id = m.Id,
            Opponent = m.Opponent,
            Date = m.Date,
            Location = m.Location,
            Team = m.Team,
            Titans = m.Titans,
            OpponentScore = m.OpponentScore
        };

        public async Task<List<GetMatchDTO>> GetAllAsync()
        {
            var matches = await _context.Matches.ToListAsync();
            return matches.Select(ToDto).ToList();
        }

        public async Task<GetMatchDTO?> GetMatchByIdAsync(int id)
        {
            var entity = await _context.Matches.FindAsync(id);
            return entity == null ? null : ToDto(entity);
        }

        public async Task<GetMatchDTO> CreateMatchAsync(GetMatchDTO match)
        {
            var entity = new MatchDetails
            {
                Opponent = match.Opponent,
                Date = match.Date,
                Location = match.Location,
                Team = match.Team,
                Titans = match.Titans,
                OpponentScore = match.OpponentScore
            };

            _context.Matches.Add(entity);
            await _context.SaveChangesAsync();
            return ToDto(entity);
        }

        public async Task<GetMatchDTO?> UpdateMatchAsync(GetMatchDTO match)
        {
            var entity = await _context.Matches.FindAsync(match.Id);
            if (entity == null)
                return null;

            entity.Opponent = match.Opponent;
            entity.Date = match.Date;
            entity.Location = match.Location;
            entity.Team = match.Team;
            entity.Titans = match.Titans;
            entity.OpponentScore = match.OpponentScore;

            await _context.SaveChangesAsync();
            return ToDto(entity);
        }

        public async Task<GetMatchDTO?> DeleteMatchAsync(int id)
        {
            var entity = await _context.Matches.FindAsync(id);
            if (entity == null)
                return null;

            _context.Matches.Remove(entity);
            await _context.SaveChangesAsync();
            return ToDto(entity);
        }
    }
}