using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.DTOs.OptionCatalog;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

/// <summary>
/// Manages the central option catalog admins pick from when assigning options to a Product.
/// Admin-only surface: creating a catalog entry here never, by itself, exposes it to any
/// customer -- it only becomes visible on a product after an explicit assignment
/// (see ProductsController's /{productId}/options endpoints and ProductOptionsController).
/// </summary>
[Route("api/option-definitions")]
[Authorize(Roles = Roles.Manager)]
public class OptionDefinitionsController : BaseApiController
{
    private readonly IOptionDefinitionService _service;
    private readonly IValidator<CreateOptionDefinitionRequest> _createValidator;
    private readonly IValidator<UpdateOptionDefinitionRequest> _updateValidator;

    public OptionDefinitionsController(
        IOptionDefinitionService service,
        IValidator<CreateOptionDefinitionRequest> createValidator,
        IValidator<UpdateOptionDefinitionRequest> updateValidator)
    {
        _service = service;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    /// <summary>List the full catalog, including inactive entries and each entry's current product-assignment count.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly, CancellationToken cancellationToken)
    {
        var result = await _service.GetAllAsync(activeOnly, cancellationToken);
        return OkResponse(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _service.GetByIdAsync(id, cancellationToken);
        return OkResponse(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOptionDefinitionRequest request, CancellationToken cancellationToken)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _service.CreateAsync(request, cancellationToken);
        return OkResponse(result, "Option catalog entry created successfully.");
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOptionDefinitionRequest request, CancellationToken cancellationToken)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _service.UpdateAsync(id, request, cancellationToken);
        return OkResponse(result, "Option catalog entry updated successfully.");
    }

    /// <summary>
    /// Permanently deletes a catalog entry. Rejected (422) if the entry is referenced by any
    /// quote history or is currently assigned to any product -- deactivate instead in that case.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _service.DeleteAsync(id, cancellationToken);
        return OkResponse("Option catalog entry deleted successfully.");
    }
}
