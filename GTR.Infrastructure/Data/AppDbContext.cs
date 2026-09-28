using GTR.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GTR.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(
            DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Player> Players { get; set; }
        public DbSet<Match> Matches { get; set; }
        public DbSet<MatchPlayer> MatchPlayers { get; set; }
        public DbSet<PlayerAvailability> PlayerAvailabilities { get; set; }
        public DbSet<ChuckerResult> ChuckerResults { get; set; }
        public DbSet<Account> Accounts { get; set; }

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Player>(entity =>
            {
                entity.HasKey(player => player.Id);

                entity.Property(player => player.FirstName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(player => player.LastName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(player => player.Nickname)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(player => player.ImageUrl)
                    .HasMaxLength(500);

                entity.Property(player => player.Bio)
                    .HasMaxLength(1000);
            });

            modelBuilder.Entity<Match>(entity =>
            {
                entity.HasKey(match => match.Id);

                entity.Property(match => match.MatchDate)
                    .IsRequired();

                entity.Property(match => match.Status)
                    .IsRequired();

                entity.HasOne(match => match.MvpPlayer)
                    .WithMany()
                    .HasForeignKey(match => match.MvpPlayerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(match => match.MatchDate)
                    .IsUnique();
            });

            modelBuilder.Entity<MatchPlayer>(entity =>
            {
                entity.HasKey(matchPlayer => new
                {
                    matchPlayer.MatchId,
                    matchPlayer.PlayerId
                });

                entity.Property(matchPlayer =>
                        matchPlayer.Tries)
                    .HasDefaultValue(0)
                    .IsRequired();

                entity.HasOne(matchPlayer =>
                        matchPlayer.Match)
                    .WithMany(match =>
                        match.MatchPlayers)
                    .HasForeignKey(matchPlayer =>
                        matchPlayer.MatchId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(matchPlayer =>
                        matchPlayer.Player)
                    .WithMany(player =>
                        player.MatchPlayers)
                    .HasForeignKey(matchPlayer =>
                        matchPlayer.PlayerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<PlayerAvailability>(
                entity =>
                {
                    entity.HasKey(availability => new
                    {
                        availability.MatchId,
                        availability.PlayerId
                    });

                    entity.Property(availability =>
                            availability.IsAvailable)
                        .IsRequired();

                    entity.Property(availability =>
                            availability.UpdatedAtUtc)
                        .IsRequired();

                    entity.HasOne(availability =>
                            availability.Match)
                        .WithMany(match =>
                            match.PlayerAvailabilities)
                        .HasForeignKey(availability =>
                            availability.MatchId)
                        .OnDelete(DeleteBehavior.Cascade);

                    entity.HasOne(availability =>
                            availability.Player)
                        .WithMany(player =>
                            player.AvailabilityRecords)
                        .HasForeignKey(availability =>
                            availability.PlayerId)
                        .OnDelete(DeleteBehavior.Restrict);
                }
            );

            modelBuilder.Entity<ChuckerResult>(entity =>
            {
                entity.HasKey(result => result.Id);

                entity.HasIndex(result => new
                {
                    result.MatchId,
                    result.ChuckerNumber
                })
                .IsUnique();

                entity.Property(result =>
                        result.ChuckerNumber)
                    .IsRequired();

                entity.ToTable(
                    "ChuckerResults",
                    table =>
                    {
                        table.HasCheckConstraint(
                            "CK_ChuckerResult_Number",
                            "\"ChuckerNumber\" BETWEEN 1 AND 3"
                        );
                    }
                );

                entity.HasOne(result => result.Match)
                    .WithMany(match =>
                        match.ChuckerResults)
                    .HasForeignKey(result =>
                        result.MatchId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Account>(entity =>
            {
                entity.HasKey(account => account.Id);

                entity.Property(account =>
                        account.Username)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(account =>
                        account.NormalizedUsername)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(account =>
                        account.PasswordHash)
                    .HasMaxLength(500)
                    .IsRequired();

                entity.Property(account => account.Role)
                    .IsRequired();

                entity.Property(account =>
                        account.IsActive)
                    .IsRequired();

                entity.Property(account =>
                        account.CreatedAtUtc)
                    .IsRequired();

                entity.HasIndex(account =>
                        account.NormalizedUsername)
                    .IsUnique();

                entity.HasOne(account => account.Player)
                    .WithMany()
                    .HasForeignKey(account => account.PlayerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(account => account.PlayerId)
                    .IsUnique();   // one login per player (NULLs are allowed many times)
            });
        }
    }
}