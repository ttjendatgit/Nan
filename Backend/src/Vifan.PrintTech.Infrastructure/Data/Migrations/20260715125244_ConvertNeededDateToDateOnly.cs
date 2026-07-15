using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vifan.PrintTech.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ConvertNeededDateToDateOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateOnly>(
                name: "NeededDate",
                table: "QuoteRequests",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "NeededDate",
                table: "QuoteRequests",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);
        }
    }
}
