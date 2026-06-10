namespace Vifan.PrintTech.Application.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; }

    public AppException(string message, int statusCode = 400)
        : base(message)
    {
        StatusCode = statusCode;
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message = "Resource not found.")
        : base(message, 404)
    {
    }
}

public class ValidationException : AppException
{
    public IEnumerable<string> Errors { get; }

    public ValidationException(IEnumerable<string> errors)
        : base("Validation failed.", 400)
    {
        Errors = errors;
    }

    public ValidationException(string error)
        : this([error])
    {
    }
}

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Unauthorized.")
        : base(message, 401)
    {
    }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Forbidden.")
        : base(message, 403)
    {
    }
}

public class BusinessRuleException : AppException
{
    public BusinessRuleException(string message)
        : base(message, 422)
    {
    }
}
