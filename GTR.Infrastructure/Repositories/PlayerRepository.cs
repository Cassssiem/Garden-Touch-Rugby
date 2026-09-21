using GTR.Application.Abstractions.Repositories;
using GTR.Domain.Entities;
using GTR.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GTR.Infrastructure.Repositories
{
    public class PlayerRepository : IPlayerRepository
    {
        private readonly AppDbContext _context;

        public PlayerRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<Player>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            return await _context.Players
                .AsNoTracking()
                .OrderBy(player => player.Nickname)
                .ToListAsync(cancellationToken);
        }

        public async Task<IReadOnlyList<Player>>
            GetAllWithStatsAsync(
                CancellationToken cancellationToken = default)
        {
            return await _context.Players
                .Include(player => player.MatchPlayers)
                    .ThenInclude(matchPlayer =>
                        matchPlayer.Match)
                    .ThenInclude(match =>
                        match.ChuckerResults)
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .OrderBy(player => player.Nickname)
                .ToListAsync(cancellationToken);
        }

        public async Task<Player?> GetByIdAsync(
            Guid playerId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Players
                .FirstOrDefaultAsync(
                    player => player.Id == playerId,
                    cancellationToken
                );
        }

        public async Task<Player?> GetByIdWithStatsAsync(
            Guid playerId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Players
                .Include(player => player.MatchPlayers)
                    .ThenInclude(matchPlayer =>
                        matchPlayer.Match)
                    .ThenInclude(match =>
                        match.ChuckerResults)
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .FirstOrDefaultAsync(
                    player => player.Id == playerId,
                    cancellationToken
                );
        }

        public async Task<bool> NicknameExistsAsync(
            string nickname,
            CancellationToken cancellationToken = default)
        {
            return await _context.Players.AnyAsync(
                player =>
                    player.Nickname.ToLower()
                    == nickname.ToLower(),
                cancellationToken
            );
        }

        public async Task AddAsync(
            Player player,
            CancellationToken cancellationToken = default)
        {
            await _context.Players.AddAsync(
                player,
                cancellationToken
            );
        }

        public async Task SaveChangesAsync(
            CancellationToken cancellationToken = default)
        {
            await _context.SaveChangesAsync(
                cancellationToken
            );
        }
    }
}