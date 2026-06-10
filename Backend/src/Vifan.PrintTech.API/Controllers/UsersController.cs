using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.DTOs.Users;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;

namespace Vifan.PrintTech.API.Controllers;

[Authorize(Roles = Roles.Manager)]
[Route("api/[controller]")]
public class UsersController : BaseApiController
{
    private readonly IUserService _userService;
    private readonly IValidator<CreateStaffRequest> _createStaffValidator;

    public UsersController(
        IUserService userService,
        IValidator<CreateStaffRequest> createStaffValidator)
    {
        _userService = userService;
        _createStaffValidator = createStaffValidator;
    }

    [HttpPost("staff")]
    public async Task<IActionResult> CreateStaff(
        [FromBody] CreateStaffRequest request,
        CancellationToken cancellationToken)
    {
        await _createStaffValidator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _userService.CreateStaffAsync(request, cancellationToken);
        return OkResponse(result, "Staff account created successfully.");
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] UserQueryParameters query,
        CancellationToken cancellationToken)
    {
        var result = await _userService.GetUsersAsync(query, cancellationToken);
        return OkResponse(result);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateUserStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _userService.UpdateUserStatusAsync(id, request, cancellationToken);
        return OkResponse(result, "User status updated successfully.");
    }
}
