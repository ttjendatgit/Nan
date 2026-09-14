using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Options;

namespace Vifan.PrintTech.Application.Validators.Options;

public class CreateProductOptionRequestValidator : AbstractValidator<CreateProductOptionRequest>
{
    public CreateProductOptionRequestValidator()
    {
        RuleFor(x => x.OptionDefinitionId).NotEmpty();
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0).When(x => x.SortOrder.HasValue);
    }
}
