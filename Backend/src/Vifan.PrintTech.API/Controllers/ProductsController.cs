using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.API.Helpers;
using Vifan.PrintTech.API.Requests.Catalog;
using Vifan.PrintTech.Application.DTOs.Catalog;
using Vifan.PrintTech.Application.DTOs.Options;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

public class ProductsController : BaseApiController
{
    private readonly IProductService _productService;
    private readonly IProductOptionService _productOptionService;
    private readonly IMediaUploadService _mediaUploadService;
    private readonly IValidator<CreateProductRequest> _createValidator;
    private readonly IValidator<UpdateProductRequest> _updateValidator;
    private readonly IValidator<CreateProductOptionRequest> _createOptionValidator;

    public ProductsController(
        IProductService productService,
        IProductOptionService productOptionService,
        IMediaUploadService mediaUploadService,
        IValidator<CreateProductRequest> createValidator,
        IValidator<UpdateProductRequest> updateValidator,
        IValidator<CreateProductOptionRequest> createOptionValidator)
    {
        _productService = productService;
        _productOptionService = productOptionService;
        _mediaUploadService = mediaUploadService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _createOptionValidator = createOptionValidator;
    }

    /// <summary>Get a paginated list of products.</summary>
    /// <remarks>
    /// Non-manager callers only see active products. The <c>imageUrl</c> field in each result
    /// is a Cloudinary <c>secureUrl</c> — render it directly in an &lt;img&gt; tag.
    /// </remarks>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] ProductQueryParameters query,
        CancellationToken cancellationToken)
    {
        if (!User.IsInRole(Roles.Manager))
            query.ActiveOnly = true;

        var result = await _productService.GetAllAsync(query, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>Get a single product by ID.</summary>
    /// <remarks>
    /// The <c>imageUrl</c> field is a Cloudinary <c>secureUrl</c>.
    /// </remarks>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var activeOnly = !User.IsInRole(Roles.Manager);
        var result = await _productService.GetByIdAsync(id, activeOnly, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>Get paginated products filtered by category ID.</summary>
    [HttpGet("by-category/{categoryId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByCategory(
        Guid categoryId,
        [FromQuery] ProductQueryParameters query,
        CancellationToken cancellationToken)
    {
        if (!User.IsInRole(Roles.Manager))
            query.ActiveOnly = true;

        var result = await _productService.GetByCategoryAsync(categoryId, query, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>Create a new product (JSON). Requires Manager role.</summary>
    /// <remarks>
    /// Provide <c>imageUrl</c> as a Cloudinary <c>secureUrl</c> obtained from <c>POST /api/Media/upload?folder=products</c>.
    /// To upload the image in a single request, use <c>POST /api/Products/with-image</c> instead.
    /// </remarks>
    [HttpPost]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductRequest request,
        CancellationToken cancellationToken)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _productService.CreateAsync(request, cancellationToken);
        return OkResponse(result, "Product created successfully.");
    }

    /// <summary>Update an existing product (JSON). Requires Manager role.</summary>
    /// <remarks>
    /// To change the image, pass the new Cloudinary <c>secureUrl</c> in <c>imageUrl</c>.
    /// Set <c>imageUrl</c> to <c>null</c> to clear. To upload and update in one request, use
    /// <c>PUT /api/Products/{id}/with-image</c> instead.
    ///
    /// Note: the old Cloudinary asset is not automatically deleted when <c>imageUrl</c> changes.
    /// Clean it up manually via <c>DELETE /api/Media/{publicId}</c> to avoid storage waste.
    /// </remarks>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateProductRequest request,
        CancellationToken cancellationToken)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _productService.UpdateAsync(id, request, cancellationToken);
        return OkResponse(result, "Product updated successfully.");
    }

    /// <summary>Delete a product by ID. Requires Manager role.</summary>
    /// <remarks>
    /// Note: the associated Cloudinary image asset is not automatically deleted.
    /// Clean it up via <c>DELETE /api/Media/{publicId}</c> if needed.
    /// </remarks>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _productService.DeleteAsync(id, cancellationToken);
        return OkResponse("Product deleted successfully.");
    }

    [HttpGet("{productId:guid}/options")]
    [AllowAnonymous]
    public async Task<IActionResult> GetOptions(Guid productId, CancellationToken cancellationToken)
    {
        var activeOnly = !User.IsInRole(Roles.Manager);
        var result = await _productOptionService.GetByProductIdAsync(productId, activeOnly, cancellationToken);
        return OkResponse(result);
    }

    [HttpPost("{productId:guid}/options")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> CreateOption(
        Guid productId,
        [FromBody] CreateProductOptionRequest request,
        CancellationToken cancellationToken)
    {
        await _createOptionValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _productOptionService.CreateAsync(productId, request, cancellationToken);
        return OkResponse(result, "Product option created successfully.");
    }

    // ── Multipart / with-image endpoints ─────────────────────────────────────

    /// <summary>
    /// Create a new product and upload its image in one request. Requires Manager role.
    /// </summary>
    /// <remarks>
    /// Send as <c>multipart/form-data</c>. If <c>image</c> is provided it is uploaded to Cloudinary
    /// (folder: <c>products</c>) and the returned <c>secureUrl</c> is stored as <c>imageUrl</c>.
    ///
    /// Accepted image types: JPEG, PNG, WebP, AVIF. Maximum size: 10 MB.
    /// </remarks>
    [HttpPost("with-image")]
    [Authorize(Roles = Roles.Manager)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_485_760)]
    [RequestFormLimits(MultipartBodyLengthLimit = 10_485_760)]
    public async Task<IActionResult> CreateWithImage(
        [FromForm] CreateProductWithImageRequest request,
        CancellationToken cancellationToken)
    {
        var jsonRequest = new CreateProductRequest
        {
            CategoryId = request.CategoryId,
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description,
            BasePrice = request.BasePrice,
            MinQuantity = request.MinQuantity,
            IsCustomizable = request.IsCustomizable,
            EstimatedProductionDays = request.EstimatedProductionDays,
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
                "products", cancellationToken);

            jsonRequest.ImageUrl = uploaded.SecureUrl;
        }

        var result = await _productService.CreateAsync(jsonRequest, cancellationToken);
        return OkResponse(result, "Product created successfully.");
    }

    /// <summary>
    /// Update an existing product and optionally replace its image. Requires Manager role.
    /// </summary>
    /// <remarks>
    /// Send as <c>multipart/form-data</c>. If <c>image</c> is provided it is uploaded to Cloudinary
    /// (folder: <c>products</c>) and the returned <c>secureUrl</c> replaces <c>imageUrl</c>.
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
        [FromForm] UpdateProductWithImageRequest request,
        CancellationToken cancellationToken)
    {
        var jsonRequest = new UpdateProductRequest
        {
            CategoryId = request.CategoryId,
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description,
            BasePrice = request.BasePrice,
            MinQuantity = request.MinQuantity,
            IsCustomizable = request.IsCustomizable,
            EstimatedProductionDays = request.EstimatedProductionDays,
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
                "products", cancellationToken);

            jsonRequest.ImageUrl = uploaded.SecureUrl;
        }
        else
        {
            // No new image supplied — preserve the existing imageUrl.
            var existing = await _productService.GetByIdAsync(id, false, cancellationToken);
            jsonRequest.ImageUrl = existing.ImageUrl;
        }

        var result = await _productService.UpdateAsync(id, jsonRequest, cancellationToken);
        return OkResponse(result, "Product updated successfully.");
    }
}
