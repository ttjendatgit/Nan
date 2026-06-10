using Vifan.PrintTech.Application.DTOs.Pricing;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;
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

        var nonUrgentOptions = selectedOptions
            .Where(o => !(o.OptionType == OptionType.DeliverySpeed &&
                          string.Equals(o.OptionValue, DeliverySpeedValues.Urgent, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        var optionsAdditionalPerUnit = nonUrgentOptions.Sum(o => o.AdditionalPrice);

        var urgentOption = selectedOptions.FirstOrDefault(o =>
            o.OptionType == OptionType.DeliverySpeed &&
            string.Equals(o.OptionValue, DeliverySpeedValues.Urgent, StringComparison.OrdinalIgnoreCase));

        var urgentDeliveryCost = urgentOption?.AdditionalPrice ?? 0m;

        var unitPrice = baseUnitPrice + optionsAdditionalPerUnit;
        var subtotal = unitPrice * request.Quantity;
        var discountAmount = Math.Round(subtotal * discountPercent / 100m, 2, MidpointRounding.AwayFromZero);
        var estimatedPrice = subtotal + additionalCost - discountAmount + urgentDeliveryCost;

        return new PriceBreakdownDto
        {
            ProductId = product.Id,
            ProductName = product.Name,
            Quantity = request.Quantity,
            BaseUnitPrice = baseUnitPrice,
            OptionsAdditionalPerUnit = optionsAdditionalPerUnit,
            UnitPrice = unitPrice,
            Subtotal = subtotal,
            AdditionalCost = additionalCost,
            DiscountPercent = discountPercent,
            DiscountAmount = discountAmount,
            UrgentDeliveryCost = urgentDeliveryCost,
            EstimatedPrice = estimatedPrice,
            AppliedPricingRuleId = matchedRule?.Id,
            SelectedOptions = selectedOptions.Select(o => new PriceBreakdownOptionDto
            {
                OptionId = o.Id,
                OptionType = o.OptionType.ToString(),
                OptionName = o.OptionName,
                OptionValue = o.OptionValue,
                AdditionalPrice = o.AdditionalPrice
            }).ToList()
        };
    }

    private static string? GetOptionValue(IReadOnlyList<ProductOption> options, OptionType type) =>
        options.FirstOrDefault(o => o.OptionType == type)?.OptionValue;
}
