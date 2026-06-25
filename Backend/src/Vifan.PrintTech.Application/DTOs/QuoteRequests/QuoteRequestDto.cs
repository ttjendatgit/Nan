namespace Vifan.PrintTech.Application.DTOs.QuoteRequests;

/// <summary>Read model returned by quote request endpoints.</summary>
public class QuoteRequestDto
{
    public Guid Id { get; set; }

    /// <summary>ID of the product this inquiry is about. Null for general inquiries.</summary>
    public Guid? ProductId { get; set; }

    /// <summary>Product name captured at submission time. Preserved even if the product is later renamed or deleted.</summary>
    public string? ProductNameSnapshot { get; set; }

    /// <summary>Category name captured at submission time.</summary>
    public string? CategoryNameSnapshot { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? CompanyName { get; set; }
    public int Quantity { get; set; }
    public DateTime? NeededDate { get; set; }
    public string? UseCase { get; set; }
    public string? Message { get; set; }

    /// <summary>Current status. One of: New, Contacted, Quoted, Closed, Cancelled.</summary>
    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
