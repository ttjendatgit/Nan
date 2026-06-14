using Vifan.PrintTech.Application.DTOs.Media;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IMediaUploadService
{
    Task<MediaUploadResultDto> UploadSingleAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string? folder = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MediaUploadResultDto>> UploadMultipleAsync(
        IEnumerable<(Stream Stream, string FileName, string ContentType)> files,
        string? folder = null,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(string publicId, CancellationToken cancellationToken = default);
}
