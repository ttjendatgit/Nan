using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Catalog;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IProductCategoryService
{
    Task<PagedResult<ProductCategoryDto>> GetAllAsync(bool activeOnly, PaginationQuery query, CancellationToken cancellationToken = default);
    Task<ProductCategoryDto> GetByIdAsync(Guid id, bool activeOnly, CancellationToken cancellationToken = default);
    Task<ProductCategoryDto> CreateAsync(CreateProductCategoryRequest request, CancellationToken cancellationToken = default);
    Task<ProductCategoryDto> UpdateAsync(Guid id, UpdateProductCategoryRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
