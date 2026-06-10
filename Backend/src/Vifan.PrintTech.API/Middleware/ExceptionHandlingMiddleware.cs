using System.Net;
using System.Text.Json;
using Vifan.PrintTech.Application.Common;
using AppValidationException = Vifan.PrintTech.Application.Exceptions.ValidationException;
using AppException = Vifan.PrintTech.Application.Exceptions.AppException;
using FluentValidationException = FluentValidation.ValidationException;

namespace Vifan.PrintTech.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, response) = exception switch
        {
            AppValidationException validationEx => (
                (int)HttpStatusCode.BadRequest,
                ApiResponse<object?>.Fail(validationEx.Message, validationEx.Errors)),

            FluentValidationException fluentEx => (
                (int)HttpStatusCode.BadRequest,
                ApiResponse<object?>.Fail(
                    "Validation failed.",
                    fluentEx.Errors.Select(e => e.ErrorMessage))),

            AppException appEx => (
                appEx.StatusCode,
                ApiResponse<object?>.Fail(appEx.Message)),

            KeyNotFoundException => (
                (int)HttpStatusCode.NotFound,
                ApiResponse<object?>.Fail("Resource not found.")),

            UnauthorizedAccessException => (
                (int)HttpStatusCode.Unauthorized,
                ApiResponse<object?>.Fail("Unauthorized.")),

            _ => (
                (int)HttpStatusCode.InternalServerError,
                ApiResponse<object?>.Fail("An unexpected error occurred."))
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}
