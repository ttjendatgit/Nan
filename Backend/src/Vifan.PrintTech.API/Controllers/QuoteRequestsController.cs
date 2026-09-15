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
    private readonly IValidator<SetFinalQuotedPriceRequest> _finalPriceValidator;

    public QuoteRequestsController(
        IQuoteRequestService quoteRequestService,
        IValidator<CreateQuoteRequestRequest> createValidator,
        IValidator<UpdateQuoteRequestStatusRequest> statusValidator,
        IValidator<SetFinalQuotedPriceRequest> finalPriceValidator)
    {
        _quoteRequestService = quoteRequestService;
        _createValidator = createValidator;
        _statusValidator = statusValidator;
        _finalPriceValidator = finalPriceValidator;
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
    ///
    /// A real transition into <c>Contacted</c> or <c>Quoted</c> triggers a customer notification
    /// email, sent to the quote's own customer-provided contact email (never client-supplied on
    /// this request). That address is unverified -- Nan does not confirm email ownership at quote
    /// submission or anywhere else -- so this is best-effort delivery, not a confirmed or
    /// account-linked address. The response's <c>data.notification</c> reports the outcome
    /// (<c>Sent</c>, <c>Failed</c>, <c>SkippedNoEmail</c>, or <c>NotRequired</c>); a failed or
    /// skipped send never rolls back the already-saved status.
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

    /// <summary>Set the final quoted price for a quote. Requires Staff or Manager role.</summary>
    /// <remarks>
    /// Additive manual override only — never recalculates or overwrites the system's original
    /// pricing snapshot (CalculatedTotalSnapshot), which remains the historical record of what
    /// the pricing engine computed at submission time.
    /// </remarks>
    [HttpPut("{id:guid}/final-price")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Manager)]
    public async Task<IActionResult> SetFinalPrice(
        Guid id,
        [FromBody] SetFinalQuotedPriceRequest request,
        CancellationToken cancellationToken)
    {
        await _finalPriceValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _quoteRequestService.SetFinalQuotedPriceAsync(id, request, cancellationToken);
        return OkResponse(result, "Final quoted price saved.");
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
