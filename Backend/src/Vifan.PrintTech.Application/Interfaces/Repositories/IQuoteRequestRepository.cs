using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Application.Interfaces.Repositories;

public interface IQuoteRequestRepository : IRepository<QuoteRequest>
{
    Task<PagedResult<QuoteRequest>> GetPagedAsync(
        string? status,
        string? search,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
}
