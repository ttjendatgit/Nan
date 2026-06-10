using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Application.Interfaces.Repositories;

public interface ICartItemRepository : IRepository<CartItem>
{
    Task<CartItem?> GetByIdWithCartAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CartItem>> GetByCartIdAsync(Guid cartId, CancellationToken cancellationToken = default);
}
