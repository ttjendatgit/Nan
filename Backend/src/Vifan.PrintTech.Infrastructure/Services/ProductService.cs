using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Catalog;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Helpers;

namespace Vifan.PrintTech.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    private readonly IProductCategoryRepository _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ProductService(
        IProductRepository productRepository,
        IProductCategoryRepository categoryRepository,
        IUnitOfWork unitOfWork)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<ProductDto>> GetAllAsync(
        ProductQueryParameters query,
        CancellationToken cancellationToken = default)
    {
        var result = await _productRepository.GetPagedAsync(
            query.ActiveOnly,
            query.Search,
            query.CategoryId,
            query.PageNumber,
            query.PageSize,
            cancellationToken);

        return MapPaged(result);
    }

    public async Task<ProductDto> GetByIdAsync(
        Guid id,
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetByIdAsync(id, cancellationToken);
        if (product is null || (activeOnly && !product.IsActive))
            throw new NotFoundException("Product not found.");

        return MapToDto(product);
    }

    public async Task<PagedResult<ProductDto>> GetByCategoryAsync(
        Guid categoryId,
        ProductQueryParameters query,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(categoryId, cancellationToken);
        if (category is null || (query.ActiveOnly && !category.IsActive))
            throw new NotFoundException("Category not found.");

        query.CategoryId = categoryId;
        return await GetAllAsync(query, cancellationToken);
    }

    public async Task<ProductDto> CreateAsync(
        CreateProductRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);

        var slug = await ResolveUniqueSlugAsync(
            string.IsNullOrWhiteSpace(request.Slug) ? SlugHelper.Generate(request.Name) : request.Slug!,
            null,
            cancellationToken);

        var product = new Product
        {
            CategoryId = request.CategoryId,
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description,
            BasePrice = request.BasePrice,
            MinQuantity = request.MinQuantity,
            ImageUrl = request.ImageUrl,
            IsCustomizable = request.IsCustomizable,
            EstimatedProductionDays = request.EstimatedProductionDays,
            IsActive = request.IsActive
        };

        await _productRepository.AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _productRepository.GetByIdAsync(product.Id, cancellationToken);
        return MapToDto(created!);
    }

    public async Task<ProductDto> UpdateAsync(
        Guid id,
        UpdateProductRequest request,
        CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Product not found.");

        await EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);

        var slug = await ResolveUniqueSlugAsync(
            string.IsNullOrWhiteSpace(request.Slug) ? SlugHelper.Generate(request.Name) : request.Slug!,
            id,
            cancellationToken);

        product.CategoryId = request.CategoryId;
        product.Name = request.Name.Trim();
        product.Slug = slug;
        product.Description = request.Description;
        product.BasePrice = request.BasePrice;
        product.MinQuantity = request.MinQuantity;
        product.ImageUrl = request.ImageUrl;
        product.IsCustomizable = request.IsCustomizable;
        product.EstimatedProductionDays = request.EstimatedProductionDays;
        product.IsActive = request.IsActive;

        _productRepository.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _productRepository.GetByIdAsync(id, cancellationToken);
        return MapToDto(updated!);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Product not found.");

        _productRepository.Remove(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureCategoryExistsAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(categoryId, cancellationToken);
        if (category is null)
            throw new NotFoundException("Category not found.");
    }

    private async Task<string> ResolveUniqueSlugAsync(
        string baseSlug,
        Guid? excludeId,
        CancellationToken cancellationToken)
    {
        var slug = SlugHelper.Generate(baseSlug);
        var candidate = slug;
        var suffix = 1;

        while (await _productRepository.SlugExistsAsync(candidate, excludeId, cancellationToken))
        {
            candidate = $"{slug}-{suffix++}";
        }

        return candidate;
    }

    private static PagedResult<ProductDto> MapPaged(PagedResult<Product> source) =>
        new()
        {
            Items = source.Items.Select(MapToDto).ToList(),
            PageNumber = source.PageNumber,
            PageSize = source.PageSize,
            TotalCount = source.TotalCount
        };

    private static ProductDto MapToDto(Product product) =>
        new()
        {
            Id = product.Id,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name ?? string.Empty,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            BasePrice = product.BasePrice,
            MinQuantity = product.MinQuantity,
            ImageUrl = product.ImageUrl,
            IsCustomizable = product.IsCustomizable,
            EstimatedProductionDays = product.EstimatedProductionDays,
            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };
}
