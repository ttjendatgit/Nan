using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Files;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Application.Validators.Files;

public class ReviewDesignFileRequestValidator : AbstractValidator<ReviewDesignFileRequest>
{
    private static readonly string[] AllowedStatuses =
        Enum.GetNames<ReviewStatus>().Except([ReviewStatus.Pending.ToString()]).ToArray();

    public ReviewDesignFileRequestValidator()
    {
        RuleFor(x => x.ReviewStatus)
            .NotEmpty()
            .Must(s => AllowedStatuses.Contains(s, StringComparer.OrdinalIgnoreCase))
            .WithMessage($"ReviewStatus must be one of: {string.Join(", ", AllowedStatuses)}.");

        RuleFor(x => x.ReviewNote).MaximumLength(2000);
    }
}
