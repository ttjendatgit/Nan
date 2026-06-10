using Vifan.PrintTech.Application.DTOs.Pricing;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Services;

public class PricingRuleService : IPricingRuleService
{
    private readonly IPricingRuleRepository _pricingRuleRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PricingRuleService(
        IPricingRuleRepository pricingRuleRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork)
    {
        _pricingRuleRepository = pricingRuleRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<PricingRuleDto>> GetByProductIdAsync(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        await EnsureProductExistsAsync(productId, cancellationToken);

        var rules = await _pricingRuleRepository.GetByProductIdAsync(productId, activeOnly: false, cancellationToken);
        return rules.Select(MapToDto).ToList();
    }

    public async Task<PricingRuleDto> CreateAsync(
        CreatePricingRuleRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureProductExistsAsync(request.ProductId, cancellationToken);

        var rule = new PricingRule
        {
            ProductId = request.ProductId,
            Material = Normalize(request.Material),
            Size = Normalize(request.Size),
            PrintingSide = Normalize(request.PrintingSide),
            MinQuantity = request.MinQuantity,
            MaxQuantity = request.MaxQuantity,
            BaseUnitPrice = request.BaseUnitPrice,
            AdditionalCost = request.AdditionalCost,
            DiscountPercent = request.DiscountPercent,
            IsActive = request.IsActive
        };

        await _pricingRuleRepository.AddAsync(rule, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(rule);
    }

    public async Task<PricingRuleDto> UpdateAsync(
        Guid id,
        UpdatePricingRuleRequest request,
        CancellationToken cancellationToken = default)
    {
        var rule = await _pricingRuleRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Pricing rule not found.");

        rule.Material = Normalize(request.Material);
        rule.Size = Normalize(request.Size);
        rule.PrintingSide = Normalize(request.PrintingSide);
        rule.MinQuantity = request.MinQuantity;
        rule.MaxQuantity = request.MaxQuantity;
        rule.BaseUnitPrice = request.BaseUnitPrice;
        rule.AdditionalCost = request.AdditionalCost;
        rule.DiscountPercent = request.DiscountPercent;
        rule.IsActive = request.IsActive;

        _pricingRuleRepository.Update(rule);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(rule);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var rule = await _pricingRuleRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Pricing rule not found.");

        _pricingRuleRepository.Remove(rule);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureProductExistsAsync(Guid productId, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(productId, cancellationToken);
        if (product is null)
            throw new NotFoundException("Product not found.");
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static PricingRuleDto MapToDto(PricingRule rule) =>
        new()
        {
            Id = rule.Id,
            ProductId = rule.ProductId,
            Material = rule.Material,
            Size = rule.Size,
            MinQuantity = rule.MinQuantity,
            MaxQuantity = rule.MaxQuantity,
            PrintingSide = rule.PrintingSide,
            BaseUnitPrice = rule.BaseUnitPrice,
            AdditionalCost = rule.AdditionalCost,
            DiscountPercent = rule.DiscountPercent,
            IsActive = rule.IsActive,
            CreatedAt = rule.CreatedAt,
            UpdatedAt = rule.UpdatedAt
        };
}
