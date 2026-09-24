using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.Interfaces.Services;

namespace Vifan.PrintTech.API.Controllers;

/// <summary>
/// Anonymous, read-only access to Published content documents (Content Studio B1) -- the source for
/// public pages and the sitemap. A separate controller rather than [AllowAnonymous] actions on
/// ContentDocumentsController: that controller is Manager-only at class level and returns the
/// admin DTO (with DraftBlocksJson), so keeping the whole public surface here means it can be
/// audited in one place and an admin action can never become anonymous by accident.
///
/// Only Status = Published is ever returned (see IContentDocumentRepository); Type is a route
/// segment, parsed case-insensitively like everywhere else (e.g. "page" or "Page").
/// </summary>
[Route("api/content-documents/published")]
[AllowAnonymous]
public class PublishedContentDocumentsController : BaseApiController
{
    private readonly IContentDocumentService _contentDocumentService;

    public PublishedContentDocumentsController(IContentDocumentService contentDocumentService)
    {
        _contentDocumentService = contentDocumentService;
    }

    /// <summary>Slug + UpdatedAt of every Published document of this Type (sitemap source). Unpaged.</summary>
    [HttpGet("{type}")]
    public async Task<IActionResult> GetAll(string type, CancellationToken cancellationToken)
    {
        var result = await _contentDocumentService.GetPublishedSummariesAsync(type, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>The Published document with this Type + Slug. 404 when missing, of another Type, Draft or Archived.</summary>
    [HttpGet("{type}/{slug}")]
    public async Task<IActionResult> GetBySlug(string type, string slug, CancellationToken cancellationToken)
    {
        var result = await _contentDocumentService.GetPublishedAsync(type, slug, cancellationToken);
        return OkResponse(result);
    }
}
