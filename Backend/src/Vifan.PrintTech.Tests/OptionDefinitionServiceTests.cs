using Vifan.PrintTech.Application.DTOs.OptionCatalog;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Infrastructure.Data;
using Vifan.PrintTech.Infrastructure.Repositories;
using Vifan.PrintTech.Infrastructure.Services;
using Xunit;

namespace Vifan.PrintTech.Tests;

public class OptionDefinitionServiceTests
{
    private static (OptionDefinitionService Service, ApplicationDbContext Db) BuildService()
    {
        var db = TestDbContextFactory.Create();
        var service = new OptionDefinitionService(new OptionDefinitionRepository(db), new UnitOfWork(db));
        return (service, db);
    }

    [Fact]
    public async Task CreateAsync_NewCatalogEntry_IsPersisted()
    {
        var (service, _) = BuildService();

        var dto = await service.CreateAsync(new CreateOptionDefinitionRequest
        {
            OptionType = "Finishing",
            OptionName = "Nan",
            OptionValue = "Nan tre",
            PriceAdjustmentType = "FixedPerUnit",
            AdditionalPrice = 1_500m,
            IsActive = true
        });

        Assert.Equal("Nan tre", dto.OptionValue);
        Assert.Equal(1_500m, dto.AdditionalPrice);
        Assert.Equal(0, dto.ProductAssignmentCount);
    }

    [Fact]
    public async Task UpdateAsync_ChangingPrice_IsReflectedImmediately()
    {
        var (service, db) = BuildService();
        var definition = new OptionDefinition
        {
            Id = Guid.NewGuid(), OptionType = OptionType.Finishing, OptionName = "Nan",
            OptionValue = "Nan tre", AdditionalPrice = 1_500m, IsActive = true
        };
        db.OptionDefinitions.Add(definition);
        await db.SaveChangesAsync();

        var updated = await service.UpdateAsync(definition.Id, new UpdateOptionDefinitionRequest
        {
            OptionType = "Finishing", OptionName = "Nan", OptionValue = "Nan tre",
            PriceAdjustmentType = "FixedPerUnit", AdditionalPrice = 2_000m, IsActive = true
        });

        Assert.Equal(2_000m, updated.AdditionalPrice);
    }

    [Fact]
    public async Task UpdateAsync_Deactivate_PersistsInactiveState()
    {
        var (service, db) = BuildService();
        var definition = new OptionDefinition
        {
            Id = Guid.NewGuid(), OptionType = OptionType.Finishing, OptionName = "Nan",
            OptionValue = "Nan tre", AdditionalPrice = 1_500m, IsActive = true
        };
        db.OptionDefinitions.Add(definition);
        await db.SaveChangesAsync();

        var updated = await service.UpdateAsync(definition.Id, new UpdateOptionDefinitionRequest
        {
            OptionType = "Finishing", OptionName = "Nan", OptionValue = "Nan tre",
            PriceAdjustmentType = "FixedPerUnit", AdditionalPrice = 1_500m, IsActive = false
        });

        Assert.False(updated.IsActive);

        var reactivated = await service.UpdateAsync(definition.Id, new UpdateOptionDefinitionRequest
        {
            OptionType = "Finishing", OptionName = "Nan", OptionValue = "Nan tre",
            PriceAdjustmentType = "FixedPerUnit", AdditionalPrice = 1_500m, IsActive = true
        });
        Assert.True(reactivated.IsActive);
    }

