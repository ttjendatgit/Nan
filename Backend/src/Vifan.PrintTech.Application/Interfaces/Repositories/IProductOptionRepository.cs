using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Application.Interfaces.Repositories;

/// <summary>Repository for Product↔OptionDefinition assignment rows.</summary>
public interface IProductOptionRepository : IRepository<ProductOption>
{
    /// <summary>All assignments for a product, each with its OptionDefinition loaded.</summary>
    Task<IReadOnlyList<ProductOption>> GetByProductIdAsync(
        Guid productId,
        bool activeOnly,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Resolves assignment IDs to assignment rows (with OptionDefinition loaded), scoped to the
    /// given product. An ID that belongs to a different product, doesn't exist, or (when
    /// activeOnly) is inactive is simply absent from the result -- callers detect a mismatch by
    /// comparing the returned count to the requested count.
    /// </summary>
    Task<IReadOnlyList<ProductOption>> GetByIdsForProductAsync(
        Guid productId,
        IEnumerable<Guid> assignmentIds,
        bool activeOnly,
        CancellationToken cancellationToken = default);

    Task<ProductOption?> GetByIdWithDefinitionAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ExistsAssignmentAsync(Guid productId, Guid optionDefinitionId, CancellationToken cancellationToken = default);
}
