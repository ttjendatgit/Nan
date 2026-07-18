namespace Vifan.PrintTech.Infrastructure.Settings;

public class SeedSettings
{
    public const string SectionName = "Seed";

    public ManagerSeedSettings Manager { get; set; } = new();
}

public class ManagerSeedSettings
{
    public string Email { get; set; } = "manager@vifan.com";
    public string Password { get; set; } = "CHANGE_ME_IN_CONFIGURATION";
    public string FullName { get; set; } = "System Manager";
}
