using FluentValidation;
using Vifan.PrintTech.Application.DTOs.Auth;

namespace Vifan.PrintTech.Application.Validators.Auth;

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}
