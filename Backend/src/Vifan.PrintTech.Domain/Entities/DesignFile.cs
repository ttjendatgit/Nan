using Vifan.PrintTech.Domain.Common;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Domain.Entities;

public class DesignFile : BaseEntity
{
    public Guid CustomerId { get; set; }
    public ApplicationUser Customer { get; set; } = null!;
    public Guid? OrderItemId { get; set; }
    public Guid? QuoteRequestId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public ReviewStatus ReviewStatus { get; set; } = ReviewStatus.Pending;
    public Guid? StaffId { get; set; }
    public ApplicationUser? Staff { get; set; }
    public string? ReviewNote { get; set; }
    public DateTime UploadedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
