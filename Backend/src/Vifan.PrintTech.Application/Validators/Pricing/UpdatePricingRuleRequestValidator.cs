using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Pricing;

namespace Vifan.PrintTech.Application.Validators.Pricing;

public class UpdatePricingRuleRequestValidator : AbstractValidator<UpdatePricingRuleRequest>
{
    public UpdatePricingRuleRequestValidator()
    {
        RuleFor(x => x.MinQuantity).GreaterThan(0);
        RuleFor(x => x.MaxQuantity)
            .GreaterThanOrEqualTo(x => x.MinQuantity)
            .When(x => x.MaxQuantity.HasValue);
        RuleFor(x => x.BaseUnitPrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.AdditionalCost).GreaterThanOrEqualTo(0);
        RuleFor(x => x.DiscountPercent).InclusiveBetween(0, 100);
        RuleFor(x => x.Material).MaximumLength(200);
        RuleFor(x => x.Size).MaximumLength(200);
        RuleFor(x => x.PrintingSide).MaximumLength(200);
    }
}
