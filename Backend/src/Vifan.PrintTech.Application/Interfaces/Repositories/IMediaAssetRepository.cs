using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Application.Interfaces.Repositories;

public interface IMediaAssetRepository : IRepository<MediaAsset>
{
    /// <summary>Most-recently-uploaded first -- the natural default for browsing a media library,
    /// unlike the alphabetical ordering used for named catalogs elsewhere in this app.</summary>
    Task<PagedResult<MediaAsset>> GetPagedAsync(
        string? search,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
}
