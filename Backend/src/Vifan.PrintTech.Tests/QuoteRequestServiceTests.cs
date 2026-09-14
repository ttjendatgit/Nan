using Vifan.PrintTech.Application.DTOs.QuoteRequests;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Infrastructure.Data;
using Vifan.PrintTech.Infrastructure.Repositories;
using Vifan.PrintTech.Infrastructure.Services;
using Xunit;
using static Vifan.PrintTech.Tests.TestEntityFactory;

namespace Vifan.PrintTech.Tests;

public class QuoteRequestServiceTests
{
    private static (QuoteRequestService Service, ApplicationDbContext Db) BuildService()
    {
        var db = TestDbContextFactory.Create();
        var pricingService = new PricingService(
            new ProductRepository(db),
            new ProductOptionRepository(db),
            new PricingRuleRepository(db));
        var service = new QuoteRequestService(
            new QuoteRequestRepository(db),
            new ProductRepository(db),
            pricingService,
            new UnitOfWork(db));
        return (service, db);
    }

    private static CreateQuoteRequestRequest NewRequest(Guid productId, int quantity, params Guid[] optionIds) => new()
    {
        ProductId = productId,
        FullName = "Nguyễn Văn An",
        Phone = "0901234567",
        Quantity = quantity,
        SelectedOptionIds = optionIds
    };

    [Fact]
    public async Task CreateAsync_WithAssignedOption_RecalculatesServerSideAndSnapshotsCatalogData()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        var assignment = NewAssignment(product.Id, definition.Id);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        db.ProductOptions.Add(assignment);
        await db.SaveChangesAsync();

        var dto = await service.CreateAsync(NewRequest(product.Id, 500, assignment.Id));

