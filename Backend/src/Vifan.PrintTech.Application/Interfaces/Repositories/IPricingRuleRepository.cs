using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Application.Interfaces.Repositories;

public interface IPricingRuleRepository : IRepository<PricingRule>
{
    Task<IReadOnlyList<PricingRule>> GetByProductIdAsync(
        Guid productId,
        bool activeOnly,
        CancellationToken cancellationToken = default);

    Task<PricingRule?> FindBestMatchAsync(
        Guid productId,
        int quantity,
        string? material,
        string? size,
        string? printingSide,
        CancellationToken cancellationToken = default);
}
