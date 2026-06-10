using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.DTOs.Pricing;
using Vifan.PrintTech.Application.Interfaces.Services;

namespace Vifan.PrintTech.API.Controllers;

[Route("api/pricing")]
public class PricingController : BaseApiController
{
    private readonly IPricingService _pricingService;
    private readonly IValidator<CalculatePriceRequest> _calculateValidator;

    public PricingController(
        IPricingService pricingService,
        IValidator<CalculatePriceRequest> calculateValidator)
    {
        _pricingService = pricingService;
        _calculateValidator = calculateValidator;
    }

    [HttpPost("calculate")]
    [AllowAnonymous]
    public async Task<IActionResult> Calculate(
        [FromBody] CalculatePriceRequest request,
        CancellationToken cancellationToken)
    {
        await _calculateValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _pricingService.CalculateAsync(request, cancellationToken);
        return OkResponse(result);
    }
}
