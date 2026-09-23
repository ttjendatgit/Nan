using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Media;

namespace Vifan.PrintTech.Application.Interfaces.Services;

/// <summary>
/// The Media Library: uploads a file (via the existing IMediaUploadService/Cloudinary) and keeps
/// a local, queryable index of it, so "browse everything ever uploaded" doesn't require calling
/// Cloudinary's Admin API. Deliberately separate from IMediaUploadService -- that interface stays
/// a pure "talk to the storage provider" concern with no database awareness, used as-is by
/// existing callers (Product/Category image upload, the legacy ContentBlockEditor) that don't
/// need Media Library indexing.
/// </summary>
public interface IMediaService
{
    /// <summary>Uploads to Cloudinary and records a MediaAsset row in the same operation --
    /// either both succeed, or the whole call throws (no silently-unindexed uploads).</summary>
    Task<MediaAssetDto> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string? folder,
        CancellationToken cancellationToken = default);

    Task<PagedResult<MediaAssetDto>> GetListAsync(
        MediaAssetQueryParameters query,
        CancellationToken cancellationToken = default);

    /// <summary>Deletes both the Cloudinary asset and its MediaAsset row.</summary>
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
