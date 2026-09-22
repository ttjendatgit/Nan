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
    }
}
