using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Catalog;

namespace Vifan.PrintTech.Application.Validators.Catalog;

public class UpdateProductCategoryRequestValidator : AbstractValidator<UpdateProductCategoryRequest>
{
    public UpdateProductCategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.ImageUrl).MaximumLength(500);
        RuleFor(x => x.ImageUrl)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("'Image Url' must be a valid absolute URL (use the secureUrl from POST /api/Media/upload).")
            .When(x => !string.IsNullOrEmpty(x.ImageUrl));
    }
}
