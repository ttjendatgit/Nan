using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Content;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Application.Validators.Content;

public class CreateContentDocumentRequestValidator : AbstractValidator<CreateContentDocumentRequest>
{
    public CreateContentDocumentRequestValidator()
    {
        RuleFor(x => x.Type)
            .NotEmpty()
            .Must(t => Enum.TryParse<ContentDocumentType>(t, ignoreCase: true, out _))
            .WithMessage($"Type must be one of: {string.Join(", ", Enum.GetNames<ContentDocumentType>())}.");

        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).MaximumLength(200);

        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(s => Enum.TryParse<ContentStatus>(s, ignoreCase: true, out _))
            .WithMessage($"Status must be one of: {string.Join(", ", Enum.GetNames<ContentStatus>())}.");

        // Structural half of the ProductId <-> Type invariant (string comparison only -- Type
        // hasn't been parsed yet at this point). Existence of the referenced Product, which
        // needs a DB lookup, is checked in ContentDocumentService instead.
        RuleFor(x => x.ProductId)
            .NotEmpty()
            .WithMessage("ProductId is required when Type is ProductContent.")
            .When(x => string.Equals(x.Type, nameof(ContentDocumentType.ProductContent), StringComparison.OrdinalIgnoreCase));

        RuleFor(x => x.ProductId)
            .Empty()
            .WithMessage("ProductId must be empty unless Type is ProductContent.")
            .When(x => !string.Equals(x.Type, nameof(ContentDocumentType.ProductContent), StringComparison.OrdinalIgnoreCase));
    }
}
