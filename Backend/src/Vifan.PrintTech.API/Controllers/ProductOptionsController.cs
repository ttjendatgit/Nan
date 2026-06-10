using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.DTOs.Options;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

[Route("api/product-options")]
public class ProductOptionsController : BaseApiController
{
    private readonly IProductOptionService _productOptionService;
    private readonly IValidator<UpdateProductOptionRequest> _updateValidator;

    public ProductOptionsController(
        IProductOptionService productOptionService,
        IValidator<UpdateProductOptionRequest> updateValidator)
    {
        _productOptionService = productOptionService;
        _updateValidator = updateValidator;
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateProductOptionRequest request,
        CancellationToken cancellationToken)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _productOptionService.UpdateAsync(id, request, cancellationToken);
        return OkResponse(result, "Product option updated successfully.");
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _productOptionService.DeleteAsync(id, cancellationToken);
        return OkResponse("Product option deleted successfully.");
    }
}
