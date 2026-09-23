using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Content;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Application.Validators.Content;

public class UpdateContentDocumentRequestValidator : AbstractValidator<UpdateContentDocumentRequest>
{
    public UpdateContentDocumentRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).MaximumLength(200);

        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(s => Enum.TryParse<ContentStatus>(s, ignoreCase: true, out _))
            .WithMessage($"Status must be one of: {string.Join(", ", Enum.GetNames<ContentStatus>())}.");

        RuleFor(x => x.SeoTitle).MaximumLength(200);
        RuleFor(x => x.SeoDescription).MaximumLength(500);
        RuleFor(x => x.SeoKeywords).MaximumLength(500);

        RuleFor(x => x.SeoImageUrl).MaximumLength(500);
        RuleFor(x => x.SeoImageUrl)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("'Seo Image Url' must be a valid absolute URL.")
            .When(x => !string.IsNullOrEmpty(x.SeoImageUrl));

        RuleFor(x => x.CanonicalUrl).MaximumLength(500);
        RuleFor(x => x.CanonicalUrl)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("'Canonical Url' must be a valid absolute URL.")
            .When(x => !string.IsNullOrEmpty(x.CanonicalUrl));
    }
}