        Assert.Equal(9_000m, dto.BaseUnitPriceSnapshot);
        Assert.Equal(10_500m, dto.CalculatedUnitPriceSnapshot);
        Assert.Equal(5_250_000m, dto.CalculatedSubtotalSnapshot);
        Assert.Single(dto.Options);
        Assert.Equal("Nan tre", dto.Options[0].OptionValueSnapshot);
        Assert.Equal(definition.Id, dto.Options[0].OptionDefinitionId);
        Assert.Equal(1_500m, dto.Options[0].PriceAdjustmentSnapshot);
        Assert.Equal(750_000m, dto.Options[0].CalculatedAmountSnapshot);
    }

    [Fact]
    public async Task CreateAsync_OptionNotAssignedToProduct_IsRejectedServerSide()
    {
        var (service, db) = BuildService();
        var productA = NewProduct(name: "A");
        var productB = NewProduct(name: "B");
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        var assignmentToB = NewAssignment(productB.Id, definition.Id);
        db.Products.AddRange(productA, productB);
        db.OptionDefinitions.Add(definition);
        db.ProductOptions.Add(assignmentToB);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.CreateAsync(NewRequest(productA.Id, 10, assignmentToB.Id)));
    }

    [Fact]
    public async Task CreateAsync_QuantityBelowProductMinimum_IsRejectedServerSide()
    {
        var (service, db) = BuildService();
        var product = NewProduct(minQuantity: 200);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CreateAsync(NewRequest(product.Id, 50)));
    }

    [Fact]
    public async Task CatalogPriceChangeAfterSubmission_DoesNotAlterExistingQuoteSnapshot_NewQuoteUsesNewPrice()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        var assignment = NewAssignment(product.Id, definition.Id);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        db.ProductOptions.Add(assignment);
        await db.SaveChangesAsync();

        // Day 1: customer submits a quote at the current catalog price.
        var oldQuote = await service.CreateAsync(NewRequest(product.Id, 500, assignment.Id));
        Assert.Equal(1_500m, oldQuote.Options[0].PriceAdjustmentSnapshot);
        Assert.Equal(10_500m, oldQuote.CalculatedUnitPriceSnapshot);

        // Day 10: admin changes the CATALOG price (not the assignment, not the product).
        definition.AdditionalPrice = 2_000m;
        db.OptionDefinitions.Update(definition);
        await db.SaveChangesAsync();

        // Old quote, re-fetched, must still show the price as it was at submission time.
        var refetchedOld = await service.GetByIdAsync(oldQuote.Id);
        Assert.Equal(1_500m, refetchedOld.Options[0].PriceAdjustmentSnapshot);
        Assert.Equal(10_500m, refetchedOld.CalculatedUnitPriceSnapshot);
        Assert.Equal(5_250_000m, refetchedOld.CalculatedSubtotalSnapshot);

        // New Product pricing (a live calculation) and a brand-new quote must both use the new price.
        var newQuote = await service.CreateAsync(NewRequest(product.Id, 500, assignment.Id));
        Assert.Equal(2_000m, newQuote.Options[0].PriceAdjustmentSnapshot);
        Assert.Equal(11_000m, newQuote.CalculatedUnitPriceSnapshot);
    }

    [Fact]
    public async Task RenamingCatalogEntry_DoesNotAlterOldQuoteSnapshotValue()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var definition = NewDefinition(OptionType.Finishing, "Nan tre thường", 1_500m);
        var assignment = NewAssignment(product.Id, definition.Id);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        db.ProductOptions.Add(assignment);
        await db.SaveChangesAsync();

        var quote = await service.CreateAsync(NewRequest(product.Id, 10, assignment.Id));
        Assert.Equal("Nan tre thường", quote.Options[0].OptionValueSnapshot);

        definition.OptionValue = "Nan tre cao cấp";
        db.OptionDefinitions.Update(definition);
        await db.SaveChangesAsync();

        var refetched = await service.GetByIdAsync(quote.Id);
        Assert.Equal("Nan tre thường", refetched.Options[0].OptionValueSnapshot);
    }

    [Fact]
    public async Task DeactivatingCatalogEntry_DoesNotAlterOldQuote()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        var assignment = NewAssignment(product.Id, definition.Id);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        db.ProductOptions.Add(assignment);
        await db.SaveChangesAsync();

        var quote = await service.CreateAsync(NewRequest(product.Id, 10, assignment.Id));

        definition.IsActive = false;
        db.OptionDefinitions.Update(definition);
        await db.SaveChangesAsync();

        var refetched = await service.GetByIdAsync(quote.Id);
        Assert.Equal("Nan tre", refetched.Options[0].OptionValueSnapshot);
        Assert.Equal(1_500m, refetched.Options[0].PriceAdjustmentSnapshot);
    }

    [Fact]
    public async Task SafeDeletionOfCatalogEntry_DoesNotCorruptOldQuote()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        var assignment = NewAssignment(product.Id, definition.Id);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        db.ProductOptions.Add(assignment);
        await db.SaveChangesAsync();

        var quote = await service.CreateAsync(NewRequest(product.Id, 10, assignment.Id));

        // Safe deletion path: remove the assignment first (routine action), then hard-delete the
        // now-unreferenced-by-any-product catalog entry (quote history still references it via
        // the soft FK, so a real OptionDefinitionService.DeleteAsync would still reject this --
        // here we exercise the DB-level guarantee directly: even if it WERE removed, history survives).
        db.ProductOptions.Remove(assignment);
        await db.SaveChangesAsync();
        db.OptionDefinitions.Remove(definition);
        await db.SaveChangesAsync();

        var refetched = await service.GetByIdAsync(quote.Id);
        Assert.Equal("Nan tre", refetched.Options[0].OptionValueSnapshot);
        Assert.Equal(1_500m, refetched.Options[0].PriceAdjustmentSnapshot);
        Assert.Null(refetched.Options[0].OptionDefinitionId); // soft FK nulled, snapshot text/price intact
    }

    [Fact]
    public void CreateQuoteRequestRequest_ExposesNoClientSuppliedPriceField()
    {
        var priceLikeProperties = typeof(CreateQuoteRequestRequest)
            .GetProperties()
            .Where(p => p.Name.Contains("price", StringComparison.OrdinalIgnoreCase)
                     || p.Name.Contains("total", StringComparison.OrdinalIgnoreCase)
                     || p.Name.Contains("amount", StringComparison.OrdinalIgnoreCase));

        Assert.Empty(priceLikeProperties);
    }

    [Fact]
    public async Task SetFinalQuotedPriceAsync_IsAdditiveAndNeverOverwritesCalculatedSnapshot()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var quote = await service.CreateAsync(NewRequest(product.Id, 500));
        var originalCalculated = quote.CalculatedTotalSnapshot;

        var updated = await service.SetFinalQuotedPriceAsync(quote.Id, new SetFinalQuotedPriceRequest
        {
            FinalQuotedPrice = 7_000_000m,
            ManualAdjustment = -100_000m,
            InternalNote = "Giảm giá khách quen"
        });

        Assert.Equal(originalCalculated, updated.CalculatedTotalSnapshot);
        Assert.Equal(7_000_000m, updated.FinalQuotedPrice);
        Assert.Equal(-100_000m, updated.ManualAdjustment);
    }

    [Fact]
    public async Task CreateAsync_GeneralInquiryWithoutProduct_SkipsPricingEntirely()
    {
        var (service, _) = BuildService();

        var dto = await service.CreateAsync(new CreateQuoteRequestRequest
        {
            FullName = "Nguyễn Văn An",
            Phone = "0901234567",
            Quantity = 100
        });

        Assert.Null(dto.CalculatedTotalSnapshot);
        Assert.Empty(dto.Options);
    }
}
