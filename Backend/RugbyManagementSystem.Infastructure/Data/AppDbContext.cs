using Microsoft.EntityFrameworkCore;
using RugbyManagementSystem.Domain.Entities;

namespace RugbyManagementSystem.Infastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<PlayerDetails> Players { get; set; }
        public DbSet<MatchDetails> Matches { get; set; }
        public DbSet<UserDetails> Users { get; set; }
        public DbSet<MatchPlayer> MatchPlayers { get; set; }
        public DbSet<AppDataDocument> AppDataDocuments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PlayerDetails>()
                .Property(p => p.Position)
                .HasConversion<string>();

            modelBuilder.Entity<MatchDetails>()
                .Property(m => m.Team)
                .HasConversion<string>();

            // Composite Primary Key for MatchPlayer
            modelBuilder.Entity<MatchPlayer>()
                .HasKey(mp => new { mp.PlayerId, mp.MatchId });

            modelBuilder.Entity<MatchPlayer>()
                .HasOne(mp => mp.Player)
                .WithMany(p => p.MatchPlayers)
                .HasForeignKey(mp => mp.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MatchPlayer>()
                .HasOne(mp => mp.Match)
                .WithMany(m => m.MatchPlayers)
                .HasForeignKey(mp => mp.MatchId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
