using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GTR.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueMatchDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Matches_MatchDate",
                table: "Matches",
                column: "MatchDate",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Matches_MatchDate",
                table: "Matches");
        }
    }
}
