using RugbyManagementSystem.Application.DTOs.MatchDTOs;
using RugbyManagementSystem.Application.Interfaces;

namespace RugbyManagementSystem.Application.Services
{
    public class MatchServices : IMatchServices
    {
        private readonly IMatchRepository _matchRepository;

        public MatchServices(IMatchRepository matchRepository)
        {
            _matchRepository = matchRepository;
        }

        public async Task<List<GetMatchDTO>> GetAllMatchesAsync()
        {
            return await _matchRepository.GetAllAsync();
        }

        public async Task<GetMatchDTO?> GetMatchByIdAsync(int id)
        {
            return await _matchRepository.GetMatchByIdAsync(id);
        }

        public async Task<GetMatchDTO> CreateMatchAsync(CreateMatchDTOs match)
        {
            var newMatch = new GetMatchDTO
            {
                Opponent = match.Opponent,
                Date = match.Date,
                Location = match.Location,
                Team = match.Team,
                Titans = match.Titans,
                OpponentScore = match.OpponentScore
            };

            return await _matchRepository.CreateMatchAsync(newMatch);
        }

        public async Task<GetMatchDTO?> UpdateMatchAsync(int id, UpdateMatchDTOs match)
        {
            var existing = await _matchRepository.GetMatchByIdAsync(id);
            if (existing == null)
                return null;

            existing.Opponent = match.Opponent;
            existing.Date = match.Date;
            existing.Location = match.Location;
            existing.Team = match.Team;
            existing.Titans = match.Titans;
            existing.OpponentScore = match.OpponentScore;

            return await _matchRepository.UpdateMatchAsync(existing);
        }

        public async Task<GetMatchDTO?> DeleteMatchAsync(int id)
        {
            return await _matchRepository.DeleteMatchAsync(id);
        }
    }
}