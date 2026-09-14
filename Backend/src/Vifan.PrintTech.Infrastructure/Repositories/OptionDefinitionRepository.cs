using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Infrastructure.Repositories;

public class OptionDefinitionRepository : Repository<OptionDefinition>, IOptionDefinitionRepository
{
    public OptionDefinitionRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<OptionDefinition>> GetAllAsync(
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        var query = DbSet.AsNoTracking().AsQueryable();

        if (activeOnly)
            query = query.Where(x => x.IsActive);

        return await query
            .OrderBy(x => x.OptionType)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.OptionName)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountProductAssignmentsAsync(
        Guid optionDefinitionId,
        CancellationToken cancellationToken = default) =>
        await Context.Set<ProductOption>().CountAsync(x => x.OptionDefinitionId == optionDefinitionId, cancellationToken);

    public async Task<bool> IsReferencedByQuoteHistoryAsync(
        Guid optionDefinitionId,
        CancellationToken cancellationToken = default) =>
        await Context.Set<QuoteRequestOption>().AnyAsync(x => x.OptionDefinitionId == optionDefinitionId, cancellationToken);
}
