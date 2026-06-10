using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Catalog;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

public class CategoriesController : BaseApiController
{
    private readonly IProductCategoryService _categoryService;
    private readonly IValidator<CreateProductCategoryRequest> _createValidator;
    private readonly IValidator<UpdateProductCategoryRequest> _updateValidator;

    public CategoriesController(
        IProductCategoryService categoryService,
        IValidator<CreateProductCategoryRequest> createValidator,
        IValidator<UpdateProductCategoryRequest> updateValidator)
    {
        _categoryService = categoryService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

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

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var activeOnly = !User.IsInRole(Roles.Manager);
        var result = await _categoryService.GetByIdAsync(id, activeOnly, cancellationToken);
        return OkResponse(result);
    }

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

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _categoryService.DeleteAsync(id, cancellationToken);
        return OkResponse("Category deleted successfully.");
    }
}
