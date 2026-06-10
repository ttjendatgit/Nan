using Vifan.PrintTech.Application.DTOs.Auth;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
    Task<UserProfileResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default);
}
