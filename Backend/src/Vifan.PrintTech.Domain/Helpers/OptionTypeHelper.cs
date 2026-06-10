using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Domain.Helpers;

public static class OptionTypeHelper
{
    public static bool TryParse(string? value, out OptionType optionType)
    {
        optionType = default;
        if (string.IsNullOrWhiteSpace(value))
            return false;

        return Enum.TryParse<OptionType>(value, ignoreCase: true, out optionType);
    }

    public static IReadOnlyList<string> GetAllNames() =>
        Enum.GetNames<OptionType>();
}
