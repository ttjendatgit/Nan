using Vifan.PrintTech.Application.Common;

namespace Vifan.PrintTech.Application.DTOs.Catalog;

public class ProductQueryParameters : PaginationQuery
{
    public string? Search { get; set; }
    public Guid? CategoryId { get; set; }
    public bool ActiveOnly { get; set; } = true;
}
