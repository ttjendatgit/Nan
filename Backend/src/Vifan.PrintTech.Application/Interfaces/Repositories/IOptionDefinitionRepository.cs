using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Application.Interfaces.Repositories;

public interface IOptionDefinitionRepository : IRepository<OptionDefinition>
{
    Task<IReadOnlyList<OptionDefinition>> GetAllAsync(bool activeOnly, CancellationToken cancellationToken = default);

    /// <summary>Number of Products this catalog entry is currently assigned to.</summary>
    Task<int> CountProductAssignmentsAsync(Guid optionDefinitionId, CancellationToken cancellationToken = default);

    /// <summary>True if any QuoteRequestOption snapshot still references this catalog entry (via its soft FK).</summary>
    Task<bool> IsReferencedByQuoteHistoryAsync(Guid optionDefinitionId, CancellationToken cancellationToken = default);
}
