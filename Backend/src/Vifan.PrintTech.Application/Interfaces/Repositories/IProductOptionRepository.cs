using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Application.Interfaces.Repositories;

public interface IProductOptionRepository : IRepository<ProductOption>
{
    Task<IReadOnlyList<ProductOption>> GetByProductIdAsync(
        Guid productId,
        bool activeOnly,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProductOption>> GetByIdsForProductAsync(
        Guid productId,
        IEnumerable<Guid> optionIds,
        bool activeOnly,
        CancellationToken cancellationToken = default);
}
