using FluentValidation;
using Vifan.PrintTech.Application.DTOs.QuoteRequests;

namespace Vifan.PrintTech.Application.Validators.QuoteRequests;

public class SetFinalQuotedPriceRequestValidator : AbstractValidator<SetFinalQuotedPriceRequest>
{
    public SetFinalQuotedPriceRequestValidator()
    {
        RuleFor(x => x.FinalQuotedPrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.InternalNote).MaximumLength(2000);
    }
}
