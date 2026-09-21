using GTR.Application.Abstractions.Repositories;
using GTR.Domain.Entities;
using GTR.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GTR.Infrastructure.Repositories
{
    public class MatchRepository : IMatchRepository
    {
        private readonly AppDbContext _context;

        public MatchRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<Match>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            return await _context.Matches
                .Include(match => match.MatchPlayers)
                    .ThenInclude(matchPlayer =>
                        matchPlayer.Player)
                .Include(match =>
                    match.PlayerAvailabilities)
                .Include(match => match.ChuckerResults)
                .AsSplitQuery()
                .OrderByDescending(match =>
                    match.MatchDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<Match?> GetWithDetailsAsync(
            Guid matchId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Matches
                .Include(match => match.MatchPlayers)
                    .ThenInclude(matchPlayer =>
                        matchPlayer.Player)
                .Include(match =>
                    match.PlayerAvailabilities)
                .Include(match => match.ChuckerResults)
                .AsSplitQuery()
                .FirstOrDefaultAsync(
                    match => match.Id == matchId,
                    cancellationToken
                );
        }

        public async Task<bool> ExistsOnDateAsync(
            DateOnly matchDate,
            CancellationToken cancellationToken = default)
        {
            return await _context.Matches.AnyAsync(
                match => match.MatchDate == matchDate,
                cancellationToken
            );
        }

        public async Task AddAsync(
            Match match,
            CancellationToken cancellationToken = default)
        {
            await _context.Matches.AddAsync(
                match,
                cancellationToken
            );
        }

        public async Task SaveChangesAsync(
            CancellationToken cancellationToken = default)
        {
            try
            {
                await _context.SaveChangesAsync(
                    cancellationToken
                );
            }
            catch (DbUpdateConcurrencyException exception)
            {
                var conflicts = string.Join(
                    ", ",
                    exception.Entries.Select(entry =>
                        $"{entry.Metadata.ClrType.Name} " +
                        $"({entry.State})"
                    )
                );

                throw new InvalidOperationException(
                    $"Concurrency conflict involving: " +
                    $"{conflicts}",
                    exception
                );
            }
        }
    }
}