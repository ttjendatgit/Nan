using FluentValidation;
using Vifan.PrintTech.Application.DTOs.QuoteRequests;

namespace Vifan.PrintTech.Application.Validators.QuoteRequests;

public class CreateQuoteRequestRequestValidator : AbstractValidator<CreateQuoteRequestRequest>
{
    public CreateQuoteRequestRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Phone)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(x => x.Email)
            .EmailAddress()
            .WithMessage("'Email' must be a valid email address.")
            .MaximumLength(200)
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.CompanyName)
            .MaximumLength(200);

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage("'Quantity' must be greater than 0.");

        RuleFor(x => x.UseCase)
            .MaximumLength(500);

        RuleFor(x => x.Message)
            .MaximumLength(2000);
    }
}
