using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Cart;

namespace Vifan.PrintTech.Application.Validators.Cart;

public class AddCartItemRequestValidator : AbstractValidator<AddCartItemRequest>
{
    public AddCartItemRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.UploadedFileUrl).MaximumLength(500);
    }
}
