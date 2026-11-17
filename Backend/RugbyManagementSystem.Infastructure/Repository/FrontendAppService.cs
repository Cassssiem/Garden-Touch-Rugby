using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RugbyManagementSystem.Application.DTOs.Frontend;
using RugbyManagementSystem.Application.Interfaces;
using RugbyManagementSystem.Domain.Entities;
using RugbyManagementSystem.Infastructure.Data;

namespace RugbyManagementSystem.Infastructure.Repository;

public sealed class FrontendAppService : IFrontendAppService
{
    private const string PlayersKey = "frontend.players";
    private const string MatchesKey = "frontend.matches";
    private const string PhotosKey = "frontend.photos";
    private const string UsersKey = "frontend.users";
    private const string ConfigKey = "frontend.club-config";
    private const string RosterKey = "frontend.roster";
    private static readonly SemaphoreSlim Gate = new(1, 1);
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly AppDbContext _db;

    private sealed class StoredUser
    {
        public FrontendUserDto Profile { get; set; } = new();
        public string PasswordHash { get; set; } = string.Empty;
    }

    public FrontendAppService(AppDbContext db) => _db = db;

    private async Task<T> ReadAsync<T>(string key, T fallback)
    {
        var document = await _db.AppDataDocuments.AsNoTracking().SingleOrDefaultAsync(x => x.Key == key);
        return document is null ? fallback : JsonSerializer.Deserialize<T>(document.Json, JsonOptions) ?? fallback;
    }

    private async Task WriteAsync<T>(string key, T value)
    {
        var json = JsonSerializer.Serialize(value, JsonOptions);
        var document = await _db.AppDataDocuments.SingleOrDefaultAsync(x => x.Key == key);
        if (document is null)
            _db.AppDataDocuments.Add(new AppDataDocument { Key = key, Json = json });
        else
            document.Json = json;
        await _db.SaveChangesAsync();
    }

    private static FrontendPlayerDto NormalizePlayer(FrontendPlayerDto player)
    {
        player.Id = string.IsNullOrWhiteSpace(player.Id) || player.Id.StartsWith("p-")
            ? Guid.NewGuid().ToString()
            : player.Id;
        player.FullName = player.FullName.Trim();
        player.Nickname = string.IsNullOrWhiteSpace(player.Nickname)
            ? player.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "Player"
            : player.Nickname.Trim();
        player.Position = player.Position.ToUpperInvariant();
        player.Status = player.Status.ToLowerInvariant();
        player.AvailabilityByDate = player.AvailabilityByDate
            .ToDictionary(x => x.Key, x => x.Value.ToLowerInvariant());
        player.Team = player.Team.ToLowerInvariant();
        return player;
    }

