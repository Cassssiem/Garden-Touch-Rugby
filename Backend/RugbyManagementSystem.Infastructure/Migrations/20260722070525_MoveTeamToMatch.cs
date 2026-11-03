using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RugbyManagementSystem.Infastructure.Migrations
{
    /// <inheritdoc />
    public partial class MoveTeamToMatch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Team",
                table: "MatchPlayers");

            migrationBuilder.AddColumn<string>(
                name: "Team",
                table: "Matches",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Team",
                table: "Matches");

            migrationBuilder.AddColumn<string>(
                name: "Team",
                table: "MatchPlayers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
