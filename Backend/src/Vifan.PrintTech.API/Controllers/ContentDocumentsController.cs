using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.DTOs.Content;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

/// <summary>
/// Manages ContentDocument records -- the Content Studio foundation for future product content,
/// static pages, and blog posts (Phase 1.1/1.2). Manager-only throughout: every action here
/// returns the admin DTO, including DraftBlocksJson. The anonymous, Published-only read path lives
/// in PublishedContentDocumentsController (Content Studio B1), deliberately not as
/// [AllowAnonymous] actions on this controller. Follows the same all-Manager convention as
/// OptionDefinitionsController/PricingRulesController/ProductOptionsController.
/// </summary>
[Route("api/content-documents")]
[Authorize(Roles = Roles.Manager)]
public class ContentDocumentsController : BaseApiController
{
    private readonly IContentDocumentService _contentDocumentService;
    private readonly IValidator<CreateContentDocumentRequest> _createValidator;
    private readonly IValidator<UpdateContentDocumentRequest> _updateValidator;

    public ContentDocumentsController(
        IContentDocumentService contentDocumentService,
        IValidator<CreateContentDocumentRequest> createValidator,
        IValidator<UpdateContentDocumentRequest> updateValidator)
    {
        _contentDocumentService = contentDocumentService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    /// <summary>Get a paginated list of content documents. Optionally filter by Type (ProductContent, Page, BlogPost).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] ContentDocumentQueryParameters query,
        CancellationToken cancellationToken)
    {
        var result = await _contentDocumentService.GetAllAsync(query, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>Get a single content document by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _contentDocumentService.GetByIdAsync(id, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>Create a new content document.</summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateContentDocumentRequest request,
        CancellationToken cancellationToken)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _contentDocumentService.CreateAsync(request, cancellationToken);
        return OkResponse(result, "Content document created successfully.");
    }

    /// <summary>Update an existing content document. Type and ProductId cannot be changed after creation.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateContentDocumentRequest request,
        CancellationToken cancellationToken)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _contentDocumentService.UpdateAsync(id, request, cancellationToken);
        return OkResponse(result, "Content document updated successfully.");
    }

    /// <summary>Delete a content document by ID.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _contentDocumentService.DeleteAsync(id, cancellationToken);
        return OkResponse("Content document deleted successfully.");
    }
}
