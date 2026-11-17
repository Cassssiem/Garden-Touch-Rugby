namespace RugbyManagementSystem.Application.DTOs.Frontend;

public sealed class FrontendRecentFormDto
{
    public string Round { get; set; } = string.Empty;
    public string Team { get; set; } = "TEAM RED";
    public string Result { get; set; } = "D";
    public string Score { get; set; } = string.Empty;
    public int Tries { get; set; }
    public string ChuckersText { get; set; } = string.Empty;
    public bool? IsMvp { get; set; }
    public string? Note { get; set; }
}

public sealed class FrontendPlayerDto
{
    public string Id { get; set; } = string.Empty;
    public string JerseyNumber { get; set; } = string.Empty;
    public string Nickname { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Position { get; set; } = "MIDDLE";
    public string? SecondaryPosition { get; set; }
    public string RoleSpecialty { get; set; } = string.Empty;
    public string Status { get; set; } = "available";
    public Dictionary<string, string> AvailabilityByDate { get; set; } = [];
    public string Team { get; set; } = "pool";
    public bool? IsSub { get; set; }
    public int Caps { get; set; }
    public int ChuckersPlayed { get; set; }
    public int ChuckersWon { get; set; }
    public int Tries { get; set; }
    public int Mvps { get; set; }
    public string? AvatarUrl { get; set; }
    public int? HeightCm { get; set; }
    public int? WeightKg { get; set; }
    public double? SpeedIndex { get; set; }
    public string? MemberSince { get; set; }
    public string? TacticalNotes { get; set; }
    public List<FrontendRecentFormDto>? RecentForm { get; set; }
}

public sealed class FrontendChuckerScoreDto
{
    public int ChuckerNumber { get; set; }
    public int RedScore { get; set; }
    public int BlackScore { get; set; }
    public string ElapsedTime { get; set; } = string.Empty;
    public string Winner { get; set; } = "DRAW";
}

public sealed class FrontendMatchDto
{
    public int RoundNumber { get; set; }
    public string Date { get; set; } = string.Empty;
    public int? Year { get; set; }
    public bool? IsPlayed { get; set; }
    public string? FormatNotes { get; set; }
    public List<FrontendChuckerScoreDto> Chuckers { get; set; } = [];
    public int RedTotalTries { get; set; }
    public int BlackTotalTries { get; set; }
    public string SeriesWinner { get; set; } = "TBA";
    public string SeriesScore { get; set; } = "TBA";
    public string MvpPlayerId { get; set; } = string.Empty;
    public string MvpCitation { get; set; } = string.Empty;
    public Dictionary<string, int> RedScorers { get; set; } = [];
    public Dictionary<string, int> BlackScorers { get; set; } = [];
    public List<string>? RedLineup { get; set; }
    public List<string>? BlackLineup { get; set; }
    public bool? IsFinalized { get; set; }
    public DateTimeOffset? FinalizedAt { get; set; }
    public string? CorrectionReason { get; set; }
}

public sealed class FrontendPhotoDto
{
    public string Id { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public string Fixture { get; set; } = string.Empty;
    public string Photographer { get; set; } = string.Empty;
    public List<string> TaggedPlayerIds { get; set; } = [];
    public int Likes { get; set; }
    public bool? IsPinned { get; set; }
    public string Date { get; set; } = string.Empty;
    public string TagCategory { get; set; } = "all";
}

public sealed class FrontendClubConfigDto
{
    public string ClubName { get; set; } = "GARDENS RFC";
    public string Tagline { get; set; } = "TOUCH RUGBY • EST. 1879";
    public string EstablishedYear { get; set; } = "1879";
    public int MatchdayCycle { get; set; } = 1;
    public string NextMatchdayDate { get; set; } = "Wednesday 18:30 Kickoff";
    public string KickoffTime { get; set; } = "18:30";
}

public sealed class FrontendUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Nickname { get; set; } = string.Empty;
    public string Role { get; set; } = "MEMBER";
    public bool? IsSelector { get; set; }
    public string Status { get; set; } = "PENDING";
    public string Position { get; set; } = "MIDDLE";
    public string JerseyNumber { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string AppliedAt { get; set; } = string.Empty;
    public string? ApprovedAt { get; set; }
    public string? PlayerId { get; set; }
}

public sealed class RegisterRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Nickname { get; set; } = string.Empty;
    public string Position { get; set; } = "MIDDLE";
    public string JerseyNumber { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public sealed class FrontendLoginRequestDto
{
    public string Identifier { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public sealed class FrontendAuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public FrontendUserDto User { get; set; } = new();
}

public sealed class ApprovalRequestDto
{
    public string Status { get; set; } = "APPROVED";
    public string? Reason { get; set; }
}

public sealed class SelectorRequestDto
{
    public bool IsSelector { get; set; }
}

public sealed class FrontendRosterDto
{
    public bool IsLocked { get; set; }
    public DateTimeOffset? LockedAt { get; set; }
    public List<string> RedPlayerIds { get; set; } = [];
    public List<string> BlackPlayerIds { get; set; } = [];
}
