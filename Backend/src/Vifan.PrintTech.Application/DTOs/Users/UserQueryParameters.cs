using Vifan.PrintTech.Application.Common;

namespace Vifan.PrintTech.Application.DTOs.Users;

public class UserQueryParameters : PaginationQuery
{
    public string? Search { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}
