using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.API.Extensions;
using Vifan.PrintTech.API.Middleware;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Infrastructure.Data;
using Vifan.PrintTech.Infrastructure.Identity;
using Vifan.PrintTech.Infrastructure.Settings;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
    options.Limits.MaxRequestBodySize = 52_428_800);

builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

await SeedDatabaseAsync(app);

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Vifan PrintTech API v1");
        options.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("DefaultCorsPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

static async Task SeedDatabaseAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;

    var context = services.GetRequiredService<ApplicationDbContext>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var seedOptions = services.GetRequiredService<Microsoft.Extensions.Options.IOptions<SeedSettings>>();

    await context.Database.MigrateAsync();
    await RoleSeeder.SeedRolesAsync(roleManager);
    await UserSeeder.SeedManagerAsync(userManager, seedOptions);
}
