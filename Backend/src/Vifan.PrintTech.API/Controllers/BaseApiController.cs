using Microsoft.AspNetCore.Mvc;
using Vifan.PrintTech.Application.Common;

namespace Vifan.PrintTech.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected IActionResult OkResponse<T>(T data, string? message = null) =>
        Ok(ApiResponse<T>.Ok(data, message));

    protected IActionResult OkResponse(string? message = null) =>
        Ok(ApiResponse.Ok(message));

    protected IActionResult CreatedResponse<T>(string actionName, object routeValues, T data, string? message = null) =>
        CreatedAtAction(actionName, routeValues, ApiResponse<T>.Ok(data, message));

    protected IActionResult FailResponse(string message, int statusCode = 400) =>
        StatusCode(statusCode, ApiResponse.Fail(message));
}
