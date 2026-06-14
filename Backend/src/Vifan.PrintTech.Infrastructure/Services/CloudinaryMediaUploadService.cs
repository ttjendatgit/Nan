using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Vifan.PrintTech.Application.DTOs.Media;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Infrastructure.Settings;

namespace Vifan.PrintTech.Infrastructure.Services;

public class CloudinaryMediaUploadService : IMediaUploadService
{
    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/avif"
    };

    private static readonly HashSet<string> AllowedVideoContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "video/mp4", "video/webm"
    };

    private const long MaxImageBytes = 10L * 1024 * 1024;   // 10 MB
    private const long MaxVideoBytes = 50L * 1024 * 1024;   // 50 MB

    private readonly Cloudinary _cloudinary;
    private readonly string _defaultFolder;
    private readonly ILogger<CloudinaryMediaUploadService> _logger;

    public CloudinaryMediaUploadService(
        IOptions<CloudinarySettings> settings,
        ILogger<CloudinaryMediaUploadService> logger)
    {
        var s = settings.Value;
        var account = new Account(s.CloudName, s.ApiKey, s.ApiSecret);
        _cloudinary = new Cloudinary(account) { Api = { Secure = true } };
        _defaultFolder = s.Folder;
        _logger = logger;
    }

    public async Task<MediaUploadResultDto> UploadSingleAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string? folder = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedFolder = ResolveFolder(folder);
        var isVideo = AllowedVideoContentTypes.Contains(contentType);

        if (isVideo)
        {
            var vp = new VideoUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = resolvedFolder,
                UseFilename = true,
                UniqueFilename = true,
            };
            var vr = await _cloudinary.UploadAsync(vp, cancellationToken);
            EnsureSuccess(vr, fileName);
            return MapVideoResult(vr, resolvedFolder);
        }

        ValidateImageType(contentType);

        var ip = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            Folder = resolvedFolder,
            UseFilename = true,
            UniqueFilename = true,
        };
        var ir = await _cloudinary.UploadAsync(ip, cancellationToken);
        EnsureSuccess(ir, fileName);
        return MapImageResult(ir, resolvedFolder);
    }

    public async Task<IReadOnlyList<MediaUploadResultDto>> UploadMultipleAsync(
        IEnumerable<(Stream Stream, string FileName, string ContentType)> files,
        string? folder = null,
        CancellationToken cancellationToken = default)
    {
        var results = new List<MediaUploadResultDto>();
        foreach (var (stream, fileName, contentType) in files)
        {
            var result = await UploadSingleAsync(stream, fileName, contentType, folder, cancellationToken);
            results.Add(result);
        }
        return results;
    }

    public async Task DeleteAsync(string publicId, CancellationToken cancellationToken = default)
    {
        var dp = new DeletionParams(publicId);
        var dr = await _cloudinary.DestroyAsync(dp);

        if (dr.Result != "ok")
            _logger.LogWarning("Cloudinary delete returned non-ok for {PublicId}: {Result}", publicId, dr.Result);
    }

    private static void ValidateImageType(string contentType)
    {
        if (!AllowedImageContentTypes.Contains(contentType))
            throw new ValidationException(
                $"File type '{contentType}' is not allowed. " +
                $"Accepted image types: {string.Join(", ", AllowedImageContentTypes)}. " +
                $"Accepted video types: {string.Join(", ", AllowedVideoContentTypes)}.");
    }

    private string ResolveFolder(string? folder) =>
        string.IsNullOrWhiteSpace(folder) ? _defaultFolder : $"{_defaultFolder}/{folder.Trim('/')}";

    private static void EnsureSuccess(RawUploadResult result, string fileName)
    {
        if (result.Error is not null)
            throw new InvalidOperationException(
                $"Cloudinary upload failed for '{fileName}': {result.Error.Message}");
    }

    private static MediaUploadResultDto MapImageResult(ImageUploadResult r, string folder) => new()
    {
        PublicId = r.PublicId ?? string.Empty,
        SecureUrl = r.SecureUrl?.ToString() ?? string.Empty,
        OriginalFilename = r.OriginalFilename ?? string.Empty,
        ResourceType = r.ResourceType ?? string.Empty,
        Format = r.Format ?? string.Empty,
        Width = r.Width,
        Height = r.Height,
        Bytes = r.Bytes,
        Folder = folder,
        CreatedAt = r.CreatedAt,
    };

    private static MediaUploadResultDto MapVideoResult(VideoUploadResult r, string folder) => new()
    {
        PublicId = r.PublicId ?? string.Empty,
        SecureUrl = r.SecureUrl?.ToString() ?? string.Empty,
        OriginalFilename = r.OriginalFilename ?? string.Empty,
        ResourceType = r.ResourceType ?? string.Empty,
        Format = r.Format ?? string.Empty,
        Width = r.Width,
        Height = r.Height,
        Bytes = r.Bytes,
        Folder = folder,
        CreatedAt = r.CreatedAt,
    };
}
