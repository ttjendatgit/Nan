using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Users;

namespace Vifan.PrintTech.Application.Validators.Users;

public class CreateStaffRequestValidator : AbstractValidator<CreateStaffRequest>
{
    public CreateStaffRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(100);
        RuleFor(x => x.FullName).MaximumLength(200);
    }
}
