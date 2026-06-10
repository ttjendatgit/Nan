using System.Text.Json;

namespace Vifan.PrintTech.Application.Common;

public static class SelectedOptionsJsonHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static string Serialize(IEnumerable<Guid> optionIds) =>
        JsonSerializer.Serialize(optionIds.Distinct().ToList(), JsonOptions);

    public static IReadOnlyList<Guid> Deserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            var ids = JsonSerializer.Deserialize<List<Guid>>(json, JsonOptions);
            return ids ?? [];
        }
        catch
        {
            return [];
        }
    }
}
