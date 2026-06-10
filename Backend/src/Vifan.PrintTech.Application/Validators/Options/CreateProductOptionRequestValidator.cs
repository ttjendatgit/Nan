using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Options;
using Vifan.PrintTech.Domain.Helpers;

namespace Vifan.PrintTech.Application.Validators.Options;

public class CreateProductOptionRequestValidator : AbstractValidator<CreateProductOptionRequest>
{
    public CreateProductOptionRequestValidator()
    {
        RuleFor(x => x.OptionType)
            .NotEmpty()
            .Must(t => OptionTypeHelper.TryParse(t, out _))
            .WithMessage($"OptionType must be one of: {string.Join(", ", OptionTypeHelper.GetAllNames())}.");

        RuleFor(x => x.OptionName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.OptionValue).NotEmpty().MaximumLength(200);
        RuleFor(x => x.AdditionalPrice).GreaterThanOrEqualTo(0);
    }
}
