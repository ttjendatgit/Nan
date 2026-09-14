using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Tests;

/// <summary>Shared entity builders so every test file doesn't hand-roll its own Product/Category/OptionDefinition boilerplate.</summary>
public static class TestEntityFactory
{
    public static Product NewProduct(decimal basePrice = 9_000m, int minQuantity = 1, string name = "Quạt Nan Premium")
    {
        var category = new ProductCategory
        {
            Id = Guid.NewGuid(),
            Name = "Quạt Nan",
            Slug = Guid.NewGuid().ToString(),
            IsActive = true
        };
        return new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Category = category,
            Name = name,
            Slug = Guid.NewGuid().ToString(),
            BasePrice = basePrice,
            MinQuantity = minQuantity,
            IsActive = true
        };
    }

    public static OptionDefinition NewDefinition(
        OptionType type,
        string value,
        decimal price,
        PriceAdjustmentType adjustmentType = PriceAdjustmentType.FixedPerUnit,
        bool isActive = true,
        string? name = null) => new()
    {
        Id = Guid.NewGuid(),
        OptionType = type,
        OptionName = name ?? type.ToString(),
        OptionValue = value,
        AdditionalPrice = price,
        PriceAdjustmentType = adjustmentType,
        IsActive = isActive
    };

    public static ProductOption NewAssignment(Guid productId, Guid optionDefinitionId, int sortOrder = 0, bool isActive = true) => new()
    {
        Id = Guid.NewGuid(),
        ProductId = productId,
        OptionDefinitionId = optionDefinitionId,
        SortOrder = sortOrder,
        IsActive = isActive
    };
}
