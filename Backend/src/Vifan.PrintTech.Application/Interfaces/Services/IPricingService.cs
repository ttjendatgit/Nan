using Vifan.PrintTech.Application.DTOs.Pricing;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IPricingService
{
    Task<PriceBreakdownDto> CalculateAsync(
        CalculatePriceRequest request,
        CancellationToken cancellationToken = default);
}
