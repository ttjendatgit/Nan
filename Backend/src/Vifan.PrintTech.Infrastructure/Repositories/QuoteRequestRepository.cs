using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Infrastructure.Repositories;

public class QuoteRequestRepository : Repository<QuoteRequest>, IQuoteRequestRepository
{
    public QuoteRequestRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<QuoteRequest>> GetPagedAsync(
        string? status,
        string? search,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = DbSet.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<QuoteRequestStatus>(status, ignoreCase: true, out var parsedStatus))
        {
            query = query.Where(x => x.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x =>
                x.FullName.ToLower().Contains(term) ||
                x.Phone.Contains(term) ||
                (x.Email != null && x.Email.ToLower().Contains(term)) ||
                (x.CompanyName != null && x.CompanyName.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<QuoteRequest>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
