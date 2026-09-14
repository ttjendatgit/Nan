using Vifan.PrintTech.Application.DTOs.OptionCatalog;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Domain.Helpers;

namespace Vifan.PrintTech.Infrastructure.Services;

/// <summary>Manages the central option catalog. Creating a catalog entry never, by itself, exposes it on any product -- see IProductOptionService for product assignment.</summary>
public class OptionDefinitionService : IOptionDefinitionService
{
    private readonly IOptionDefinitionRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public OptionDefinitionService(IOptionDefinitionRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<OptionDefinitionDto>> GetAllAsync(bool activeOnly, CancellationToken cancellationToken = default)
    {
        var definitions = await _repository.GetAllAsync(activeOnly, cancellationToken);
        var dtos = new List<OptionDefinitionDto>(definitions.Count);
        foreach (var definition in definitions)
        {
            var count = await _repository.CountProductAssignmentsAsync(definition.Id, cancellationToken);
            dtos.Add(MapToDto(definition, count));
        }
        return dtos;
    }

    public async Task<OptionDefinitionDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var definition = await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Option catalog entry not found.");

        var count = await _repository.CountProductAssignmentsAsync(id, cancellationToken);
        return MapToDto(definition, count);
    }

    public async Task<OptionDefinitionDto> CreateAsync(CreateOptionDefinitionRequest request, CancellationToken cancellationToken = default)
    {
        var definition = new OptionDefinition
        {
            OptionType = ParseOptionType(request.OptionType),
            OptionName = request.OptionName.Trim(),
            OptionValue = request.OptionValue.Trim(),
            PriceAdjustmentType = ParsePriceAdjustmentType(request.PriceAdjustmentType),
            AdditionalPrice = request.AdditionalPrice,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive
        };

        await _repository.AddAsync(definition, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(definition, 0);
    }

    public async Task<OptionDefinitionDto> UpdateAsync(Guid id, UpdateOptionDefinitionRequest request, CancellationToken cancellationToken = default)
    {
        var definition = await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Option catalog entry not found.");

        definition.OptionType = ParseOptionType(request.OptionType);
        definition.OptionName = request.OptionName.Trim();
        definition.OptionValue = request.OptionValue.Trim();
        definition.PriceAdjustmentType = ParsePriceAdjustmentType(request.PriceAdjustmentType);
        definition.AdditionalPrice = request.AdditionalPrice;
        definition.SortOrder = request.SortOrder;
        definition.IsActive = request.IsActive;

        _repository.Update(definition);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var count = await _repository.CountProductAssignmentsAsync(id, cancellationToken);
        return MapToDto(definition, count);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var definition = await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Option catalog entry not found.");

        // Hard delete is safe at the database level either way (both FKs pointing at this table
        // are SetNull/Restrict), but is only meaningful/safe from a product-configuration
        // standpoint when nothing actually depends on it. Both checks are required, not just one:
        // an entry can have quote history with zero current assignments (all removed later), or
        // active assignments with zero quote history yet (never actually quoted).
        if (await _repository.IsReferencedByQuoteHistoryAsync(id, cancellationToken))
        {
            throw new BusinessRuleException(
                "This option is referenced by existing quote history and cannot be permanently deleted. Deactivate it instead.");
        }

        var assignmentCount = await _repository.CountProductAssignmentsAsync(id, cancellationToken);
        if (assignmentCount > 0)
        {
            throw new BusinessRuleException(
                $"This option is currently assigned to {assignmentCount} product(s) and cannot be permanently deleted. Remove it from those products first, or deactivate it instead.");
        }

        _repository.Remove(definition);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static OptionType ParseOptionType(string value)
    {
        if (!OptionTypeHelper.TryParse(value, out var optionType))
            throw new ValidationException($"Invalid OptionType. Valid values: {string.Join(", ", OptionTypeHelper.GetAllNames())}.");

        return optionType;
    }

    private static PriceAdjustmentType ParsePriceAdjustmentType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return PriceAdjustmentType.FixedPerUnit;

        if (!Enum.TryParse<PriceAdjustmentType>(value, ignoreCase: true, out var parsed))
            throw new ValidationException($"Invalid PriceAdjustmentType. Valid values: {string.Join(", ", Enum.GetNames<PriceAdjustmentType>())}.");

        return parsed;
    }

    private static OptionDefinitionDto MapToDto(OptionDefinition definition, int assignmentCount) =>
        new()
        {
            Id = definition.Id,
            OptionType = definition.OptionType.ToString(),
            OptionName = definition.OptionName,
            OptionValue = definition.OptionValue,
            PriceAdjustmentType = definition.PriceAdjustmentType.ToString(),
            AdditionalPrice = definition.AdditionalPrice,
            SortOrder = definition.SortOrder,
            IsActive = definition.IsActive,
            ProductAssignmentCount = assignmentCount,
            CreatedAt = definition.CreatedAt,
            UpdatedAt = definition.UpdatedAt
        };
}