    [Fact]
    public async Task DeleteAsync_ReferencedByQuoteHistory_IsRejected()
    {
        var (service, db) = BuildService();
        var definition = new OptionDefinition
        {
            Id = Guid.NewGuid(), OptionType = OptionType.Finishing, OptionName = "Nan",
            OptionValue = "Nan tre", AdditionalPrice = 1_500m, IsActive = true
        };
        var quote = new QuoteRequest { Id = Guid.NewGuid(), FullName = "A", Phone = "0900000000", Quantity = 10 };
        var snapshot = new QuoteRequestOption
        {
            Id = Guid.NewGuid(), QuoteRequestId = quote.Id, OptionDefinitionId = definition.Id,
            OptionTypeSnapshot = "Finishing", OptionNameSnapshot = "Nan", OptionValueSnapshot = "Nan tre",
            PriceAdjustmentTypeSnapshot = "FixedPerUnit", PriceAdjustmentSnapshot = 1_500m, CalculatedAmountSnapshot = 150_000m
        };
        db.OptionDefinitions.Add(definition);
        db.QuoteRequests.Add(quote);
        db.QuoteRequestOptions.Add(snapshot);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.DeleteAsync(definition.Id));
        Assert.NotNull(await db.OptionDefinitions.FindAsync(definition.Id));
    }

    [Fact]
    public async Task DeleteAsync_CurrentlyAssignedToAProduct_IsRejected()
    {
        var (service, db) = BuildService();
        var category = new ProductCategory { Id = Guid.NewGuid(), Name = "Cat", Slug = Guid.NewGuid().ToString(), IsActive = true };
        var product = new Product { Id = Guid.NewGuid(), CategoryId = category.Id, Category = category, Name = "P", Slug = Guid.NewGuid().ToString(), BasePrice = 1000m, MinQuantity = 1, IsActive = true };
        var definition = new OptionDefinition
        {
            Id = Guid.NewGuid(), OptionType = OptionType.Finishing, OptionName = "Nan",
            OptionValue = "Nan tre", AdditionalPrice = 1_500m, IsActive = true
        };
        var assignment = new ProductOption { Id = Guid.NewGuid(), ProductId = product.Id, OptionDefinitionId = definition.Id, IsActive = true };
        db.OptionDefinitions.Add(definition);
        db.Products.Add(product);
        db.ProductOptions.Add(assignment);
        await db.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() => service.DeleteAsync(definition.Id));
        Assert.Contains("assigned", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.NotNull(await db.OptionDefinitions.FindAsync(definition.Id));
    }

    [Fact]
    public async Task DeleteAsync_UnreferencedEntry_Succeeds()
    {
        var (service, db) = BuildService();
        var definition = new OptionDefinition
        {
            Id = Guid.NewGuid(), OptionType = OptionType.Finishing, OptionName = "Nan",
            OptionValue = "Nan tre", AdditionalPrice = 1_500m, IsActive = true
        };
        db.OptionDefinitions.Add(definition);
        await db.SaveChangesAsync();

        await service.DeleteAsync(definition.Id);

        Assert.Null(await db.OptionDefinitions.FindAsync(definition.Id));
    }

    [Fact]
    public async Task GetAllAsync_ReportsAccurateProductAssignmentCount()
    {
        var (service, db) = BuildService();
        var category = new ProductCategory { Id = Guid.NewGuid(), Name = "Cat", Slug = Guid.NewGuid().ToString(), IsActive = true };
        var productA = new Product { Id = Guid.NewGuid(), CategoryId = category.Id, Category = category, Name = "A", Slug = Guid.NewGuid().ToString(), BasePrice = 1000m, MinQuantity = 1, IsActive = true };
        var productB = new Product { Id = Guid.NewGuid(), CategoryId = category.Id, Category = category, Name = "B", Slug = Guid.NewGuid().ToString(), BasePrice = 1000m, MinQuantity = 1, IsActive = true };
        var definition = new OptionDefinition
        {
            Id = Guid.NewGuid(), OptionType = OptionType.Finishing, OptionName = "Nan",
            OptionValue = "Nan tre", AdditionalPrice = 1_500m, IsActive = true
        };
        db.OptionDefinitions.Add(definition);
        db.Products.AddRange(productA, productB);
        db.ProductOptions.AddRange(
            new ProductOption { Id = Guid.NewGuid(), ProductId = productA.Id, OptionDefinitionId = definition.Id, IsActive = true },
            new ProductOption { Id = Guid.NewGuid(), ProductId = productB.Id, OptionDefinitionId = definition.Id, IsActive = true });
        await db.SaveChangesAsync();

        var dto = await service.GetByIdAsync(definition.Id);

        Assert.Equal(2, dto.ProductAssignmentCount);
    }
}
