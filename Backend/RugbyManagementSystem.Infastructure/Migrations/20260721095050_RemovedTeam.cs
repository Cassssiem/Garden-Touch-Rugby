using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RugbyManagementSystem.Infastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemovedTeam : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Position",
                table: "MatchPlayers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Team",
                table: "MatchPlayers",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Position",
                table: "MatchPlayers");

            migrationBuilder.DropColumn(
                name: "Team",
                table: "MatchPlayers");
        }
    }
}
