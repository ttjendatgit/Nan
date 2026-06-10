using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Application.Interfaces.Repositories;

public interface IProductCategoryRepository : IRepository<ProductCategory>
{
    Task<PagedResult<ProductCategory>> GetPagedAsync(
        bool activeOnly,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
