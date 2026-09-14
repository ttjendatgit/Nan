using Vifan.PrintTech.Application.DTOs.Options;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Infrastructure.Data;
using Vifan.PrintTech.Infrastructure.Repositories;
using Vifan.PrintTech.Infrastructure.Services;
using Xunit;
using static Vifan.PrintTech.Tests.TestEntityFactory;

namespace Vifan.PrintTech.Tests;

public class ProductOptionServiceTests
{
    private static (ProductOptionService Service, ApplicationDbContext Db) BuildService()
    {
        var db = TestDbContextFactory.Create();
        var service = new ProductOptionService(
            new ProductOptionRepository(db),
            new OptionDefinitionRepository(db),
            new ProductRepository(db),
            new UnitOfWork(db));
        return (service, db);
    }

    [Fact]
    public async Task CreateAsync_AssignsCatalogEntryToProduct()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        await db.SaveChangesAsync();

        var dto = await service.CreateAsync(product.Id, new CreateProductOptionRequest { OptionDefinitionId = definition.Id });

        Assert.Equal("Nan tre", dto.OptionValue);
        Assert.Equal(1_500m, dto.AdditionalPrice);
        Assert.Equal(definition.Id, dto.OptionDefinitionId);
    }

    [Fact]
    public async Task ProductA_SeesAssignedOption_ProductB_DoesNot()
    {
        var (service, db) = BuildService();
        var productA = NewProduct(name: "A");
        var productB = NewProduct(name: "B");
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        db.Products.AddRange(productA, productB);
        db.OptionDefinitions.Add(definition);
        await db.SaveChangesAsync();

        await service.CreateAsync(productA.Id, new CreateProductOptionRequest { OptionDefinitionId = definition.Id });

        var optionsForA = await service.GetByProductIdAsync(productA.Id, activeOnly: false);
        var optionsForB = await service.GetByProductIdAsync(productB.Id, activeOnly: false);

        Assert.Single(optionsForA.Groups);
        Assert.Empty(optionsForB.Groups);
    }

    [Fact]
    public async Task RemovingAssignment_DoesNotDeleteCatalogEntry()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        await db.SaveChangesAsync();

        var assignment = await service.CreateAsync(product.Id, new CreateProductOptionRequest { OptionDefinitionId = definition.Id });
        await service.DeleteAsync(assignment.Id);

        var options = await service.GetByProductIdAsync(product.Id, activeOnly: false);
        Assert.Empty(options.Groups);

        // The global catalog entry must still exist.
        Assert.NotNull(await db.OptionDefinitions.FindAsync(definition.Id));
    }

    [Fact]
    public async Task DuplicateAssignment_IsRejected()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        await db.SaveChangesAsync();

        await service.CreateAsync(product.Id, new CreateProductOptionRequest { OptionDefinitionId = definition.Id });

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.CreateAsync(product.Id, new CreateProductOptionRequest { OptionDefinitionId = definition.Id }));
    }

    [Fact]
    public async Task AssigningInactiveCatalogEntry_IsRejected()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m, isActive: false);
        db.Products.Add(product);
        db.OptionDefinitions.Add(definition);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CreateAsync(product.Id, new CreateProductOptionRequest { OptionDefinitionId = definition.Id }));
    }

    [Fact]
    public async Task ReorderAssignments_PersistsAndIsReflectedOnReload()
    {
        var (service, db) = BuildService();
        var product = NewProduct();
        var defA = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        var defB = NewDefinition(OptionType.Finishing, "Nan nhựa", 800m);
        db.Products.Add(product);
        db.OptionDefinitions.AddRange(defA, defB);
        await db.SaveChangesAsync();

        var assignA = await service.CreateAsync(product.Id, new CreateProductOptionRequest { OptionDefinitionId = defA.Id, SortOrder = 0 });
        var assignB = await service.CreateAsync(product.Id, new CreateProductOptionRequest { OptionDefinitionId = defB.Id, SortOrder = 1 });

        var before = await service.GetByProductIdAsync(product.Id, activeOnly: false);
        Assert.Equal(["Nan tre", "Nan nhựa"], before.Groups.Single().Options.Select(o => o.OptionValue));

        // Swap: move "Nan nhựa" up.
        await service.UpdateAsync(assignB.Id, new UpdateProductOptionRequest { SortOrder = 0, IsActive = true });
        await service.UpdateAsync(assignA.Id, new UpdateProductOptionRequest { SortOrder = 1, IsActive = true });

        var after = await service.GetByProductIdAsync(product.Id, activeOnly: false);
        Assert.Equal(["Nan nhựa", "Nan tre"], after.Groups.Single().Options.Select(o => o.OptionValue));
    }

    [Fact]
    public async Task SameCatalogEntry_CanBeAssignedToDifferentProducts_Independently()
    {
        var (service, db) = BuildService();
        var productA = NewProduct(name: "A");
        var productB = NewProduct(name: "B");
        var definition = NewDefinition(OptionType.Finishing, "Nan tre", 1_500m);
        db.Products.AddRange(productA, productB);
        db.OptionDefinitions.Add(definition);
        await db.SaveChangesAsync();

        await service.CreateAsync(productA.Id, new CreateProductOptionRequest { OptionDefinitionId = definition.Id });
        await service.CreateAsync(productB.Id, new CreateProductOptionRequest { OptionDefinitionId = definition.Id });

        var optionsForA = await service.GetByProductIdAsync(productA.Id, activeOnly: false);
        var optionsForB = await service.GetByProductIdAsync(productB.Id, activeOnly: false);

        Assert.Single(optionsForA.Groups.Single().Options);
        Assert.Single(optionsForB.Groups.Single().Options);
    }
}
