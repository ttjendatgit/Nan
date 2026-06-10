using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.DTOs.Files;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

[Route("api/[controller]")]
[Authorize]
public class FilesController : BaseApiController
{
    private readonly IDesignFileService _designFileService;
    private readonly IValidator<ReviewDesignFileRequest> _reviewValidator;

    public FilesController(
        IDesignFileService designFileService,
        IValidator<ReviewDesignFileRequest> reviewValidator)
    {
        _designFileService = designFileService;
        _reviewValidator = reviewValidator;
    }

    [HttpPost("upload-design")]
    [Authorize(Roles = Roles.Customer)]
    [RequestSizeLimit(52_428_800)]
    [RequestFormLimits(MultipartBodyLengthLimit = 52_428_800)]
    public async Task<IActionResult> UploadDesign(
        IFormFile file,
        [FromForm] Guid? orderItemId,
        [FromForm] Guid? quoteRequestId,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return FailResponse("File is required.", StatusCodes.Status400BadRequest);

        await using var stream = file.OpenReadStream();
        var result = await _designFileService.UploadAsync(
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            orderItemId,
            quoteRequestId,
            cancellationToken);

        return OkResponse(result, "Design file uploaded successfully.");
    }

    [HttpGet("my")]
    [Authorize(Roles = Roles.Customer)]
    public async Task<IActionResult> GetMyFiles(CancellationToken cancellationToken)
    {
        var files = await _designFileService.GetMyFilesAsync(cancellationToken);
        return OkResponse(files);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var file = await _designFileService.GetByIdAsync(id, cancellationToken);
        return OkResponse(file);
    }

    [HttpPut("{id:guid}/review")]
    [Authorize(Roles = $"{Roles.Staff},{Roles.Manager}")]
    public async Task<IActionResult> Review(
        Guid id,
        [FromBody] ReviewDesignFileRequest request,
        CancellationToken cancellationToken)
    {
        await _reviewValidator.ValidateAndThrowAsync(request, cancellationToken);
        var file = await _designFileService.ReviewAsync(id, request, cancellationToken);
        return OkResponse(file, "Design file reviewed.");
    }
}
