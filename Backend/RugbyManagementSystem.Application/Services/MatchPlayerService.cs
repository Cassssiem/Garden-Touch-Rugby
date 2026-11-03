using RugbyManagementSystem.Application.DTOs.MatchPlayerDTOs;
using RugbyManagementSystem.Application.Interfaces;
using RugbyManagementSystem.Domain.Entities;
using RugbyManagementSystem.Domain.Enums;

namespace RugbyManagementSystem.Application.Services
{
    public class MatchPlayerService : IMatchPlayerServices
    {
        private readonly IMatchPlayerRepository _matchPlayerRepository;
        private readonly IPlayerRepository _playerRepository;
        private readonly IMatchRepository _matchRepository;

        public MatchPlayerService(
            IMatchPlayerRepository matchPlayerRepository,
            IPlayerRepository playerRepository,
            IMatchRepository matchRepository)
        {
            _matchPlayerRepository = matchPlayerRepository;
            _playerRepository = playerRepository;
            _matchRepository = matchRepository;
        }

        private async Task RecalculatePlayerStatsAsync(Guid playerId)
        {
            var records = await _matchPlayerRepository.GetAllByPlayerIdAsync(playerId);

            var player = await _playerRepository.GetPlayerByIdAsync(playerId);
            if (player == null)
                return;

            player.MatchesPlayed = records.Count();
            player.Tries = records.Sum(r => r.Tries);
            player.Conversions = records.Sum(r => r.Conversions);

            await _playerRepository.UpdatePlayerAsync(player);
        }

        private static GetMatchPLayerDTO ToDto(MatchPlayer mp) => new GetMatchPLayerDTO
        {
            PlayerId = mp.PlayerId,
            PlayerName = mp.Player.Name,
            MatchId = mp.MatchId,
            Opponent = mp.Match.Opponent,
            Date = mp.Match.Date,
            Team = mp.Match.Team,
            Position = mp.Position,
            Tries = mp.Tries,
            Conversions = mp.Conversions
        };

        public async Task<MatchPlayer> AddPlayerToMatchAsync(Guid playerId, int matchId, AddMatchPlayerDTO dto)
        {
            var player = await _playerRepository.GetPlayerByIdAsync(playerId);
            if (player == null)
                throw new KeyNotFoundException("Player not found.");

            var match = await _matchRepository.GetMatchByIdAsync(matchId);
            if (match == null)
                throw new KeyNotFoundException("Match not found.");

            var existing = await _matchPlayerRepository.GetPlayerMatchAsync(playerId, matchId);
            if (existing != null)
                throw new InvalidOperationException("Player is already assigned to this match.");

            if (dto.Tries < 0 || dto.Conversions < 0)
                throw new ArgumentException("Tries and conversions cannot be negative.");

            var matchPlayer = new MatchPlayer
            {
                PlayerId = playerId,
                MatchId = matchId,
                Position = dto.Position,
                Tries = dto.Tries,
                Conversions = dto.Conversions
            };

            var result = await _matchPlayerRepository.AddPlayerToMatchAsync(matchPlayer);
            await RecalculatePlayerStatsAsync(playerId);
            return result;
        }

        public async Task<MatchPlayer> UpdatePlayerMatchStatsAsync(UpdateMatchPlayerDto dto)
        {
            var matchPlayer = await _matchPlayerRepository.GetPlayerMatchAsync(dto.PlayerId, dto.MatchId);

            if (matchPlayer == null)
                throw new KeyNotFoundException("Player is not assigned to this match.");

            if (dto.Tries < 0 || dto.Conversions < 0)
                throw new ArgumentException("Tries and conversions cannot be negative.");

            matchPlayer.Tries = dto.Tries;
            matchPlayer.Conversions = dto.Conversions;

            var result = await _matchPlayerRepository.UpdateAsync(matchPlayer);
            await RecalculatePlayerStatsAsync(dto.PlayerId);
            return result;
        }

        public async Task<GetMatchPLayerDTO?> GetPlayerMatchAsync(Guid playerId, int matchId)
        {
            var matchPlayer = await _matchPlayerRepository.GetPlayerMatchAsync(playerId, matchId);
            return matchPlayer == null ? null : ToDto(matchPlayer);
        }

        public async Task<List<GetMatchPLayerDTO>> GetPlayersByMatchAsync(int matchId)
        {
            var matchPlayers = await _matchPlayerRepository.GetPlayersByMatchAsync(matchId);
            return matchPlayers.Select(ToDto).ToList();
        }

        public async Task<List<GetMatchPLayerDTO>> GetMatchesByPlayerAsync(Guid playerId)
        {
            if (playerId == Guid.Empty)
                throw new ArgumentException("Please enter a valid Id");

            var matchPlayers = await _matchPlayerRepository.GetMatchesByPlayerAsync(playerId);
            return matchPlayers.Select(ToDto).ToList();
        }

        public async Task<List<GetMatchPLayerDTO>> GetPlayersByTeamAsync(Teams team)
        {
            var matchPlayers = await _matchPlayerRepository.GetPlayersByTeamAsync(team);
            return matchPlayers.Select(ToDto).ToList();
        }

        public async Task<bool> RemovePlayerFromMatchAsync(Guid playerId, int matchId)
        {
            var matchPlayer = await _matchPlayerRepository.GetPlayerMatchAsync(playerId, matchId);

            if (matchPlayer == null)
                return false;

            await _matchPlayerRepository.DeleteAsync(matchPlayer);
            await RecalculatePlayerStatsAsync(playerId);

            return true;
        }
    }
}
