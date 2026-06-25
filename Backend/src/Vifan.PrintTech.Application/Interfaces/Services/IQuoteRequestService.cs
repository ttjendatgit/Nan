using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.QuoteRequests;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IQuoteRequestService
{
    Task<QuoteRequestDto> CreateAsync(CreateQuoteRequestRequest request, CancellationToken ct = default);
    Task<PagedResult<QuoteRequestDto>> GetAllAsync(QuoteRequestQueryParameters query, CancellationToken ct = default);
    Task<QuoteRequestDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<QuoteRequestDto> UpdateStatusAsync(Guid id, UpdateQuoteRequestStatusRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
