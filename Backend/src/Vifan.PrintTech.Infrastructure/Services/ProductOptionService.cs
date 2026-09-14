using Vifan.PrintTech.Application.DTOs.Options;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Services;

/// <summary>Manages a Product's assignments of catalog entries (OptionDefinition). Never creates, edits, or deletes catalog data itself -- see IOptionDefinitionService for that.</summary>
public class ProductOptionService : IProductOptionService
{
    private readonly IProductOptionRepository _assignmentRepository;
    private readonly IOptionDefinitionRepository _definitionRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ProductOptionService(
        IProductOptionRepository assignmentRepository,
        IOptionDefinitionRepository definitionRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork)
    {
        _assignmentRepository = assignmentRepository;
        _definitionRepository = definitionRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ProductOptionsGroupedDto> GetByProductIdAsync(
        Guid productId,
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        await EnsureProductExistsAsync(productId, activeOnly, cancellationToken);

        var assignments = await _assignmentRepository.GetByProductIdAsync(productId, activeOnly, cancellationToken);

        var groups = assignments
            .GroupBy(a => a.OptionDefinition.OptionType)
            .OrderBy(g => g.Key)
            .Select(g => new OptionTypeGroupDto
            {
                OptionType = g.Key.ToString(),
                Options = g.OrderBy(a => a.SortOrder).ThenBy(a => a.OptionDefinition.OptionName).Select(MapToDto).ToList()
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

        var definition = await _definitionRepository.GetByIdAsync(request.OptionDefinitionId, cancellationToken)
            ?? throw new NotFoundException("Option catalog entry not found.");

        if (!definition.IsActive)
            throw new BusinessRuleException("This catalog entry is inactive and cannot be assigned to a product. Reactivate it in the option catalog first.");

        if (await _assignmentRepository.ExistsAssignmentAsync(productId, request.OptionDefinitionId, cancellationToken))
            throw new ValidationException("This option is already assigned to this product.");

        var sortOrder = request.SortOrder ?? await NextSortOrderAsync(productId, definition.OptionType, cancellationToken);

        var assignment = new ProductOption
        {
            ProductId = productId,
            OptionDefinitionId = request.OptionDefinitionId,
            SortOrder = sortOrder,
            IsActive = request.IsActive
        };

        await _assignmentRepository.AddAsync(assignment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        assignment.OptionDefinition = definition;
        return MapToDto(assignment);
    }

    public async Task<ProductOptionDto> UpdateAsync(
        Guid id,
        UpdateProductOptionRequest request,
        CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdWithDefinitionAsync(id, cancellationToken)
            ?? throw new NotFoundException("Product option assignment not found.");

        assignment.SortOrder = request.SortOrder;
        assignment.IsActive = request.IsActive;

        _assignmentRepository.Update(assignment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(assignment);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // Removing an assignment is a routine, non-destructive action: it only unlinks this
        // product from the catalog entry. The catalog entry itself (and any quote history that
        // referenced it) is never touched -- no guard is needed here, unlike catalog deletion.
        var assignment = await _assignmentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Product option assignment not found.");

        _assignmentRepository.Remove(assignment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<int> NextSortOrderAsync(Guid productId, Domain.Enums.OptionType optionType, CancellationToken cancellationToken)
    {
        var existing = await _assignmentRepository.GetByProductIdAsync(productId, activeOnly: false, cancellationToken);
        var inGroup = existing.Where(a => a.OptionDefinition.OptionType == optionType).ToList();
        return inGroup.Count == 0 ? 0 : inGroup.Max(a => a.SortOrder) + 1;
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

    private static ProductOptionDto MapToDto(ProductOption a) =>
        new()
        {
            Id = a.Id,
            ProductId = a.ProductId,
            OptionDefinitionId = a.OptionDefinitionId,
            OptionType = a.OptionDefinition.OptionType.ToString(),
            OptionName = a.OptionDefinition.OptionName,
            OptionValue = a.OptionDefinition.OptionValue,
            PriceAdjustmentType = a.OptionDefinition.PriceAdjustmentType.ToString(),
            AdditionalPrice = a.OptionDefinition.AdditionalPrice,
            SortOrder = a.SortOrder,
            IsActive = a.IsActive,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        };
}