    public async Task EnsureDevelopmentAdminAsync(string username, string email, string password, string fullName)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password)) return;
        await Gate.WaitAsync();
        try
        {
            var users = await ReadAsync(UsersKey, new List<StoredUser>());
            if (users.Any(x => x.Profile.Role == "ADMIN")) return;
            users.Add(new StoredUser
            {
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Profile = new FrontendUserDto
                {
                    Id = Guid.NewGuid().ToString(), Username = username.Trim().ToLowerInvariant(), Email = email.Trim().ToLowerInvariant(), FullName = fullName,
                    Nickname = "Admin", Role = "ADMIN", IsSelector = true, Status = "APPROVED",
                    Position = "MIDDLE", JerseyNumber = "1", AppliedAt = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    ApprovedAt = DateTime.UtcNow.ToString("yyyy-MM-dd")
                }
            });
            await WriteAsync(UsersKey, users);
        }
        finally { Gate.Release(); }
    }

    public Task<List<FrontendPlayerDto>> GetPlayersAsync() => ReadAsync(PlayersKey, new List<FrontendPlayerDto>());

    public async Task<FrontendPlayerDto> CreatePlayerAsync(FrontendPlayerDto player)
    {
        await Gate.WaitAsync();
        try
        {
            var players = await GetPlayersAsync();
            player = NormalizePlayer(player);
            if (players.Any(x => x.Id == player.Id)) throw new InvalidOperationException("A player with this ID already exists.");
            players.Insert(0, player);
            EnsureAvailabilityCapacity(players);
            await WriteAsync(PlayersKey, players);
            return player;
        }
        finally { Gate.Release(); }
    }

    public async Task<FrontendPlayerDto?> UpdatePlayerAsync(string id, FrontendPlayerDto updates)
    {
        await Gate.WaitAsync();
        try
        {
            var players = await GetPlayersAsync();
            var index = players.FindIndex(x => x.Id == id);
            if (index < 0) return null;
            updates.Id = id;
            players[index] = NormalizePlayer(updates);
            EnsureAvailabilityCapacity(players);
            await WriteAsync(PlayersKey, players);
            return players[index];
        }
        finally { Gate.Release(); }
    }

    private static void EnsureAvailabilityCapacity(IEnumerable<FrontendPlayerDto> players)
    {
        var overCapacityDate = players
            .SelectMany(x => x.AvailabilityByDate.Where(a => a.Value == "available").Select(a => a.Key))
            .GroupBy(x => x)
            .FirstOrDefault(group => group.Count() > 18)?.Key;
        if (overCapacityDate is not null)
            throw new InvalidOperationException($"The availability pool for {overCapacityDate} is limited to 18 players.");
    }

    public async Task<bool> DeletePlayerAsync(string id)
    {
        await Gate.WaitAsync();
        try
        {
            var players = await GetPlayersAsync();
            var removed = players.RemoveAll(x => x.Id == id) > 0;
            if (removed) await WriteAsync(PlayersKey, players);
            return removed;
        }
        finally { Gate.Release(); }
    }

    public async Task ClearPlayersAsync() { await Gate.WaitAsync(); try { await WriteAsync(PlayersKey, new List<FrontendPlayerDto>()); } finally { Gate.Release(); } }
    public Task<List<FrontendMatchDto>> GetMatchesAsync() => ReadAsync(MatchesKey, new List<FrontendMatchDto>());

    public async Task<FrontendMatchDto> UpsertMatchAsync(FrontendMatchDto match)
    {
        if (match.RoundNumber <= 0) throw new ArgumentException("Round number must be greater than zero.");
        match.Year ??= DateTime.TryParse(match.Date, out var parsed) ? parsed.Year : DateTime.UtcNow.Year;
        await Gate.WaitAsync();
        try
        {
            var matches = await GetMatchesAsync();
            var index = matches.FindIndex(x => x.RoundNumber == match.RoundNumber && x.Year == match.Year);
            if (index >= 0) matches[index] = match; else matches.Insert(0, match);
            await WriteAsync(MatchesKey, matches);
            await RecalculateStatsAsync(matches);
            return match;
        }
        finally { Gate.Release(); }
    }

    private async Task RecalculateStatsAsync(List<FrontendMatchDto> matches)
    {
        var played = matches.Where(x => x.IsPlayed != false && x.SeriesScore != "TBA").ToList();
        var players = await GetPlayersAsync();
        foreach (var player in players)
        {
            player.Tries = played.Sum(x => x.RedScorers.GetValueOrDefault(player.Id) + x.BlackScorers.GetValueOrDefault(player.Id));
            player.Mvps = played.Count(x => x.MvpPlayerId == player.Id);
            player.Caps = played.Count(x => (x.RedLineup?.Contains(player.Id) ?? false) || (x.BlackLineup?.Contains(player.Id) ?? false));
            player.ChuckersPlayed = player.Caps * 3;
            player.ChuckersWon = played.Sum(match => match.Chuckers.Count(chucker =>
                (chucker.RedScore > chucker.BlackScore && (match.RedLineup?.Contains(player.Id) ?? false)) ||
                (chucker.BlackScore > chucker.RedScore && (match.BlackLineup?.Contains(player.Id) ?? false))));
        }
        await WriteAsync(PlayersKey, players);
    }

    public async Task<bool> DeleteMatchAsync(int roundNumber, int? year = null)
    {
        await Gate.WaitAsync();
        try
        {
            var matches = await GetMatchesAsync();
            var removed = matches.RemoveAll(x => x.RoundNumber == roundNumber && (!year.HasValue || x.Year == year)) > 0;
            if (removed) { await WriteAsync(MatchesKey, matches); await RecalculateStatsAsync(matches); }
            return removed;
        }
        finally { Gate.Release(); }
    }

    public async Task ClearMatchesAsync() { await Gate.WaitAsync(); try { await WriteAsync(MatchesKey, new List<FrontendMatchDto>()); await RecalculateStatsAsync([]); } finally { Gate.Release(); } }
    public Task<List<FrontendPhotoDto>> GetPhotosAsync() => ReadAsync(PhotosKey, new List<FrontendPhotoDto>());

    public async Task<FrontendPhotoDto> AddPhotoAsync(FrontendPhotoDto photo)
    {
        await Gate.WaitAsync(); try
        {
            var photos = await GetPhotosAsync();
            photo.Id = string.IsNullOrWhiteSpace(photo.Id) || photo.Id.StartsWith("photo-") ? Guid.NewGuid().ToString() : photo.Id;
            photos.Insert(0, photo); await WriteAsync(PhotosKey, photos); return photo;
        } finally { Gate.Release(); }
    }

    public async Task<FrontendPhotoDto?> LikePhotoAsync(string id)
    {
        await Gate.WaitAsync(); try
        {
            var photos = await GetPhotosAsync(); var photo = photos.FirstOrDefault(x => x.Id == id);
            if (photo is null) return null; photo.Likes++; await WriteAsync(PhotosKey, photos); return photo;
        } finally { Gate.Release(); }
    }

    public async Task<bool> DeletePhotoAsync(string id)
    {
        await Gate.WaitAsync(); try
        {
            var photos = await GetPhotosAsync(); var removed = photos.RemoveAll(x => x.Id == id) > 0;
            if (removed) await WriteAsync(PhotosKey, photos); return removed;
        } finally { Gate.Release(); }
    }

    public Task<FrontendClubConfigDto> GetClubConfigAsync() => ReadAsync(ConfigKey, new FrontendClubConfigDto());
    public async Task<FrontendClubConfigDto> SaveClubConfigAsync(FrontendClubConfigDto config) { await Gate.WaitAsync(); try { await WriteAsync(ConfigKey, config); return config; } finally { Gate.Release(); } }

    private Task<List<StoredUser>> GetStoredUsersAsync() => ReadAsync(UsersKey, new List<StoredUser>());
    public async Task<List<FrontendUserDto>> GetUsersAsync() => (await GetStoredUsersAsync()).Select(x => x.Profile).ToList();
    public async Task<FrontendUserDto?> GetUserAsync(string id) => (await GetStoredUsersAsync()).FirstOrDefault(x => x.Profile.Id == id)?.Profile;

    public async Task<FrontendUserDto?> AuthenticateAsync(string identifier, string password)
    {
        var normalized = identifier.Trim();
        var stored = (await GetStoredUsersAsync()).FirstOrDefault(x =>
            x.Profile.Email.Equals(normalized, StringComparison.OrdinalIgnoreCase) ||
            x.Profile.Username.Equals(normalized, StringComparison.OrdinalIgnoreCase));
        return stored is not null && BCrypt.Net.BCrypt.Verify(password, stored.PasswordHash) ? stored.Profile : null;
    }

    public async Task<FrontendUserDto> RegisterAsync(RegisterRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Email, password and full name are required.");
        if (request.Password.Length < 6) throw new ArgumentException("Password must be at least 6 characters.");
        await Gate.WaitAsync(); try
        {
            var users = await GetStoredUsersAsync();
            if (users.Any(x => x.Profile.Email.Equals(request.Email.Trim(), StringComparison.OrdinalIgnoreCase)))
                throw new InvalidOperationException("An account with this email already exists.");
            var playerId = Guid.NewGuid().ToString();
            var profile = new FrontendUserDto
            {
                Id = Guid.NewGuid().ToString(), Username = request.Email.Split('@')[0].Trim().ToLowerInvariant(), Email = request.Email.Trim().ToLowerInvariant(), FullName = request.FullName.Trim(),
                Nickname = string.IsNullOrWhiteSpace(request.Nickname) ? request.FullName.Split(' ')[0] : request.Nickname.Trim(),
                Role = "MEMBER", IsSelector = false, Status = "PENDING", Position = request.Position.ToUpperInvariant(),
                JerseyNumber = request.JerseyNumber, Notes = request.Notes, AppliedAt = DateTime.UtcNow.ToString("yyyy-MM-dd"), PlayerId = playerId
            };
            users.Insert(0, new StoredUser { Profile = profile, PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password) });
            var players = await GetPlayersAsync();
            players.Insert(0, NormalizePlayer(new FrontendPlayerDto
            {
                Id = playerId, FullName = profile.FullName, Nickname = profile.Nickname, Position = profile.Position,
                JerseyNumber = profile.JerseyNumber, RoleSpecialty = $"{profile.Position} Specialist", Status = "pending",
                Team = "pool", TacticalNotes = profile.Notes, MemberSince = DateTime.UtcNow.Year.ToString()
            }));
            await WriteAsync(UsersKey, users); await WriteAsync(PlayersKey, players); return profile;
        } finally { Gate.Release(); }
    }

    public async Task<FrontendUserDto?> UpdateUserAsync(string id, FrontendUserDto updates)
    {
        await Gate.WaitAsync(); try
        {
            var users = await GetStoredUsersAsync(); var stored = users.FirstOrDefault(x => x.Profile.Id == id); if (stored is null) return null;
            updates.Id = id; updates.Email = stored.Profile.Email; updates.Role = stored.Profile.Role; updates.Status = stored.Profile.Status;
            updates.IsSelector = stored.Profile.IsSelector; updates.AppliedAt = stored.Profile.AppliedAt; updates.ApprovedAt = stored.Profile.ApprovedAt;
            updates.PlayerId = stored.Profile.PlayerId; stored.Profile = updates;
            var players = await GetPlayersAsync(); var player = players.FirstOrDefault(x => x.Id == updates.PlayerId);
            if (player is not null)
            {
                player.FullName = updates.FullName; player.Nickname = updates.Nickname; player.Position = updates.Position;
                player.JerseyNumber = updates.JerseyNumber; player.TacticalNotes = updates.Notes;
                await WriteAsync(PlayersKey, players);
            }
            await WriteAsync(UsersKey, users); return stored.Profile;
        } finally { Gate.Release(); }
    }

    public async Task<FrontendUserDto?> SetApprovalAsync(string id, string status)
    {
        status = status.ToUpperInvariant();
        if (status is not ("APPROVED" or "REJECTED")) throw new ArgumentException("Status must be APPROVED or REJECTED.");
        await Gate.WaitAsync(); try
        {
            var users = await GetStoredUsersAsync(); var stored = users.FirstOrDefault(x => x.Profile.Id == id); if (stored is null) return null;
            stored.Profile.Status = status; stored.Profile.ApprovedAt = status == "APPROVED" ? DateTime.UtcNow.ToString("yyyy-MM-dd") : null;
            var players = await GetPlayersAsync(); var player = players.FirstOrDefault(x => x.Id == stored.Profile.PlayerId);
            if (player is not null) player.Status = status == "APPROVED" ? "available" : "unavailable";
            await WriteAsync(UsersKey, users); await WriteAsync(PlayersKey, players); return stored.Profile;
        } finally { Gate.Release(); }
    }

    public async Task<FrontendUserDto?> SetSelectorAsync(string id, bool isSelector)
    {
        await Gate.WaitAsync(); try
        {
            var users = await GetStoredUsersAsync(); var stored = users.FirstOrDefault(x => x.Profile.Id == id); if (stored is null) return null;
            if (stored.Profile.Role != "ADMIN") stored.Profile.Role = isSelector ? "SELECTOR" : "MEMBER";
            stored.Profile.IsSelector = isSelector; await WriteAsync(UsersKey, users); return stored.Profile;
        } finally { Gate.Release(); }
    }

    public Task<FrontendRosterDto> GetRosterAsync() => ReadAsync(RosterKey, new FrontendRosterDto());
    public async Task<FrontendRosterDto> SaveRosterAsync(FrontendRosterDto roster) { roster.LockedAt = roster.IsLocked ? DateTimeOffset.UtcNow : null; await Gate.WaitAsync(); try { await WriteAsync(RosterKey, roster); return roster; } finally { Gate.Release(); } }
}
