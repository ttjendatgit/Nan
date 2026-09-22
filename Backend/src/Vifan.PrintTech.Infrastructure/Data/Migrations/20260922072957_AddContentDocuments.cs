using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vifan.PrintTech.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddContentDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ContentDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    BlocksJson = table.Column<string>(type: "text", nullable: true),
                    DraftBlocksJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContentDocuments_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContentDocuments_ProductId",
                table: "ContentDocuments",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentDocuments_Status",
                table: "ContentDocuments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ContentDocuments_Type",
                table: "ContentDocuments",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_ContentDocuments_Type_Slug",
                table: "ContentDocuments",
                columns: new[] { "Type", "Slug" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContentDocuments");
        }
    }
}
