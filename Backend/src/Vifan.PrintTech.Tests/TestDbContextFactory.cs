using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Tests;

/// <summary>Builds an isolated in-memory ApplicationDbContext for a single test.</summary>
public static class TestDbContextFactory
{
    public static ApplicationDbContext Create() => CreateNamed(Guid.NewGuid().ToString());

    /// <summary>Builds a context against a specific named in-memory database -- pass the same
    /// name to two calls to get two independent DbContext instances (separate change trackers,
    /// like two web requests) sharing the same underlying data, for concurrency-oriented tests.</summary>
    public static ApplicationDbContext CreateNamed(string name)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(name)
            .Options;

        return new ApplicationDbContext(options);
    }
}
