using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Vifan.PrintTech.Domain.Helpers;

public static partial class SlugHelper
{
    public static string Generate(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Guid.NewGuid().ToString("N")[..12];

        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var c in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(c);
            if (category != UnicodeCategory.NonSpacingMark)
                builder.Append(c);
        }

        var slug = WhitespaceRegex().Replace(
            builder.ToString().Normalize(NormalizationForm.FormC),
            "-");
        slug = InvalidSlugCharsRegex().Replace(slug, "-");
        slug = MultipleHyphensRegex().Replace(slug, "-").Trim('-');

        return string.IsNullOrEmpty(slug) ? Guid.NewGuid().ToString("N")[..12] : slug;
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();

    [GeneratedRegex(@"[^a-z0-9-]")]
    private static partial Regex InvalidSlugCharsRegex();

    [GeneratedRegex(@"-{2,}")]
    private static partial Regex MultipleHyphensRegex();
}
