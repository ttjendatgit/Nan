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
//
// Media Library note (Content Studio Phase 2.0): Upload/UploadMultiple now also index every
// upload as a MediaAsset row via IMediaService, so the class-level [Authorize] here deliberately
// stays as broad as it already was -- tightening it to Manager-only would break the existing
// Customer-facing AI Designer upload flow this controller already serves. GetList (the new
// Media Library browsing endpoint) is Manager-only on its own action instead, since it's a purely
// new admin surface with no existing caller to preserve.
[Route("api/[controller]")]
[Authorize]
public class MediaController : BaseApiController
{
    private readonly IMediaUploadService _mediaUploadService;
    private readonly IMediaService _mediaService;

    // Supported folder slugs a caller may supply as ?folder=<slug>
    private static readonly HashSet<string> AllowedFolders = new(StringComparer.OrdinalIgnoreCase)
    {
        "homepage", "products", "categories", "materials", "design-uploads", "temp",
        "collections", "hero", "content"
    };

    private const int MaxFilesPerRequest = 10;

    public MediaController(IMediaUploadService mediaUploadService, IMediaService mediaService)
    {
        _mediaUploadService = mediaUploadService;
        _mediaService = mediaService;
    }

    /// <summary>
    /// Get a paginated list of indexed Media Library assets, optionally filtered by filename.
    /// </summary>
    /// <remarks>
    /// GET /api/Media?search=&amp;pageNumber=&amp;pageSize=
    ///
    /// Only assets uploaded through this controller (or a later phase's Product/Category
    /// retrofit) appear here -- Cloudinary assets uploaded before the Media Library existed are
    /// not backfilled by this phase.
    /// </remarks>
    [HttpGet]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> GetList([FromQuery] MediaAssetQueryParameters query, CancellationToken cancellationToken)
    {
        var result = await _mediaService.GetListAsync(query, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>
    /// Upload a single image or video to Cloudinary and index it in the Media Library.
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
        var asset = await _mediaService.UploadAsync(
            stream,
            file.FileName,
            file.ContentType,
            resolvedFolder,
            cancellationToken);

        // Response shape is deliberately unchanged (MediaUploadResultDto, not MediaAssetDto):
        // existing callers (ContentBlockEditor.tsx, useCatalogImageUpload.ts) already read
        // .secureUrl/.publicId from this exact endpoint. Both map directly and losslessly from
        // the new MediaAsset fields; nothing here is reconstructed or guessed.
        return OkResponse(ToLegacyUploadResult(asset), "File uploaded successfully.");
    }

    /// <summary>
    /// Upload multiple images (up to 10) to Cloudinary and index them in the Media Library.
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

        var results = new List<MediaUploadResultDto>();
        foreach (var file in files)
        {
            await using var stream = file.OpenReadStream();
            var asset = await _mediaService.UploadAsync(
                stream, file.FileName, file.ContentType, resolvedFolder, cancellationToken);
            results.Add(ToLegacyUploadResult(asset));
        }

        return OkResponse(results, $"{results.Count} file(s) uploaded successfully.");
    }

    /// <summary>
    /// Delete a media asset, both from the Media Library index and from Cloudinary.
    /// </summary>
    /// <remarks>
    /// DELETE /api/Media/{id} -- id is a MediaAsset GUID (the new Media Library path).
    ///
    /// DELETE /api/Media/{publicId} still works for a raw Cloudinary public ID (the original,
    /// pre-Media-Library behavior) -- e.g. an asset uploaded before this phase, with no
    /// MediaAsset row to look up. The publicId must be URL-encoded if it contains slashes
    /// (e.g. nan%2Fproducts%2Fabc123). A public ID is never a valid GUID, so the two cases never
    /// collide.
    /// </remarks>
    [HttpDelete("{*idOrPublicId}")]
    [Authorize(Roles = $"{Roles.Staff},{Roles.Manager}")]
    public async Task<IActionResult> Delete(string idOrPublicId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(idOrPublicId))
            return FailResponse("id is required.", StatusCodes.Status400BadRequest);

        if (Guid.TryParse(idOrPublicId, out var mediaAssetId))
        {
            await _mediaService.DeleteAsync(mediaAssetId, cancellationToken);
            return OkResponse("Asset deleted.");
        }

        await _mediaUploadService.DeleteAsync(idOrPublicId, cancellationToken);
        return OkResponse("Asset deleted.");
    }

    private static MediaUploadResultDto ToLegacyUploadResult(MediaAssetDto asset)
    {
        var extension = asset.FileName.Contains('.') ? asset.FileName[(asset.FileName.LastIndexOf('.') + 1)..] : string.Empty;
        var resourceType = asset.MimeType.StartsWith("video/", StringComparison.OrdinalIgnoreCase) ? "video" : "image";

        return new MediaUploadResultDto
        {
            PublicId = asset.PublicId,
            SecureUrl = asset.Url,
            OriginalFilename = asset.OriginalName,
            ResourceType = resourceType,
            Format = extension,
            Width = asset.Width,
            Height = asset.Height,
            Bytes = asset.Size,
            Folder = asset.Folder ?? string.Empty,
            CreatedAt = asset.CreatedAt
        };
    }

    private static string? ResolveFolder(string? folder)
    {
        if (string.IsNullOrWhiteSpace(folder)) return null;
        var trimmed = folder.Trim().ToLowerInvariant();
        return AllowedFolders.Contains(trimmed) ? trimmed : null;
    }
}
