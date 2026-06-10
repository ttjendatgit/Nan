using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.DTOs.Pricing;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

[Route("api/pricing-rules")]
public class PricingRulesController : BaseApiController
{
    private readonly IPricingRuleService _pricingRuleService;
    private readonly IValidator<CreatePricingRuleRequest> _createValidator;
    private readonly IValidator<UpdatePricingRuleRequest> _updateValidator;

    public PricingRulesController(
        IPricingRuleService pricingRuleService,
        IValidator<CreatePricingRuleRequest> createValidator,
        IValidator<UpdatePricingRuleRequest> updateValidator)
    {
        _pricingRuleService = pricingRuleService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet("product/{productId:guid}")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> GetByProduct(Guid productId, CancellationToken cancellationToken)
    {
        var result = await _pricingRuleService.GetByProductIdAsync(productId, cancellationToken);
        return OkResponse(result);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePricingRuleRequest request,
        CancellationToken cancellationToken)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _pricingRuleService.CreateAsync(request, cancellationToken);
        return OkResponse(result, "Pricing rule created successfully.");
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdatePricingRuleRequest request,
        CancellationToken cancellationToken)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _pricingRuleService.UpdateAsync(id, request, cancellationToken);
        return OkResponse(result, "Pricing rule updated successfully.");
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _pricingRuleService.DeleteAsync(id, cancellationToken);
        return OkResponse("Pricing rule deleted successfully.");
    }
}
