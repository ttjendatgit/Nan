using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.DTOs.Catalog;
using Vifan.PrintTech.Application.DTOs.Options;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

public class ProductsController : BaseApiController
{
    private readonly IProductService _productService;
    private readonly IProductOptionService _productOptionService;
    private readonly IValidator<CreateProductRequest> _createValidator;
    private readonly IValidator<UpdateProductRequest> _updateValidator;
    private readonly IValidator<CreateProductOptionRequest> _createOptionValidator;

    public ProductsController(
        IProductService productService,
        IProductOptionService productOptionService,
        IValidator<CreateProductRequest> createValidator,
        IValidator<UpdateProductRequest> updateValidator,
        IValidator<CreateProductOptionRequest> createOptionValidator)
    {
        _productService = productService;
        _productOptionService = productOptionService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _createOptionValidator = createOptionValidator;
    }

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

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var activeOnly = !User.IsInRole(Roles.Manager);
        var result = await _productService.GetByIdAsync(id, activeOnly, cancellationToken);
        return OkResponse(result);
    }

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
}
