using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Infrastructure.Repositories;

public class ProductOptionRepository : Repository<ProductOption>, IProductOptionRepository
{
    public ProductOptionRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<ProductOption>> GetByProductIdAsync(
        Guid productId,
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        var query = DbSet
            .AsNoTracking()
            .Include(x => x.OptionDefinition)
            .Where(x => x.ProductId == productId);

        if (activeOnly)
            query = query.Where(x => x.IsActive && x.OptionDefinition.IsActive);

        return await query
            .OrderBy(x => x.OptionDefinition.OptionType)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.OptionDefinition.OptionName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProductOption>> GetByIdsForProductAsync(
        Guid productId,
        IEnumerable<Guid> assignmentIds,
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        var ids = assignmentIds.Distinct().ToList();
        if (ids.Count == 0)
            return [];

        var query = DbSet
            .Include(x => x.OptionDefinition)
            .Where(x => x.ProductId == productId && ids.Contains(x.Id));

        if (activeOnly)
            query = query.Where(x => x.IsActive && x.OptionDefinition.IsActive);

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<ProductOption?> GetByIdWithDefinitionAsync(Guid id, CancellationToken cancellationToken = default) =>
        await DbSet.Include(x => x.OptionDefinition).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<bool> ExistsAssignmentAsync(
        Guid productId,
        Guid optionDefinitionId,
        CancellationToken cancellationToken = default) =>
        await DbSet.AnyAsync(x => x.ProductId == productId && x.OptionDefinitionId == optionDefinitionId, cancellationToken);
}
