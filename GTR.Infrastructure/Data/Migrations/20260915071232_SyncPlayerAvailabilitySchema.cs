using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GTR.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncPlayerAvailabilitySchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_PlayerAvailabilities",
                table: "PlayerAvailabilities");

            migrationBuilder.DropIndex(
                name: "IX_PlayerAvailabilities_MatchId_PlayerId",
                table: "PlayerAvailabilities");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "PlayerAvailabilities");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PlayerAvailabilities",
                table: "PlayerAvailabilities",
                columns: new[] { "MatchId", "PlayerId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_PlayerAvailabilities",
                table: "PlayerAvailabilities");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "PlayerAvailabilities",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_PlayerAvailabilities",
                table: "PlayerAvailabilities",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerAvailabilities_MatchId_PlayerId",
                table: "PlayerAvailabilities",
                columns: new[] { "MatchId", "PlayerId" },
                unique: true);
        }
    }
}
