using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vifan.PrintTech.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOptionPricingAndQuoteSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AdditionalFeesSnapshot",
                table: "QuoteRequests",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AppliedPricingRuleIdSnapshot",
                table: "QuoteRequests",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BaseUnitPriceSnapshot",
                table: "QuoteRequests",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CalculatedSubtotalSnapshot",
                table: "QuoteRequests",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CalculatedTotalSnapshot",
                table: "QuoteRequests",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CalculatedUnitPriceSnapshot",
                table: "QuoteRequests",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "QuoteRequests",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "VND");

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountAmountSnapshot",
                table: "QuoteRequests",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FinalQuotedPrice",
                table: "QuoteRequests",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InternalNote",
                table: "QuoteRequests",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ManualAdjustment",
                table: "QuoteRequests",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PriceAdjustmentType",
                table: "ProductOptions",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "FixedPerUnit");

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "ProductOptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "QuoteRequestOptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    QuoteRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductOptionId = table.Column<Guid>(type: "uuid", nullable: true),
                    OptionTypeSnapshot = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OptionNameSnapshot = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OptionValueSnapshot = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PriceAdjustmentTypeSnapshot = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PriceAdjustmentSnapshot = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CalculatedAmountSnapshot = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuoteRequestOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuoteRequestOptions_ProductOptions_ProductOptionId",
                        column: x => x.ProductOptionId,
                        principalTable: "ProductOptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_QuoteRequestOptions_QuoteRequests_QuoteRequestId",
                        column: x => x.QuoteRequestId,
                        principalTable: "QuoteRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuoteRequestOptions_ProductOptionId",
                table: "QuoteRequestOptions",
                column: "ProductOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuoteRequestOptions_QuoteRequestId",
                table: "QuoteRequestOptions",
                column: "QuoteRequestId");

            // Behavior-preserving backfill: PricingService previously special-cased
            // OptionType=DeliverySpeed, OptionValue=Urgent as a flat per-order cost (not
            // multiplied by quantity). That special case is now replaced by the general
            // PriceAdjustmentType mechanism — every other existing option row defaults to
            // FixedPerUnit (its prior implicit behavior), so only Urgent rows need remapping
            // to FixedPerOrder to keep already-configured pricing identical after this migration.
            migrationBuilder.Sql(
                """
                UPDATE "ProductOptions"
                SET "PriceAdjustmentType" = 'FixedPerOrder'
                WHERE "OptionType" = 'DeliverySpeed' AND "OptionValue" ILIKE 'Urgent';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuoteRequestOptions");

            migrationBuilder.DropColumn(
                name: "AdditionalFeesSnapshot",
                table: "QuoteRequests");

            migrationBuilder.DropColumn(
                name: "AppliedPricingRuleIdSnapshot",
                table: "QuoteRequests");

            migrationBuilder.DropColumn(
                name: "BaseUnitPriceSnapshot",
                table: "QuoteRequests");

            migrationBuilder.DropColumn(
                name: "CalculatedSubtotalSnapshot",
                table: "QuoteRequests");

            migrationBuilder.DropColumn(
                name: "CalculatedTotalSnapshot",
                table: "QuoteRequests");

            migrationBuilder.DropColumn(
                name: "CalculatedUnitPriceSnapshot",
                table: "QuoteRequests");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "QuoteRequests");

            migrationBuilder.DropColumn(
                name: "DiscountAmountSnapshot",
                table: "QuoteRequests");

            migrationBuilder.DropColumn(
                name: "FinalQuotedPrice",
                table: "QuoteRequests");

            migrationBuilder.DropColumn(
                name: "InternalNote",
                table: "QuoteRequests");

            migrationBuilder.DropColumn(
                name: "ManualAdjustment",
                table: "QuoteRequests");

            migrationBuilder.DropColumn(
                name: "PriceAdjustmentType",
                table: "ProductOptions");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "ProductOptions");
        }
    }
}
