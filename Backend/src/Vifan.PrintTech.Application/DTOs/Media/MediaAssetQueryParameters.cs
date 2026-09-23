using Vifan.PrintTech.Application.Common;

namespace Vifan.PrintTech.Application.DTOs.Media;

public class MediaAssetQueryParameters : PaginationQuery
{
    /// <summary>Case-insensitive filename search (matches FileName or OriginalName).</summary>
    public string? Search { get; set; }
}
