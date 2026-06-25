using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.DTOs.QuoteRequests;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

public class QuoteRequestsController : BaseApiController
{
    private readonly IQuoteRequestService _quoteRequestService;
    private readonly IValidator<CreateQuoteRequestRequest> _createValidator;
    private readonly IValidator<UpdateQuoteRequestStatusRequest> _statusValidator;

    public QuoteRequestsController(
        IQuoteRequestService quoteRequestService,
        IValidator<CreateQuoteRequestRequest> createValidator,
        IValidator<UpdateQuoteRequestStatusRequest> statusValidator)
    {
        _quoteRequestService = quoteRequestService;
        _createValidator = createValidator;
        _statusValidator = statusValidator;
    }

    /// <summary>Submit a new quote request. No authentication required.</summary>
    /// <remarks>
    /// Public customer-facing endpoint. Can be called from a product detail page or as a general inquiry.
    ///
    /// If <c>productId</c> is provided and the product exists, the product name and category name are
    /// snapshotted on the record so they remain visible even if the product data changes later.
    ///
    /// If <c>productId</c> is provided but the product is not found, a 404 error is returned.
    /// Omit <c>productId</c> entirely for a general inquiry.
    /// </remarks>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create(
        [FromBody] CreateQuoteRequestRequest request,
        CancellationToken cancellationToken)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _quoteRequestService.CreateAsync(request, cancellationToken);
        return OkResponse(result, "Quote request submitted successfully.");
    }

    /// <summary>Get a paginated list of all quote requests. Requires Staff or Manager role.</summary>
    /// <remarks>
    /// Supports optional query filters:
    /// <list type="bullet">
    ///   <item><c>status</c> — New | Contacted | Quoted | Closed | Cancelled</item>
    ///   <item><c>search</c> — matches fullName, phone, email, companyName</item>
    ///   <item><c>pageNumber</c> — default 1</item>
    ///   <item><c>pageSize</c> — default 10, max 100</item>
    /// </list>
    /// Results are ordered by <c>createdAt</c> descending.
    /// </remarks>
    [HttpGet]
    [Authorize(Roles = Roles.Staff + "," + Roles.Manager)]
    public async Task<IActionResult> GetAll(
        [FromQuery] QuoteRequestQueryParameters query,
        CancellationToken cancellationToken)
    {
        var result = await _quoteRequestService.GetAllAsync(query, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>Get a single quote request by ID. Requires Staff or Manager role.</summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Manager)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _quoteRequestService.GetByIdAsync(id, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>Update the status of a quote request. Requires Staff or Manager role.</summary>
    /// <remarks>
    /// Only the <c>status</c> field is updated. Valid values: <c>New</c>, <c>Contacted</c>, <c>Quoted</c>,
    /// <c>Closed</c>, <c>Cancelled</c>. All other fields remain unchanged.
    /// </remarks>
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Manager)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateQuoteRequestStatusRequest request,
        CancellationToken cancellationToken)
    {
        await _statusValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _quoteRequestService.UpdateStatusAsync(id, request, cancellationToken);
        return OkResponse(result, "Quote request status updated.");
    }

    /// <summary>Delete a quote request by ID. Requires Manager role.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _quoteRequestService.DeleteAsync(id, cancellationToken);
        return OkResponse("Quote request deleted successfully.");
    }
}
