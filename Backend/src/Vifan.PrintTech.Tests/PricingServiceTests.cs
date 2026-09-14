using Vifan.PrintTech.Application.DTOs.Pricing;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Infrastructure.Data;
using Vifan.PrintTech.Infrastructure.Repositories;
using Vifan.PrintTech.Infrastructure.Services;
using Xunit;
using static Vifan.PrintTech.Tests.TestEntityFactory;

namespace Vifan.PrintTech.Tests;

public class PricingServiceTests
{
    private static (PricingService Service, ApplicationDbContext Db) BuildService()
    {
        var db = TestDbContextFactory.Create();
        var service = new PricingService(
            new ProductRepository(db),
            new ProductOptionRepository(db),
            new PricingRuleRepository(db));
        return (service, db);
    }

    [Fact]
    public async Task CalculateAsync_NoPricingRule_FallsBackToProductBasePrice()
    {
        var (service, db) = BuildService();
        var product = NewProduct(basePrice: 15_000m);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var result = await service.CalculateAsync(new CalculatePriceRequest
        {
            ProductId = product.Id,
            Quantity = 100,
            SelectedOptionIds = []
        });

        Assert.Equal(15_000m, result.BaseUnitPrice);
        Assert.Null(result.AppliedPricingRuleId);
        Assert.Equal(1_500_000m, result.EstimatedPrice);
        Assert.Equal(result.EstimatedPrice, result.CalculatedTotal);
    }

