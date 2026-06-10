using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Infrastructure.Settings;

namespace Vifan.PrintTech.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _webRootPath;
    private readonly FileStorageSettings _settings;

    public LocalFileStorageService(
        IWebHostEnvironment environment,
        IOptions<FileStorageSettings> settings)
    {
        _webRootPath = environment.WebRootPath
            ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        _settings = settings.Value;
    }

    public async Task<(string RelativeUrl, string StoredFileName)> SaveDesignFileAsync(
        Stream fileStream,
        string originalFileName,
        string contentType,
        Guid customerId,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(originalFileName);
        var storedFileName = $"{Guid.NewGuid():N}{extension}";
        var relativePath = Path.Combine(_settings.DesignUploadSubPath, customerId.ToString(), storedFileName)
            .Replace('\\', '/');
        var relativeUrl = "/" + relativePath;
        var fullPath = Path.Combine(_webRootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var file = File.Create(fullPath);
        await fileStream.CopyToAsync(file, cancellationToken);

        return (relativeUrl, storedFileName);
    }

    public Task DeleteFileAsync(string relativeUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl))
            return Task.CompletedTask;

        var relativePath = relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(_webRootPath, relativePath);

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }
}
