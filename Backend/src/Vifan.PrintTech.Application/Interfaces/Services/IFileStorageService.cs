namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IFileStorageService
{
    Task<(string RelativeUrl, string StoredFileName)> SaveDesignFileAsync(
        Stream fileStream,
        string originalFileName,
        string contentType,
        Guid customerId,
        CancellationToken cancellationToken = default);

    Task DeleteFileAsync(string relativeUrl, CancellationToken cancellationToken = default);
}
