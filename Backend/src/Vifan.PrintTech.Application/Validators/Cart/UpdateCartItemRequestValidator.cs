using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Cart;

namespace Vifan.PrintTech.Application.Validators.Cart;

public class UpdateCartItemRequestValidator : AbstractValidator<UpdateCartItemRequest>
{
    public UpdateCartItemRequestValidator()
    {
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.UploadedFileUrl).MaximumLength(500);
    }
}
