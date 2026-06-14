using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.DTOs.Media;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

// TODO: Once role-based authorization is tightened, restrict write endpoints to Staff/Manager only.
//       Currently any authenticated user can upload. For public-facing design upload flows
//       (e.g. AI Designer mockup), the Customer role is sufficient.
//       For admin dashboard image management (hero, products, materials), restrict to Staff/Manager.

[Route("api/[controller]")]
[Authorize]
public class MediaController : BaseApiController
{
    private readonly IMediaUploadService _mediaUploadService;

    // Supported folder slugs a caller may supply as ?folder=<slug>
    private static readonly HashSet<string> AllowedFolders = new(StringComparer.OrdinalIgnoreCase)
    {
        "homepage", "products", "categories", "materials", "design-uploads", "temp",
        "collections", "hero"
    };

    private const int MaxFilesPerRequest = 10;

    public MediaController(IMediaUploadService mediaUploadService)
    {
        _mediaUploadService = mediaUploadService;
    }

    /// <summary>
    /// Upload a single image or video to Cloudinary.
    /// </summary>
    /// <remarks>
    /// POST /api/Media/upload?folder=products
    ///
    /// Accepted content types: image/jpeg, image/png, image/webp, image/avif, video/mp4, video/webm
    /// Max size: 10 MB for images, 50 MB for videos.
    /// </remarks>
    [HttpPost("upload")]
    [RequestSizeLimit(52_428_800)]
    [RequestFormLimits(MultipartBodyLengthLimit = 52_428_800)]
    public async Task<IActionResult> Upload(
        IFormFile file,
        [FromQuery] string? folder,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return FailResponse("File is required.", StatusCodes.Status400BadRequest);

        var resolvedFolder = ResolveFolder(folder);

        await using var stream = file.OpenReadStream();
        var result = await _mediaUploadService.UploadSingleAsync(
            stream,
            file.FileName,
            file.ContentType,
            resolvedFolder,
            cancellationToken);

        return OkResponse(result, "File uploaded successfully.");
    }

    /// <summary>
    /// Upload multiple images (up to 10) to Cloudinary in one request.
    /// </summary>
    /// <remarks>
    /// POST /api/Media/upload-multiple?folder=products
    ///
    /// Accepted content types: image/jpeg, image/png, image/webp, image/avif
    /// Max size: 10 MB per file.  Max 10 files per request.
    /// </remarks>
    [HttpPost("upload-multiple")]
    [RequestSizeLimit(104_857_600)]
    [RequestFormLimits(MultipartBodyLengthLimit = 104_857_600)]
    public async Task<IActionResult> UploadMultiple(
        IFormFileCollection files,
        [FromQuery] string? folder,
        CancellationToken cancellationToken)
    {
        if (files is null || files.Count == 0)
            return FailResponse("At least one file is required.", StatusCodes.Status400BadRequest);

        if (files.Count > MaxFilesPerRequest)
            return FailResponse($"Maximum {MaxFilesPerRequest} files per request.", StatusCodes.Status400BadRequest);

        var resolvedFolder = ResolveFolder(folder);

        var fileInputs = files.Select<IFormFile, (Stream, string, string)>(
            f => (f.OpenReadStream(), f.FileName, f.ContentType));

        var results = await _mediaUploadService.UploadMultipleAsync(fileInputs, resolvedFolder, cancellationToken);
        return OkResponse(results, $"{results.Count} file(s) uploaded successfully.");
    }

    /// <summary>
    /// Delete a media asset from Cloudinary by its public ID.
    /// </summary>
    /// <remarks>
    /// DELETE /api/Media/{publicId}
    ///
    /// The publicId must be URL-encoded if it contains slashes (e.g. nan%2Fproducts%2Fabc123).
    /// </remarks>
    [HttpDelete("{*publicId}")]
    [Authorize(Roles = $"{Roles.Staff},{Roles.Manager}")]
    public async Task<IActionResult> Delete(string publicId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(publicId))
            return FailResponse("publicId is required.", StatusCodes.Status400BadRequest);

        await _mediaUploadService.DeleteAsync(publicId, cancellationToken);
        return OkResponse("Asset deleted.");
    }

    // GET /api/Media — TODO: implement paginated media list via Cloudinary Admin API
    // This requires the cloudinary Admin API which uses the API secret server-side.
    // Deferred until the admin dashboard CMS module is built.

    private static string? ResolveFolder(string? folder)
    {
        if (string.IsNullOrWhiteSpace(folder)) return null;
        var trimmed = folder.Trim().ToLowerInvariant();
        return AllowedFolders.Contains(trimmed) ? trimmed : null;
    }
}
