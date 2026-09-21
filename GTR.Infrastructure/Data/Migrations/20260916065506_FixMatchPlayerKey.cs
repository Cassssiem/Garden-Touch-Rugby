using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GTR.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixMatchPlayerKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_MatchPlayers",
                table: "MatchPlayers");

            migrationBuilder.DropIndex(
                name: "IX_MatchPlayers_MatchId_PlayerId",
                table: "MatchPlayers");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "MatchPlayers");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MatchPlayers",
                table: "MatchPlayers",
                columns: new[] { "MatchId", "PlayerId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_MatchPlayers",
                table: "MatchPlayers");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "MatchPlayers",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_MatchPlayers",
                table: "MatchPlayers",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_MatchPlayers_MatchId_PlayerId",
                table: "MatchPlayers",
                columns: new[] { "MatchId", "PlayerId" },
                unique: true);
        }
    }
}
