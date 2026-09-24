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

    /// <summary>Public read: the Published document of this Type with this Slug. Throws
    /// NotFoundException when it doesn't exist, has another Type, or is Draft/Archived.</summary>
    Task<PublishedContentDocumentDto> GetPublishedAsync(
        string type,
        string slug,
        CancellationToken cancellationToken = default);

    /// <summary>Public read: Slug + UpdatedAt of every Published document of this Type.</summary>
    Task<IReadOnlyList<PublishedContentDocumentSummaryDto>> GetPublishedSummariesAsync(
        string type,
        CancellationToken cancellationToken = default);
}
