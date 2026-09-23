using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vifan.PrintTech.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddContentDocumentSeoFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CanonicalUrl",
                table: "ContentDocuments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SeoDescription",
                table: "ContentDocuments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SeoImageUrl",
                table: "ContentDocuments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SeoKeywords",
                table: "ContentDocuments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SeoTitle",
                table: "ContentDocuments",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CanonicalUrl",
                table: "ContentDocuments");

            migrationBuilder.DropColumn(
                name: "SeoDescription",
                table: "ContentDocuments");

            migrationBuilder.DropColumn(
                name: "SeoImageUrl",
                table: "ContentDocuments");

            migrationBuilder.DropColumn(
                name: "SeoKeywords",
                table: "ContentDocuments");

            migrationBuilder.DropColumn(
                name: "SeoTitle",
                table: "ContentDocuments");
        }
    }
}
