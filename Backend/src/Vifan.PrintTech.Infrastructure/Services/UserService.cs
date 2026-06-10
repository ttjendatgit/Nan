using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Users;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UserService(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _userManager = userManager;
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<UserListItemDto> CreateStaffAsync(
        CreateStaffRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.IsInRole(Roles.Manager))
            throw new ForbiddenException("Only Manager can create Staff accounts.");

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
            throw new BusinessRuleException("Email is already registered.");

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = true,
            IsActive = true
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            throw new ValidationException(createResult.Errors.Select(e => e.Description));

        var roleResult = await _userManager.AddToRoleAsync(user, Roles.Staff);
        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            throw new ValidationException(roleResult.Errors.Select(e => e.Description));
        }

        return await MapToListItemAsync(user);
    }

    public async Task<PagedResult<UserListItemDto>> GetUsersAsync(
        UserQueryParameters query,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.IsInRole(Roles.Manager))
            throw new ForbiddenException("Only Manager can view all users.");

        var usersQuery = _context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
            usersQuery = usersQuery.Where(u =>
                (u.Email != null && u.Email.Contains(query.Search)) ||
                (u.FullName != null && u.FullName.Contains(query.Search)));

        if (query.IsActive.HasValue)
            usersQuery = usersQuery.Where(u => u.IsActive == query.IsActive.Value);

        if (!string.IsNullOrWhiteSpace(query.Role))
        {
            var roleUserIds = await (
                from ur in _context.UserRoles
                join r in _context.Roles on ur.RoleId equals r.Id
                where r.Name == query.Role
                select ur.UserId).ToListAsync(cancellationToken);

            usersQuery = usersQuery.Where(u => roleUserIds.Contains(u.Id));
        }

        var totalCount = await usersQuery.CountAsync(cancellationToken);
        var users = await usersQuery
            .OrderByDescending(u => u.CreatedAt)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        var items = new List<UserListItemDto>();
        foreach (var user in users)
            items.Add(await MapToListItemAsync(user));

        return new PagedResult<UserListItemDto>
        {
            Items = items,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
    }

    public async Task<UserListItemDto> UpdateUserStatusAsync(
        Guid id,
        UpdateUserStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.IsInRole(Roles.Manager))
            throw new ForbiddenException("Only Manager can update user status.");

        if (_currentUserService.UserId == id && !request.IsActive)
            throw new BusinessRuleException("You cannot deactivate your own account.");

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null)
            throw new NotFoundException("User not found.");

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains(Roles.Manager) && !request.IsActive)
        {
            var activeManagers = await CountActiveManagersAsync(id, cancellationToken);
            if (activeManagers == 0)
                throw new BusinessRuleException("Cannot deactivate the last active Manager account.");
        }

        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            throw new ValidationException(result.Errors.Select(e => e.Description));

        return await MapToListItemAsync(user);
    }

    private async Task<int> CountActiveManagersAsync(Guid excludeUserId, CancellationToken cancellationToken)
    {
        var managerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == Roles.Manager, cancellationToken);
        if (managerRole is null)
            return 0;

        return await (
            from ur in _context.UserRoles
            join u in _context.Users on ur.UserId equals u.Id
            where ur.RoleId == managerRole.Id && u.IsActive && u.Id != excludeUserId
            select u.Id).CountAsync(cancellationToken);
    }

    private async Task<UserListItemDto> MapToListItemAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new UserListItemDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            IsActive = user.IsActive,
            Roles = roles.ToList(),
            CreatedAt = user.CreatedAt
        };
    }
}
