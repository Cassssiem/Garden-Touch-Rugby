using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GTR.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerAccounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PlayerId",
                table: "Accounts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_PlayerId",
                table: "Accounts",
                column: "PlayerId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Accounts_Players_PlayerId",
                table: "Accounts",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Accounts_Players_PlayerId",
                table: "Accounts");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_PlayerId",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "PlayerId",
                table: "Accounts");
        }
    }
}
