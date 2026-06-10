using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Users;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IUserService
{
    Task<UserListItemDto> CreateStaffAsync(CreateStaffRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<UserListItemDto>> GetUsersAsync(UserQueryParameters query, CancellationToken cancellationToken = default);
    Task<UserListItemDto> UpdateUserStatusAsync(Guid id, UpdateUserStatusRequest request, CancellationToken cancellationToken = default);
}
