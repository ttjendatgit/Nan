using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Catalog;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetAllAsync(ProductQueryParameters query, CancellationToken cancellationToken = default);
    Task<ProductDto> GetByIdAsync(Guid id, bool activeOnly, CancellationToken cancellationToken = default);
    Task<PagedResult<ProductDto>> GetByCategoryAsync(Guid categoryId, ProductQueryParameters query, CancellationToken cancellationToken = default);
    Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
