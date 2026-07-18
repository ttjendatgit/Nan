using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vifan.PrintTech.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductContentBlocks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentBlocksJson",
                table: "Products",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContentBlocksJson",
                table: "Products");
        }
    }
}
