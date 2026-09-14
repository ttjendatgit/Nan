using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Options;

namespace Vifan.PrintTech.Application.Validators.Options;

public class UpdateProductOptionRequestValidator : AbstractValidator<UpdateProductOptionRequest>
{
    public UpdateProductOptionRequestValidator()
    {
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
