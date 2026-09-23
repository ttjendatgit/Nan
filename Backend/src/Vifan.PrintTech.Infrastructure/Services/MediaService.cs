using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Media;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Services;

public class MediaService : IMediaService
{
    private readonly IMediaUploadService _mediaUploadService;
    private readonly IMediaAssetRepository _mediaAssetRepository;
    private readonly IUnitOfWork _unitOfWork;

    public MediaService(
        IMediaUploadService mediaUploadService,
        IMediaAssetRepository mediaAssetRepository,
        IUnitOfWork unitOfWork)
    {
        _mediaUploadService = mediaUploadService;
        _mediaAssetRepository = mediaAssetRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<MediaAssetDto> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string? folder,
        CancellationToken cancellationToken = default)
    {
        var uploadResult = await _mediaUploadService.UploadSingleAsync(
            fileStream, fileName, contentType, folder, cancellationToken);

        var asset = new MediaAsset
        {
            FileName = BuildStoredFileName(uploadResult.PublicId, uploadResult.Format),
            OriginalName = fileName,
            Url = uploadResult.SecureUrl,
            PublicId = uploadResult.PublicId,
            MimeType = contentType,
            Size = uploadResult.Bytes,
            Width = uploadResult.Width,
            Height = uploadResult.Height,
            Folder = string.IsNullOrWhiteSpace(uploadResult.Folder) ? null : uploadResult.Folder
        };

        await _mediaAssetRepository.AddAsync(asset, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(asset);
    }

    public async Task<PagedResult<MediaAssetDto>> GetListAsync(
        MediaAssetQueryParameters query,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediaAssetRepository.GetPagedAsync(
            query.Search, query.PageNumber, query.PageSize, cancellationToken);

        return new PagedResult<MediaAssetDto>
        {
            Items = result.Items.Select(MapToDto).ToList(),
            PageNumber = result.PageNumber,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount
        };
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var asset = await _mediaAssetRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Media asset not found.");

        // Remote delete first -- only drop the local index row once Cloudinary confirms (or at
        // least doesn't throw); otherwise a transient failure would leave the row gone locally
        // while the asset is still actually live on Cloudinary, with nothing left to find it by.
        await _mediaUploadService.DeleteAsync(asset.PublicId, cancellationToken);

        _mediaAssetRepository.Remove(asset);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static string BuildStoredFileName(string publicId, string format)
    {
        var lastSegment = publicId.Contains('/') ? publicId[(publicId.LastIndexOf('/') + 1)..] : publicId;
        return string.IsNullOrWhiteSpace(format) ? lastSegment : $"{lastSegment}.{format}";
    }

    private static MediaAssetDto MapToDto(MediaAsset asset) => new()
    {
        Id = asset.Id,
        FileName = asset.FileName,
        OriginalName = asset.OriginalName,
        Url = asset.Url,
        PublicId = asset.PublicId,
        MimeType = asset.MimeType,
        Size = asset.Size,
        Width = asset.Width,
        Height = asset.Height,
        Folder = asset.Folder,
        CreatedAt = asset.CreatedAt,
        UpdatedAt = asset.UpdatedAt
    };
}
