using GTR.Application.Abstractions.Repositories;
using GTR.Application.Players.Dtos;
using GTR.Domain.Entities;

namespace GTR.Application.Players
{
    public class PlayerService : IPlayerService
    {
        private readonly IPlayerRepository _playerRepository;

        public PlayerService(
            IPlayerRepository playerRepository)
        {
            _playerRepository = playerRepository;
        }

        public async Task<IReadOnlyList<PlayerResponse>>
            GetAllAsync(
                CancellationToken cancellationToken = default)
        {
            var players =
                await _playerRepository
                    .GetAllWithStatsAsync(
                        cancellationToken
                    );

            return players
                .Select(PlayerResponse.FromEntity)
                .ToList();
        }

        public async Task<PlayerResponse?> GetByIdAsync(
            Guid playerId,
            CancellationToken cancellationToken = default)
        {
            var player =
                await _playerRepository
                    .GetByIdWithStatsAsync(
                        playerId,
                        cancellationToken
                    );

            return player is null
                ? null
                : PlayerResponse.FromEntity(player);
        }

        public async Task<PlayerResponse> CreateAsync(
            CreatePlayerRequest request,
            CancellationToken cancellationToken = default)
        {
            ValidateRequest(request);

            var firstName =
                request.FirstName.Trim();

            var lastName =
                request.LastName.Trim();

            var nickname =
                request.Nickname.Trim();

            var nicknameExists =
                await _playerRepository.NicknameExistsAsync(
                    nickname,
                    cancellationToken
                );

            if (nicknameExists)
            {
                throw new InvalidOperationException(
                    $"A player with the nickname " +
                    $"'{nickname}' already exists."
                );
            }

            var player = new Player
            {
                FirstName = firstName,
                LastName = lastName,
                Nickname = nickname,
                DateOfBirth = request.DateOfBirth,
                ImageUrl = NormaliseOptionalText(
                    request.ImageUrl
                ),
                Bio = NormaliseOptionalText(
                    request.Bio
                ),
                IsActive = true
            };

            await _playerRepository.AddAsync(
                player,
                cancellationToken
            );

            await _playerRepository.SaveChangesAsync(
                cancellationToken
            );

            return PlayerResponse.FromEntity(player);
        }

        private static void ValidateRequest(
            CreatePlayerRequest request)
        {
            if (string.IsNullOrWhiteSpace(
                    request.FirstName))
            {
                throw new ArgumentException(
                    "First name is required."
                );
            }

            if (string.IsNullOrWhiteSpace(
                    request.LastName))
            {
                throw new ArgumentException(
                    "Last name is required."
                );
            }

            if (string.IsNullOrWhiteSpace(
                    request.Nickname))
            {
                throw new ArgumentException(
                    "Nickname is required."
                );
            }

            var today =
                DateOnly.FromDateTime(DateTime.UtcNow);

            if (request.DateOfBirth > today)
            {
                throw new ArgumentException(
                    "Date of birth cannot be in the future."
                );
            }

            if (!string.IsNullOrWhiteSpace(
                    request.ImageUrl)
                && !Uri.TryCreate(
                    request.ImageUrl,
                    UriKind.Absolute,
                    out _))
            {
                throw new ArgumentException(
                    "Image URL must be a valid absolute URL."
                );
            }
        }

        private static string? NormaliseOptionalText(
            string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }
    }
}