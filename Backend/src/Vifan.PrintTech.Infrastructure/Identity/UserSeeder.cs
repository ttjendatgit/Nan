using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Vifan.PrintTech.Domain.Constants;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Infrastructure.Settings;

namespace Vifan.PrintTech.Infrastructure.Identity;

public static class UserSeeder
{
    public static async Task SeedManagerAsync(
        UserManager<ApplicationUser> userManager,
        IOptions<SeedSettings> seedOptions)
    {
        var settings = seedOptions.Value.Manager;

        var existing = await userManager.FindByEmailAsync(settings.Email);
        if (existing is not null)
            return;

        var manager = new ApplicationUser
        {
            UserName = settings.Email,
            Email = settings.Email,
            FullName = settings.FullName,
            EmailConfirmed = true,
            IsActive = true
        };

        var result = await userManager.CreateAsync(manager, settings.Password);
        if (result.Succeeded)
            await userManager.AddToRoleAsync(manager, Roles.Manager);
    }
}