    [Fact]
    public async Task CalculateAsync_MatchingPricingRule_UsesRuleBasePriceAndQuantityBoundaries()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        db.Products.Add(product);
        db.PricingRules.Add(new PricingRule
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            MinQuantity = 500,
            MaxQuantity = 999,
            BaseUnitPrice = 9_000m,
            IsActive = true
        });
        await db.SaveChangesAsync();

        var atMin = await service.CalculateAsync(new CalculatePriceRequest { ProductId = product.Id, Quantity = 500 });
        Assert.Equal(9_000m, atMin.BaseUnitPrice);

        var atMax = await service.CalculateAsync(new CalculatePriceRequest { ProductId = product.Id, Quantity = 999 });
        Assert.Equal(9_000m, atMax.BaseUnitPrice);

        var outside = await service.CalculateAsync(new CalculatePriceRequest { ProductId = product.Id, Quantity = 1000 });
        Assert.Equal(product.BasePrice, outside.BaseUnitPrice);
        Assert.Null(outside.AppliedPricingRuleId);
    }

    [Fact]
    public async Task CalculateAsync_QuantityBelowMinimum_Throws()
    {
        var (service, db) = BuildService();
        var product = NewProduct(minQuantity: 200);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CalculateAsync(new CalculatePriceRequest { ProductId = product.Id, Quantity = 199 }));
    }

    [Fact]
    public async Task CalculateAsync_AssignedFixedPerUnitOption_IsMultipliedByQuantity()
    {
        var (service, db) = BuildService();
        var product = NewProduct(basePrice: 9_000m);
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m, PriceAdjustmentType.FixedPerUnit);
        var assignment = NewAssignment(product.Id, definition.Id);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        db.ProductOptions.Add(assignment);
        await db.SaveChangesAsync();

        var result = await service.CalculateAsync(new CalculatePriceRequest
        {
            ProductId = product.Id,
            Quantity = 500,
            SelectedOptionIds = [assignment.Id]
        });

        Assert.Equal(1_500m, result.OptionsAdditionalPerUnit);
        Assert.Equal(10_500m, result.UnitPrice);
        Assert.Equal(5_250_000m, result.Subtotal);
        Assert.Single(result.UnitAdjustments);
        Assert.Empty(result.OrderAdjustments);
        Assert.Equal(definition.Id, result.SelectedOptions.Single().OptionDefinitionId);
    }

    [Fact]
    public async Task CalculateAsync_AssignedFixedPerOrderOption_IsNotMultipliedByQuantity()
    {
        var (service, db) = BuildService();
        var product = NewProduct(basePrice: 9_000m);
        var definition = NewDefinition(OptionType.SpecialEffect, "Ép kim", 350_000m, PriceAdjustmentType.FixedPerOrder);
        var assignment = NewAssignment(product.Id, definition.Id);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        db.ProductOptions.Add(assignment);
        await db.SaveChangesAsync();

        var result = await service.CalculateAsync(new CalculatePriceRequest
        {
            ProductId = product.Id,
            Quantity = 500,
            SelectedOptionIds = [assignment.Id]
        });

        Assert.Equal(0m, result.OptionsAdditionalPerUnit);
        Assert.Equal(9_000m, result.UnitPrice);
        Assert.Equal(350_000m, result.OrderAdjustmentsTotal);
        Assert.Equal(4_850_000m, result.EstimatedPrice);
        Assert.Single(result.OrderAdjustments);
    }

    [Fact]
    public async Task CalculateAsync_OptionNotAssignedToProduct_IsRejected()
    {
        var (service, db) = BuildService();
        var productA = NewProduct(name: "A");
        var productB = NewProduct(name: "B");
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        // Assigned to B only.
        var assignment = NewAssignment(productB.Id, definition.Id);
        db.Products.AddRange(productA, productB);
        db.OptionDefinitions.Add(definition);
        db.ProductOptions.Add(assignment);
        await db.SaveChangesAsync();

        // Requesting Product A's price using an assignment id that belongs to Product B must be rejected.
        await Assert.ThrowsAsync<ValidationException>(() =>
            service.CalculateAsync(new CalculatePriceRequest
            {
                ProductId = productA.Id,
                Quantity = 10,
                SelectedOptionIds = [assignment.Id]
            }));
    }

    [Fact]
    public async Task CalculateAsync_UnknownAssignmentId_ThrowsValidation()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        db.Products.Add(product);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.CalculateAsync(new CalculatePriceRequest
            {
                ProductId = product.Id,
                Quantity = 10,
                SelectedOptionIds = [Guid.NewGuid()]
            }));
    }

    [Fact]
    public async Task CalculateAsync_InactiveAssignment_ThrowsValidation()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        var assignment = NewAssignment(product.Id, definition.Id, isActive: false);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        db.ProductOptions.Add(assignment);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.CalculateAsync(new CalculatePriceRequest
            {
                ProductId = product.Id,
                Quantity = 10,
                SelectedOptionIds = [assignment.Id]
            }));
    }

    [Fact]
    public async Task CalculateAsync_CatalogPriceChange_AffectsNewCalculationsImmediately()
    {
        var (service, db) = BuildService();
        var product = NewProduct(basePrice: 9_000m);
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        var assignment = NewAssignment(product.Id, definition.Id);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        db.ProductOptions.Add(assignment);
        await db.SaveChangesAsync();

        var before = await service.CalculateAsync(new CalculatePriceRequest { ProductId = product.Id, Quantity = 10, SelectedOptionIds = [assignment.Id] });
        Assert.Equal(1_500m, before.OptionsAdditionalPerUnit);

        // Admin edits the catalog price -- no changes to the assignment or product.
        definition.AdditionalPrice = 2_000m;
        db.OptionDefinitions.Update(definition);
        await db.SaveChangesAsync();

        var after = await service.CalculateAsync(new CalculatePriceRequest { ProductId = product.Id, Quantity = 10, SelectedOptionIds = [assignment.Id] });
        Assert.Equal(2_000m, after.OptionsAdditionalPerUnit);
    }

    [Fact]
    public async Task CalculateAsync_MultipleAssignedOptions_SumsBothUnitAndOrderAdjustments()
    {
        var (service, db) = BuildService();
        var product = NewProduct(basePrice: 9_000m);
        var defRib = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m, PriceAdjustmentType.FixedPerUnit);
        var defPrint = NewDefinition(OptionType.PrintingSide, "Hai mặt", 1_000m, PriceAdjustmentType.FixedPerUnit);
        var defLogo = NewDefinition(OptionType.SpecialEffect, "Ép kim", 350_000m, PriceAdjustmentType.FixedPerOrder);
        db.Products.Add(product);
        db.OptionDefinitions.AddRange(defRib, defPrint, defLogo);
        var assignRib = NewAssignment(product.Id, defRib.Id);
        var assignPrint = NewAssignment(product.Id, defPrint.Id);
        var assignLogo = NewAssignment(product.Id, defLogo.Id);
        db.ProductOptions.AddRange(assignRib, assignPrint, assignLogo);
        await db.SaveChangesAsync();

        var result = await service.CalculateAsync(new CalculatePriceRequest
        {
            ProductId = product.Id,
            Quantity = 500,
            SelectedOptionIds = [assignRib.Id, assignPrint.Id, assignLogo.Id]
        });

        Assert.Equal(11_500m, result.UnitPrice);
        Assert.Equal(5_750_000m, result.Subtotal);
        Assert.Equal(350_000m, result.OrderAdjustmentsTotal);
        Assert.Equal(6_100_000m, result.EstimatedPrice);
    }

    [Fact]
    public async Task CalculateAsync_PricingRuleMaterialMatching_StillWorksThroughCatalogJoin()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var materialDef = NewDefinition(OptionType.Material, "Vải lụa", 0m, PriceAdjustmentType.None);
        var assignment = NewAssignment(product.Id, materialDef.Id);
        db.Products.Add(product);
        db.OptionDefinitions.Add(materialDef);
        db.ProductOptions.Add(assignment);
        db.PricingRules.Add(new PricingRule
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Material = "Vải lụa",
            MinQuantity = 1,
            BaseUnitPrice = 12_000m,
            IsActive = true
        });
        await db.SaveChangesAsync();

        var result = await service.CalculateAsync(new CalculatePriceRequest
        {
            ProductId = product.Id,
            Quantity = 10,
            SelectedOptionIds = [assignment.Id]
        });

        // The rule matches by reading the Material value through the assignment -> catalog join.
        Assert.Equal(12_000m, result.BaseUnitPrice);
        Assert.NotNull(result.AppliedPricingRuleId);
    }

    [Fact]
    public async Task CalculateAsync_DiscountRounding_UsesAwayFromZeroAtTwoDecimals()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        db.Products.Add(product);
        db.PricingRules.Add(new PricingRule
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            MinQuantity = 1,
            BaseUnitPrice = 333m,
            DiscountPercent = 12.5m,
            IsActive = true
        });
        await db.SaveChangesAsync();

        var result = await service.CalculateAsync(new CalculatePriceRequest { ProductId = product.Id, Quantity = 7 });

        Assert.Equal(2331m, result.Subtotal);
        Assert.Equal(291.38m, result.DiscountAmount);
    }
}
