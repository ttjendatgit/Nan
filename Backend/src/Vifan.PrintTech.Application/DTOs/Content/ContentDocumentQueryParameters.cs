using Vifan.PrintTech.Application.Common;

namespace Vifan.PrintTech.Application.DTOs.Content;

public class ContentDocumentQueryParameters : PaginationQuery
{
    /// <summary>Filter by Type. Accepted values: ProductContent, Page, BlogPost. Omit for every type.</summary>
    public string? Type { get; set; }
}
