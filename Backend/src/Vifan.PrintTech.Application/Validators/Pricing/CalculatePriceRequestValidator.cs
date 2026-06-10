using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Pricing;

namespace Vifan.PrintTech.Application.Validators.Pricing;

public class CalculatePriceRequestValidator : AbstractValidator<CalculatePriceRequest>
{
    public CalculatePriceRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}
