using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Content;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IContentDocumentService
{
    Task<PagedResult<ContentDocumentDto>> GetAllAsync(
        ContentDocumentQueryParameters query,
        CancellationToken cancellationToken = default);

    Task<ContentDocumentDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ContentDocumentDto> CreateAsync(
        CreateContentDocumentRequest request,
        CancellationToken cancellationToken = default);

    Task<ContentDocumentDto> UpdateAsync(
        Guid id,
        UpdateContentDocumentRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
