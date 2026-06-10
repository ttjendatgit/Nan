using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Catalog;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Helpers;

namespace Vifan.PrintTech.Infrastructure.Services;

public class ProductCategoryService : IProductCategoryService
{
    private readonly IProductCategoryRepository _categoryRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ProductCategoryService(
        IProductCategoryRepository categoryRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork)
    {
        _categoryRepository = categoryRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<ProductCategoryDto>> GetAllAsync(
        bool activeOnly,
        PaginationQuery query,
        CancellationToken cancellationToken = default)
    {
        var result = await _categoryRepository.GetPagedAsync(
            activeOnly,
            query.PageNumber,
            query.PageSize,
            cancellationToken);

        return MapPaged(result);
    }

    public async Task<ProductCategoryDto> GetByIdAsync(
        Guid id,
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken);
        if (category is null || (activeOnly && !category.IsActive))
            throw new NotFoundException("Category not found.");

        return MapToDto(category);
    }

    public async Task<ProductCategoryDto> CreateAsync(
        CreateProductCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var slug = await ResolveUniqueSlugAsync(
            string.IsNullOrWhiteSpace(request.Slug) ? SlugHelper.Generate(request.Name) : request.Slug!,
            null,
            cancellationToken);

        var category = new ProductCategory
        {
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description,
            ImageUrl = request.ImageUrl,
            IsActive = request.IsActive
        };

        await _categoryRepository.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(category);
    }

    public async Task<ProductCategoryDto> UpdateAsync(
        Guid id,
        UpdateProductCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Category not found.");

        var slug = await ResolveUniqueSlugAsync(
            string.IsNullOrWhiteSpace(request.Slug) ? SlugHelper.Generate(request.Name) : request.Slug!,
            id,
            cancellationToken);

        category.Name = request.Name.Trim();
        category.Slug = slug;
        category.Description = request.Description;
        category.ImageUrl = request.ImageUrl;
        category.IsActive = request.IsActive;

        _categoryRepository.Update(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(category);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Category not found.");

        var productCount = await _productRepository.CountByCategoryIdAsync(id, cancellationToken);
        if (productCount > 0)
            throw new BusinessRuleException("Cannot delete category that has products. Deactivate it instead.");

        _categoryRepository.Remove(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<string> ResolveUniqueSlugAsync(
        string baseSlug,
        Guid? excludeId,
        CancellationToken cancellationToken)
    {
        var slug = SlugHelper.Generate(baseSlug);
        var candidate = slug;
        var suffix = 1;

        while (await _categoryRepository.SlugExistsAsync(candidate, excludeId, cancellationToken))
        {
            candidate = $"{slug}-{suffix++}";
        }

        return candidate;
    }

    private static PagedResult<ProductCategoryDto> MapPaged(PagedResult<ProductCategory> source) =>
        new()
        {
            Items = source.Items.Select(MapToDto).ToList(),
            PageNumber = source.PageNumber,
            PageSize = source.PageSize,
            TotalCount = source.TotalCount
        };

    private static ProductCategoryDto MapToDto(ProductCategory category) =>
        new()
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
}
