using Vifan.PrintTech.Domain.Common;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Domain.Entities;

public class QuoteRequest : BaseEntity
{
    /// <summary>Optional reference to the product this quote is about. Nullable for general inquiries.</summary>
    public Guid? ProductId { get; set; }

    /// <summary>Snapshot of the product name at submission time, preserved even if the product is later edited.</summary>
    public string? ProductNameSnapshot { get; set; }

    /// <summary>Snapshot of the category name at submission time.</summary>
    public string? CategoryNameSnapshot { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? CompanyName { get; set; }
    public int Quantity { get; set; }
    public DateTime? NeededDate { get; set; }
    public string? UseCase { get; set; }
    public string? Message { get; set; }
    public QuoteRequestStatus Status { get; set; } = QuoteRequestStatus.New;
}
