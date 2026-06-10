using Vifan.PrintTech.Application.DTOs.Pricing;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IPricingRuleService
{
    Task<IReadOnlyList<PricingRuleDto>> GetByProductIdAsync(
        Guid productId,
        CancellationToken cancellationToken = default);

    Task<PricingRuleDto> CreateAsync(
        CreatePricingRuleRequest request,
        CancellationToken cancellationToken = default);

    Task<PricingRuleDto> UpdateAsync(
        Guid id,
        UpdatePricingRuleRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
