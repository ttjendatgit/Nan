using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Infrastructure.Repositories;

public class CartItemRepository : Repository<CartItem>, ICartItemRepository
{
    public CartItemRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<CartItem?> GetByIdWithCartAsync(Guid id, CancellationToken cancellationToken = default) =>
        await DbSet
            .Include(i => i.Cart)
            .Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

    public async Task<IReadOnlyList<CartItem>> GetByCartIdAsync(
        Guid cartId,
        CancellationToken cancellationToken = default) =>
        await DbSet
            .Include(i => i.Product)
            .Where(i => i.CartId == cartId)
            .ToListAsync(cancellationToken);
}
