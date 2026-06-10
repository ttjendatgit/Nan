using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Application.Interfaces.Repositories;

public interface IProductRepository : IRepository<Product>
{
    Task<PagedResult<Product>> GetPagedAsync(
        bool activeOnly,
        string? search,
        Guid? categoryId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null, CancellationToken cancellationToken = default);

    Task<int> CountByCategoryIdAsync(Guid categoryId, CancellationToken cancellationToken = default);
}
