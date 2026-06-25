using Vifan.PrintTech.Application.Common;

namespace Vifan.PrintTech.Application.DTOs.QuoteRequests;

public class QuoteRequestQueryParameters : PaginationQuery
{
    /// <summary>Filter by status. Accepted values: New, Contacted, Quoted, Closed, Cancelled.</summary>
    public string? Status { get; set; }

    /// <summary>Keyword search across fullName, phone, email, and companyName.</summary>
    public string? Search { get; set; }
}
