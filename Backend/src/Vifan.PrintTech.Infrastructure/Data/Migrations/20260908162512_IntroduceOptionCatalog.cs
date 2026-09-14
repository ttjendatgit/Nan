using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vifan.PrintTech.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class IntroduceOptionCatalog : Migration
    {
        // A single, portable SQL expression that derives a deterministic UUID from the 5 fields
        // that define a catalog entry's identity (OptionType, OptionName, OptionValue,
        // PriceAdjustmentType, AdditionalPrice), via md5() -- built into PostgreSQL core, no
        // pgcrypto/uuid-ossp extension required. Two ProductOptions rows with the SAME values
        // for all 5 fields deterministically produce the SAME id (so they collapse into one
        // OptionDefinition); rows that differ in ANY of the 5 -- most importantly price or
        // adjustment type -- produce DIFFERENT ids (so they become separate catalog entries,
        // never silently merged/overwritten).
        private const string DedupKeyExpr =
            "(\"OptionType\" || '|' || \"OptionName\" || '|' || \"OptionValue\" || '|' || \"PriceAdjustmentType\" || '|' || \"AdditionalPrice\"::text)";

        private static string DeterministicUuidExpr(string keyExpr) => $"""
            CAST(
                substring(md5({keyExpr}) from 1 for 8) || '-' ||
                substring(md5({keyExpr}) from 9 for 4) || '-' ||
                substring(md5({keyExpr}) from 13 for 4) || '-' ||
                substring(md5({keyExpr}) from 17 for 4) || '-' ||
                substring(md5({keyExpr}) from 21 for 12)
            AS uuid)
            """;

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── 1. Additive schema: new table, new nullable columns. Nothing destructive yet. ──

            migrationBuilder.CreateTable(
                name: "OptionDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OptionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OptionName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OptionValue = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PriceAdjustmentType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AdditionalPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OptionDefinitions", x => x.Id);
                });

            migrationBuilder.AddColumn<Guid>(
                name: "OptionDefinitionId",
                table: "ProductOptions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OptionDefinitionId",
                table: "QuoteRequestOptions",
                type: "uuid",
                nullable: true);

            // ── 2. Report (not block on) any pre-existing pricing conflicts, so whoever applies ──
            // this against real data sees exactly which catalog values diverged across products
            // and were therefore kept as separate entries rather than merged.
            migrationBuilder.Sql($"""
                DO $$
                DECLARE
                    conflict RECORD;
                BEGIN
                    FOR conflict IN
                        SELECT "OptionType", "OptionName", "OptionValue",
                               COUNT(DISTINCT ("PriceAdjustmentType", "AdditionalPrice")) AS variant_count
                        FROM "ProductOptions"
                        GROUP BY "OptionType", "OptionName", "OptionValue"
                        HAVING COUNT(DISTINCT ("PriceAdjustmentType", "AdditionalPrice")) > 1
                    LOOP
                        RAISE NOTICE 'Option catalog conflict: %/%/% has % differing price/adjustment-type variants across products -- each became a SEPARATE catalog entry (not merged). Review and consolidate manually in the /admin/options UI if this was unintentional.',
                            conflict."OptionType", conflict."OptionName", conflict."OptionValue", conflict.variant_count;
                    END LOOP;
                END $$;
                """);

            // ── 3. Backfill OptionDefinitions: one row per DISTINCT (type, name, value, ──
            // adjustment type, price) combination found across all existing ProductOptions rows.
            // IsActive is bool_or() across the source rows: if any product had this exact
            // combination active, the resulting catalog entry starts active (the conservative
            // choice that preserves current customer-facing behavior).
            migrationBuilder.Sql($"""
                INSERT INTO "OptionDefinitions"
                    ("Id", "OptionType", "OptionName", "OptionValue", "PriceAdjustmentType", "AdditionalPrice", "SortOrder", "IsActive", "CreatedAt", "UpdatedAt")
                SELECT
                    {DeterministicUuidExpr(DedupKeyExpr)},
                    "OptionType", "OptionName", "OptionValue", "PriceAdjustmentType", "AdditionalPrice",
                    0,
                    bool_or("IsActive"),
                    now(),
                    now()
                FROM "ProductOptions"
                GROUP BY "OptionType", "OptionName", "OptionValue", "PriceAdjustmentType", "AdditionalPrice";
                """);

            // ── 4. Point every existing ProductOptions row at its matching new OptionDefinition, ──
            // using the exact same deterministic key so no join/temp-table is needed.
            migrationBuilder.Sql($"""
                UPDATE "ProductOptions"
                SET "OptionDefinitionId" = {DeterministicUuidExpr(DedupKeyExpr)};
                """);

            // ── 5. Backfill QuoteRequestOptions' new soft-reference column via the OLD ──
            // ProductOptionId (still present at this point) -> ProductOptions.OptionDefinitionId
            // (just populated above). Rows whose ProductOptionId was already NULL (from a
            // pre-migration hard-delete) stay NULL -- identical, correct prior behavior.
            migrationBuilder.Sql("""
                UPDATE "QuoteRequestOptions" qro
                SET "OptionDefinitionId" = po."OptionDefinitionId"
                FROM "ProductOptions" po
                WHERE qro."ProductOptionId" = po."Id";
                """);

            // ── 6. Now that every row has been migrated, drop the old, now-redundant columns ──
            // and the FK that pointed at the per-product assignment row.
            migrationBuilder.DropForeignKey(
                name: "FK_QuoteRequestOptions_ProductOptions_ProductOptionId",
                table: "QuoteRequestOptions");

            migrationBuilder.DropIndex(
                name: "IX_QuoteRequestOptions_ProductOptionId",
                table: "QuoteRequestOptions");

            migrationBuilder.DropColumn(
                name: "ProductOptionId",
                table: "QuoteRequestOptions");

            migrationBuilder.DropIndex(
                name: "IX_ProductOptions_ProductId_OptionType_OptionValue",
                table: "ProductOptions");

            migrationBuilder.DropColumn(name: "AdditionalPrice", table: "ProductOptions");
            migrationBuilder.DropColumn(name: "OptionName", table: "ProductOptions");
            migrationBuilder.DropColumn(name: "OptionType", table: "ProductOptions");
            migrationBuilder.DropColumn(name: "OptionValue", table: "ProductOptions");
            migrationBuilder.DropColumn(name: "PriceAdjustmentType", table: "ProductOptions");

            // ── 7. Every ProductOptions row now has a non-null OptionDefinitionId (step 4 ──
            // updated all of them unconditionally) -- safe to tighten to NOT NULL and add the
            // real FK/indexes.
            migrationBuilder.AlterColumn<Guid>(
                name: "OptionDefinitionId",
                table: "ProductOptions",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuoteRequestOptions_OptionDefinitionId",
                table: "QuoteRequestOptions",
                column: "OptionDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductOptions_OptionDefinitionId",
                table: "ProductOptions",
                column: "OptionDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductOptions_ProductId_OptionDefinitionId",
                table: "ProductOptions",
                columns: new[] { "ProductId", "OptionDefinitionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OptionDefinitions_OptionType_OptionValue",
                table: "OptionDefinitions",
                columns: new[] { "OptionType", "OptionValue" });

            migrationBuilder.AddForeignKey(
                name: "FK_ProductOptions_OptionDefinitions_OptionDefinitionId",
                table: "ProductOptions",
                column: "OptionDefinitionId",
                principalTable: "OptionDefinitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_QuoteRequestOptions_OptionDefinitions_OptionDefinitionId",
                table: "QuoteRequestOptions",
                column: "OptionDefinitionId",
                principalTable: "OptionDefinitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductOptions_OptionDefinitions_OptionDefinitionId",
                table: "ProductOptions");

            migrationBuilder.DropForeignKey(
                name: "FK_QuoteRequestOptions_OptionDefinitions_OptionDefinitionId",
                table: "QuoteRequestOptions");

            migrationBuilder.AddColumn<decimal>(
                name: "AdditionalPrice",
                table: "ProductOptions",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "OptionName",
                table: "ProductOptions",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OptionType",
                table: "ProductOptions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OptionValue",
                table: "ProductOptions",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PriceAdjustmentType",
                table: "ProductOptions",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            // Restore the catalog fields on ProductOptions from the (about-to-be-dropped)
            // OptionDefinitions table via the join that's still available at this point.
            migrationBuilder.Sql("""
                UPDATE "ProductOptions" po
                SET "OptionType" = od."OptionType",
                    "OptionName" = od."OptionName",
                    "OptionValue" = od."OptionValue",
                    "PriceAdjustmentType" = od."PriceAdjustmentType",
                    "AdditionalPrice" = od."AdditionalPrice"
                FROM "OptionDefinitions" od
                WHERE po."OptionDefinitionId" = od."Id";
                """);

            migrationBuilder.AddColumn<Guid>(
                name: "ProductOptionId",
                table: "QuoteRequestOptions",
                type: "uuid",
                nullable: true);

            // Best-effort restore: only survives if exactly one ProductOptions row still maps to
            // that OptionDefinitionId (rollback is a best-effort safety net, not guaranteed
            // lossless once multiple products have been assigned the same catalog entry).
            migrationBuilder.Sql("""
                UPDATE "QuoteRequestOptions" qro
                SET "ProductOptionId" = po."Id"
                FROM "ProductOptions" po
                WHERE qro."OptionDefinitionId" = po."OptionDefinitionId"
                AND (SELECT COUNT(*) FROM "ProductOptions" p2 WHERE p2."OptionDefinitionId" = qro."OptionDefinitionId") = 1;
                """);

            migrationBuilder.DropIndex(
                name: "IX_QuoteRequestOptions_OptionDefinitionId",
                table: "QuoteRequestOptions");

            migrationBuilder.DropIndex(
                name: "IX_ProductOptions_OptionDefinitionId",
                table: "ProductOptions");

            migrationBuilder.DropIndex(
                name: "IX_ProductOptions_ProductId_OptionDefinitionId",
                table: "ProductOptions");

            migrationBuilder.DropColumn(
                name: "OptionDefinitionId",
                table: "QuoteRequestOptions");

            migrationBuilder.DropColumn(
                name: "OptionDefinitionId",
                table: "ProductOptions");

            migrationBuilder.DropTable(
                name: "OptionDefinitions");

            migrationBuilder.CreateIndex(
                name: "IX_ProductOptions_ProductId_OptionType_OptionValue",
                table: "ProductOptions",
                columns: new[] { "ProductId", "OptionType", "OptionValue" });

            migrationBuilder.CreateIndex(
                name: "IX_QuoteRequestOptions_ProductOptionId",
                table: "QuoteRequestOptions",
                column: "ProductOptionId");

            migrationBuilder.AddForeignKey(
                name: "FK_QuoteRequestOptions_ProductOptions_ProductOptionId",
                table: "QuoteRequestOptions",
                column: "ProductOptionId",
                principalTable: "ProductOptions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
