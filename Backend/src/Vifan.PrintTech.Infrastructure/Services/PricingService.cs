using Vifan.PrintTech.Application.DTOs.Pricing;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Infrastructure.Services;

public class PricingService : IPricingService
{
    private readonly IProductRepository _productRepository;
    private readonly IProductOptionRepository _optionRepository;
    private readonly IPricingRuleRepository _pricingRuleRepository;

    public PricingService(
        IProductRepository productRepository,
        IProductOptionRepository optionRepository,
        IPricingRuleRepository pricingRuleRepository)
    {
        _productRepository = productRepository;
        _optionRepository = optionRepository;
        _pricingRuleRepository = pricingRuleRepository;
    }

    public async Task<PriceBreakdownDto> CalculateAsync(
        CalculatePriceRequest request,
        CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        if (product is null || !product.IsActive)
            throw new NotFoundException("Product not found.");

        if (request.Quantity < product.MinQuantity)
            throw new BusinessRuleException($"Minimum quantity for this product is {product.MinQuantity}.");

        // SelectedOptionIds are ProductOption ASSIGNMENT ids, not catalog (OptionDefinition) ids --
        // this is what makes "Product A + an OptionDefinition only assigned to Product B" rejected
        // by construction: an assignment id inherently belongs to exactly one product, so scoping
        // this lookup by request.ProductId is sufficient, no extra cross-check is needed.
        var selectedOptions = await _optionRepository.GetByIdsForProductAsync(
            request.ProductId,
            request.SelectedOptionIds,
            activeOnly: true,
            cancellationToken);

        if (request.SelectedOptionIds.Distinct().Count() != selectedOptions.Count)
            throw new ValidationException("One or more selected options are invalid or inactive for this product.");

        var material = GetOptionValue(selectedOptions, OptionType.Material);
        var size = GetOptionValue(selectedOptions, OptionType.Size);
        var printingSide = GetOptionValue(selectedOptions, OptionType.PrintingSide);

        var matchedRule = await _pricingRuleRepository.FindBestMatchAsync(
            request.ProductId,
            request.Quantity,
            material,
            size,
            printingSide,
            cancellationToken);

        var baseUnitPrice = matchedRule?.BaseUnitPrice ?? product.BasePrice;
        var additionalCost = matchedRule?.AdditionalCost ?? 0m;
        var discountPercent = matchedRule?.DiscountPercent ?? 0m;

        // Pricing/label data is read live from each assignment's catalog entry (OptionDefinition):
        // an admin editing the catalog price immediately affects every future calculation for
        // every product it's assigned to, with no per-assignment override.
        var unitAdjustments = selectedOptions
            .Where(o => o.OptionDefinition.PriceAdjustmentType == PriceAdjustmentType.FixedPerUnit)
            .Select(o => BuildLine(o, o.OptionDefinition.AdditionalPrice, o.OptionDefinition.AdditionalPrice * request.Quantity))
            .ToList();

        var orderAdjustments = selectedOptions
            .Where(o => o.OptionDefinition.PriceAdjustmentType == PriceAdjustmentType.FixedPerOrder)
            .Select(o => BuildLine(o, o.OptionDefinition.AdditionalPrice, o.OptionDefinition.AdditionalPrice))
            .ToList();

        var optionsAdditionalPerUnit = unitAdjustments.Sum(l => l.Amount);
        var orderAdjustmentsTotal = orderAdjustments.Sum(l => l.Amount);

        var unitPrice = baseUnitPrice + optionsAdditionalPerUnit;
        var subtotal = unitPrice * request.Quantity;
        var discountAmount = Math.Round(subtotal * discountPercent / 100m, 2, MidpointRounding.AwayFromZero);
        var estimatedPrice = subtotal + additionalCost - discountAmount + orderAdjustmentsTotal;

        return new PriceBreakdownDto
        {
            ProductId = product.Id,
            ProductName = product.Name,
            Quantity = request.Quantity,
            BaseUnitPrice = baseUnitPrice,
            UnitAdjustments = unitAdjustments,
            OrderAdjustments = orderAdjustments,
            OptionsAdditionalPerUnit = optionsAdditionalPerUnit,
            UnitPrice = unitPrice,
            Subtotal = subtotal,
            AdditionalCost = additionalCost,
            DiscountPercent = discountPercent,
            DiscountAmount = discountAmount,
            OrderAdjustmentsTotal = orderAdjustmentsTotal,
            EstimatedPrice = estimatedPrice,
            CalculatedTotal = estimatedPrice,
            AppliedPricingRuleId = matchedRule?.Id,
            SelectedOptions = selectedOptions.Select(o => new PriceBreakdownOptionDto
            {
                OptionId = o.Id,
                OptionDefinitionId = o.OptionDefinitionId,
                OptionType = o.OptionDefinition.OptionType.ToString(),
                OptionName = o.OptionDefinition.OptionName,
                OptionValue = o.OptionDefinition.OptionValue,
                PriceAdjustmentType = o.OptionDefinition.PriceAdjustmentType.ToString(),
                AdditionalPrice = o.OptionDefinition.AdditionalPrice
            }).ToList()
        };
    }

    private static PriceAdjustmentLineDto BuildLine(ProductOption assignment, decimal amount, decimal total) => new()
    {
        OptionId = assignment.Id,
        OptionType = assignment.OptionDefinition.OptionType.ToString(),
        Name = assignment.OptionDefinition.OptionValue,
        Type = assignment.OptionDefinition.PriceAdjustmentType.ToString(),
        Amount = amount,
        Total = total
    };

    private static string? GetOptionValue(IReadOnlyList<ProductOption> assignments, OptionType type) =>
        assignments.FirstOrDefault(a => a.OptionDefinition.OptionType == type)?.OptionDefinition.OptionValue;
}
