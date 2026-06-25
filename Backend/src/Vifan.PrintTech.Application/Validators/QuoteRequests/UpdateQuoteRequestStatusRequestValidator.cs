using FluentValidation;
using Vifan.PrintTech.Application.DTOs.QuoteRequests;

namespace Vifan.PrintTech.Application.Validators.QuoteRequests;

public class UpdateQuoteRequestStatusRequestValidator : AbstractValidator<UpdateQuoteRequestStatusRequest>
{
    private static readonly HashSet<string> ValidStatuses =
    [
        "New", "Contacted", "Quoted", "Closed", "Cancelled"
    ];

    public UpdateQuoteRequestStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage($"'Status' must be one of: {string.Join(", ", ValidStatuses)}.");
    }
}
