using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.API.Helpers;
using Vifan.PrintTech.API.Requests.Catalog;
using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Catalog;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

public class CategoriesController : BaseApiController
{
    private readonly IProductCategoryService _categoryService;
    private readonly IMediaUploadService _mediaUploadService;
    private readonly IValidator<CreateProductCategoryRequest> _createValidator;
    private readonly IValidator<UpdateProductCategoryRequest> _updateValidator;

    public CategoriesController(
        IProductCategoryService categoryService,
        IMediaUploadService mediaUploadService,
        IValidator<CreateProductCategoryRequest> createValidator,
        IValidator<UpdateProductCategoryRequest> updateValidator)
    {
        _categoryService = categoryService;
        _mediaUploadService = mediaUploadService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    /// <summary>Get a paginated list of product categories.</summary>
    /// <remarks>
    /// Non-manager callers only see active categories. The <c>imageUrl</c> field is a Cloudinary <c>secureUrl</c>.
    /// </remarks>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var activeOnly = !User.IsInRole(Roles.Manager);
        var result = await _categoryService.GetAllAsync(activeOnly, query, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>Get a single category by ID.</summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var activeOnly = !User.IsInRole(Roles.Manager);
        var result = await _categoryService.GetByIdAsync(id, activeOnly, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>Create a new product category (JSON). Requires Manager role.</summary>
    /// <remarks>
    /// Provide <c>imageUrl</c> as a Cloudinary <c>secureUrl</c> obtained from <c>POST /api/Media/upload?folder=categories</c>.
    /// To upload the image in a single request, use <c>POST /api/Categories/with-image</c> instead.
    /// </remarks>
    [HttpPost]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductCategoryRequest request,
        CancellationToken cancellationToken)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _categoryService.CreateAsync(request, cancellationToken);
        return OkResponse(result, "Category created successfully.");
    }

    /// <summary>Update an existing product category (JSON). Requires Manager role.</summary>
    /// <remarks>
    /// To change the image, pass the new Cloudinary <c>secureUrl</c> in <c>imageUrl</c>.
    /// Set <c>imageUrl</c> to <c>null</c> to clear. To upload and update in one request, use
    /// <c>PUT /api/Categories/{id}/with-image</c> instead.
    /// </remarks>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateProductCategoryRequest request,
        CancellationToken cancellationToken)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _categoryService.UpdateAsync(id, request, cancellationToken);
        return OkResponse(result, "Category updated successfully.");
    }

    /// <summary>Delete a category by ID. Requires Manager role. Fails if the category has products.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _categoryService.DeleteAsync(id, cancellationToken);
        return OkResponse("Category deleted successfully.");
    }

    // ── Multipart / with-image endpoints ─────────────────────────────────────

    /// <summary>
    /// Create a new product category and upload its image in one request. Requires Manager role.
    /// </summary>
    /// <remarks>
    /// Send as <c>multipart/form-data</c>. If <c>image</c> is provided it is uploaded to Cloudinary
    /// (folder: <c>categories</c>) and the returned <c>secureUrl</c> is stored as <c>imageUrl</c>.
    ///
    /// Accepted image types: JPEG, PNG, WebP, AVIF. Maximum size: 10 MB.
    /// </remarks>
    [HttpPost("with-image")]
    [Authorize(Roles = Roles.Manager)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_485_760)]
    [RequestFormLimits(MultipartBodyLengthLimit = 10_485_760)]
    public async Task<IActionResult> CreateWithImage(
        [FromForm] CreateCategoryWithImageRequest request,
        CancellationToken cancellationToken)
    {
        var jsonRequest = new CreateProductCategoryRequest
        {
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description,
            IsActive = request.IsActive,
        };

        await _createValidator.ValidateAndThrowAsync(jsonRequest, cancellationToken);

        if (request.Image is { Length: > 0 })
        {
            var error = ImageUploadGuard.Validate(request.Image);
            if (error is not null)
                return FailResponse(error, StatusCodes.Status400BadRequest);

            await using var stream = request.Image.OpenReadStream();
            var uploaded = await _mediaUploadService.UploadSingleAsync(
                stream, request.Image.FileName, request.Image.ContentType,
                "categories", cancellationToken);

            jsonRequest.ImageUrl = uploaded.SecureUrl;
        }

        var result = await _categoryService.CreateAsync(jsonRequest, cancellationToken);
        return OkResponse(result, "Category created successfully.");
    }

    /// <summary>
    /// Update an existing product category and optionally replace its image. Requires Manager role.
    /// </summary>
    /// <remarks>
    /// Send as <c>multipart/form-data</c>. If <c>image</c> is provided it is uploaded to Cloudinary
    /// (folder: <c>categories</c>) and the returned <c>secureUrl</c> replaces <c>imageUrl</c>.
    /// If <c>image</c> is omitted, the existing <c>imageUrl</c> is preserved.
    ///
    /// Accepted image types: JPEG, PNG, WebP, AVIF. Maximum size: 10 MB.
    /// </remarks>
    [HttpPut("{id:guid}/with-image")]
    [Authorize(Roles = Roles.Manager)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_485_760)]
    [RequestFormLimits(MultipartBodyLengthLimit = 10_485_760)]
    public async Task<IActionResult> UpdateWithImage(
        Guid id,
        [FromForm] UpdateCategoryWithImageRequest request,
        CancellationToken cancellationToken)
    {
        var jsonRequest = new UpdateProductCategoryRequest
        {
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description,
            IsActive = request.IsActive,
        };

        await _updateValidator.ValidateAndThrowAsync(jsonRequest, cancellationToken);

        if (request.Image is { Length: > 0 })
        {
            var error = ImageUploadGuard.Validate(request.Image);
            if (error is not null)
                return FailResponse(error, StatusCodes.Status400BadRequest);

            await using var stream = request.Image.OpenReadStream();
            var uploaded = await _mediaUploadService.UploadSingleAsync(
                stream, request.Image.FileName, request.Image.ContentType,
                "categories", cancellationToken);

            jsonRequest.ImageUrl = uploaded.SecureUrl;
        }
        else
        {
            // No new image supplied — preserve the existing imageUrl.
            var existing = await _categoryService.GetByIdAsync(id, false, cancellationToken);
            jsonRequest.ImageUrl = existing.ImageUrl;
        }

        var result = await _categoryService.UpdateAsync(id, jsonRequest, cancellationToken);
        return OkResponse(result, "Category updated successfully.");
    }
}
