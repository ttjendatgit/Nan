using Vifan.PrintTech.Application.DTOs.Files;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Infrastructure.Services;

public class DesignFileService : IDesignFileService
{
    private readonly IDesignFileRepository _designFileRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public DesignFileService(
        IDesignFileRepository designFileRepository,
        IFileStorageService fileStorageService,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _designFileRepository = designFileRepository;
        _fileStorageService = fileStorageService;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    public async Task<DesignFileDto> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        long fileSize,
        Guid? orderItemId,
        Guid? quoteRequestId,
        CancellationToken cancellationToken = default)
    {
        var customerId = RequireUserId();
        if (!_currentUserService.IsInRole(Roles.Customer))
            throw new ForbiddenException("Only customers can upload design files.");

        ValidateFile(fileName, fileSize);

        var (relativeUrl, _) = await _fileStorageService.SaveDesignFileAsync(
            fileStream,
            fileName,
            contentType,
            customerId,
            cancellationToken);

        var designFile = new DesignFile
        {
            CustomerId = customerId,
            OrderItemId = orderItemId,
            QuoteRequestId = quoteRequestId,
            FileName = Path.GetFileName(fileName),
            FileUrl = relativeUrl,
            FileType = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant(),
            FileSize = fileSize,
            ReviewStatus = ReviewStatus.Pending,
            UploadedAt = DateTime.UtcNow
        };

        await _designFileRepository.AddAsync(designFile, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(designFile);
    }

    public async Task<IReadOnlyList<DesignFileDto>> GetMyFilesAsync(
        CancellationToken cancellationToken = default)
    {
        var userId = RequireUserId();

        if (!_currentUserService.IsInRole(Roles.Customer))
            throw new ForbiddenException("Only customers can list their uploaded files.");

        var files = await _designFileRepository.GetByCustomerIdAsync(userId, cancellationToken);
        return files.Select(MapToDto).ToList();
    }

    public async Task<DesignFileDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var file = await _designFileRepository.GetByIdWithDetailsAsync(id, cancellationToken)
            ?? throw new NotFoundException("Design file not found.");

        EnsureCanView(file);
        return MapToDto(file);
    }

    public async Task<DesignFileDto> ReviewAsync(
        Guid id,
        ReviewDesignFileRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.IsInRole(Roles.Staff) && !_currentUserService.IsInRole(Roles.Manager))
            throw new ForbiddenException("Only Staff or Manager can review design files.");

        var reviewerId = RequireUserId();
        var file = await _designFileRepository.GetByIdWithDetailsAsync(id, cancellationToken)
            ?? throw new NotFoundException("Design file not found.");

        if (!Enum.TryParse<ReviewStatus>(request.ReviewStatus, ignoreCase: true, out var status) ||
            status == ReviewStatus.Pending)
            throw new ValidationException("Invalid review status.");

        file.ReviewStatus = status;
        file.ReviewNote = request.ReviewNote;
        file.StaffId = reviewerId;
        file.ReviewedAt = DateTime.UtcNow;

        _designFileRepository.Update(file);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(file);
    }

    private void EnsureCanView(DesignFile file)
    {
        var userId = _currentUserService.UserId;

        if (_currentUserService.IsInRole(Roles.Manager))
            return;

        if (_currentUserService.IsInRole(Roles.Customer) && file.CustomerId == userId)
            return;

        if (_currentUserService.IsInRole(Roles.Staff))
        {
            // Staff: pending reviews, files they reviewed, or linked to orders/quotes (when modules exist)
            if (file.ReviewStatus == ReviewStatus.Pending ||
                file.StaffId == userId ||
                file.OrderItemId.HasValue ||
                file.QuoteRequestId.HasValue)
                return;
        }

        throw new ForbiddenException("You do not have permission to view this file.");
    }

    private static void ValidateFile(string fileName, long fileSize)
    {
        if (fileSize <= 0)
            throw new ValidationException("File is empty.");

        if (fileSize > DesignFileConstants.MaxFileSizeBytes)
            throw new ValidationException("File size exceeds the 50MB limit.");

        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(extension) || !DesignFileConstants.AllowedExtensions.Contains(extension))
            throw new ValidationException(
                $"File type not allowed. Allowed types: {string.Join(", ", DesignFileConstants.AllowedExtensions)}.");
    }

    private Guid RequireUserId()
    {
        if (!_currentUserService.UserId.HasValue)
            throw new UnauthorizedException();

        return _currentUserService.UserId.Value;
    }

    private static DesignFileDto MapToDto(DesignFile file) =>
        new()
        {
            Id = file.Id,
            CustomerId = file.CustomerId,
            OrderItemId = file.OrderItemId,
            QuoteRequestId = file.QuoteRequestId,
            FileName = file.FileName,
            FileUrl = file.FileUrl,
            FileType = file.FileType,
            FileSize = file.FileSize,
            ReviewStatus = file.ReviewStatus.ToString(),
            StaffId = file.StaffId,
            ReviewNote = file.ReviewNote,
            UploadedAt = file.UploadedAt,
            ReviewedAt = file.ReviewedAt
        };
}
