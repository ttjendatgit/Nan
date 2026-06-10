using Vifan.PrintTech.Application.DTOs.Files;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IDesignFileService
{
    Task<DesignFileDto> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        long fileSize,
        Guid? orderItemId,
        Guid? quoteRequestId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DesignFileDto>> GetMyFilesAsync(CancellationToken cancellationToken = default);
    Task<DesignFileDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DesignFileDto> ReviewAsync(Guid id, ReviewDesignFileRequest request, CancellationToken cancellationToken = default);
}
