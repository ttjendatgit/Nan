using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Tests;

/// <summary>Builds an isolated in-memory ApplicationDbContext for a single test.</summary>
public static class TestDbContextFactory
{
    public static ApplicationDbContext Create()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
