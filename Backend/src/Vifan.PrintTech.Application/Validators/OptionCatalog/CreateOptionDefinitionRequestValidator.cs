using FluentValidation;
using Vifan.PrintTech.Application.DTOs.OptionCatalog;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Domain.Helpers;

namespace Vifan.PrintTech.Application.Validators.OptionCatalog;

public class CreateOptionDefinitionRequestValidator : AbstractValidator<CreateOptionDefinitionRequest>
{
    public CreateOptionDefinitionRequestValidator()
    {
        RuleFor(x => x.OptionType)
            .NotEmpty()
            .Must(t => OptionTypeHelper.TryParse(t, out _))
            .WithMessage($"OptionType must be one of: {string.Join(", ", OptionTypeHelper.GetAllNames())}.");

        RuleFor(x => x.OptionName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.OptionValue).NotEmpty().MaximumLength(200);

        RuleFor(x => x.PriceAdjustmentType)
            .Must(t => string.IsNullOrWhiteSpace(t) || Enum.TryParse<PriceAdjustmentType>(t, ignoreCase: true, out _))
            .WithMessage($"PriceAdjustmentType must be one of: {string.Join(", ", Enum.GetNames<PriceAdjustmentType>())}.");

        RuleFor(x => x.AdditionalPrice).GreaterThanOrEqualTo(0);
    }
}
