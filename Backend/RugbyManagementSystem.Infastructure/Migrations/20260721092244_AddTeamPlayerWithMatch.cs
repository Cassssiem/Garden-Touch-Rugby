using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RugbyManagementSystem.Infastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamPlayerWithMatch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TeamPlayers_Teams_TeamId",
                table: "TeamPlayers");

            migrationBuilder.DropTable(
                name: "Teams");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TeamPlayers",
                table: "TeamPlayers");

            migrationBuilder.DropIndex(
                name: "IX_TeamPlayers_TeamId",
                table: "TeamPlayers");

            migrationBuilder.DropColumn(
                name: "TeamId",
                table: "TeamPlayers");

            migrationBuilder.AddColumn<int>(
                name: "MatchId",
                table: "TeamPlayers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_TeamPlayers",
                table: "TeamPlayers",
                columns: new[] { "PlayerId", "MatchId", "Team" });

            migrationBuilder.CreateIndex(
                name: "IX_TeamPlayers_MatchId",
                table: "TeamPlayers",
                column: "MatchId");

            migrationBuilder.AddForeignKey(
                name: "FK_TeamPlayers_Matches_MatchId",
                table: "TeamPlayers",
                column: "MatchId",
                principalTable: "Matches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TeamPlayers_Matches_MatchId",
                table: "TeamPlayers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TeamPlayers",
                table: "TeamPlayers");

            migrationBuilder.DropIndex(
                name: "IX_TeamPlayers_MatchId",
                table: "TeamPlayers");

            migrationBuilder.DropColumn(
                name: "MatchId",
                table: "TeamPlayers");

            migrationBuilder.AddColumn<int>(
                name: "TeamId",
                table: "TeamPlayers",
                type: "int",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_TeamPlayers",
                table: "TeamPlayers",
                columns: new[] { "PlayerId", "Team" });

            migrationBuilder.CreateTable(
                name: "Teams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teams", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeamPlayers_TeamId",
                table: "TeamPlayers",
                column: "TeamId");

            migrationBuilder.AddForeignKey(
                name: "FK_TeamPlayers_Teams_TeamId",
                table: "TeamPlayers",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id");
        }
    }
}
