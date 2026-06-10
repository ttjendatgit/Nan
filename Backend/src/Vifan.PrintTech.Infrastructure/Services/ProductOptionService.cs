using Vifan.PrintTech.Application.DTOs.Options;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Domain.Helpers;

namespace Vifan.PrintTech.Infrastructure.Services;

public class ProductOptionService : IProductOptionService
{
    private readonly IProductOptionRepository _optionRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ProductOptionService(
        IProductOptionRepository optionRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork)
    {
        _optionRepository = optionRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ProductOptionsGroupedDto> GetByProductIdAsync(
        Guid productId,
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        await EnsureProductExistsAsync(productId, activeOnly, cancellationToken);

        var options = await _optionRepository.GetByProductIdAsync(productId, activeOnly, cancellationToken);

        var groups = options
            .GroupBy(o => o.OptionType)
            .OrderBy(g => g.Key)
            .Select(g => new OptionTypeGroupDto
            {
                OptionType = g.Key.ToString(),
                Options = g.Select(MapToDto).ToList()
            })
            .ToList();

        return new ProductOptionsGroupedDto
        {
            ProductId = productId,
            Groups = groups
        };
    }

    public async Task<ProductOptionDto> CreateAsync(
        Guid productId,
        CreateProductOptionRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureProductExistsAsync(productId, activeOnly: false, cancellationToken);
        var optionType = ParseOptionType(request.OptionType);

        var option = new ProductOption
        {
            ProductId = productId,
            OptionType = optionType,
            OptionName = request.OptionName.Trim(),
            OptionValue = request.OptionValue.Trim(),
            AdditionalPrice = request.AdditionalPrice,
            IsActive = request.IsActive
        };

        await _optionRepository.AddAsync(option, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(option);
    }

    public async Task<ProductOptionDto> UpdateAsync(
        Guid id,
        UpdateProductOptionRequest request,
        CancellationToken cancellationToken = default)
    {
        var option = await _optionRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Product option not found.");

        var optionType = ParseOptionType(request.OptionType);

        option.OptionType = optionType;
        option.OptionName = request.OptionName.Trim();
        option.OptionValue = request.OptionValue.Trim();
        option.AdditionalPrice = request.AdditionalPrice;
        option.IsActive = request.IsActive;

        _optionRepository.Update(option);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(option);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var option = await _optionRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Product option not found.");

        _optionRepository.Remove(option);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureProductExistsAsync(
        Guid productId,
        bool activeOnly,
        CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(productId, cancellationToken);
        if (product is null || (activeOnly && !product.IsActive))
            throw new NotFoundException("Product not found.");
    }

    private static OptionType ParseOptionType(string value)
    {
        if (!OptionTypeHelper.TryParse(value, out var optionType))
            throw new ValidationException($"Invalid OptionType. Valid values: {string.Join(", ", OptionTypeHelper.GetAllNames())}.");

        return optionType;
    }

    private static ProductOptionDto MapToDto(ProductOption option) =>
        new()
        {
            Id = option.Id,
            ProductId = option.ProductId,
            OptionType = option.OptionType.ToString(),
            OptionName = option.OptionName,
            OptionValue = option.OptionValue,
            AdditionalPrice = option.AdditionalPrice,
            IsActive = option.IsActive,
            CreatedAt = option.CreatedAt,
            UpdatedAt = option.UpdatedAt
        };
}
