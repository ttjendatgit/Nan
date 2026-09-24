namespace Vifan.PrintTech.Domain.Constants;

/// <summary>
/// Slugs a Page ContentDocument may not use, because Pages are meant to be served from the site
/// root (/{slug}) and these names are already taken by system routes. Compared against the slug
/// *after* SlugHelper.Generate has normalized it (lowercased, diacritics stripped), and
/// case-insensitively on top of that.
///
/// Note: SlugHelper strips "_", so a stored slug can never literally be "_next" -- it is listed
/// for completeness/documentation of the reserved route, not because it can match.
/// </summary>
public static class ReservedSlugs
{
    public static readonly IReadOnlySet<string> Page = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "admin",
        "auth",
        "products",
        "api",
        "dev",
        "_next"
    };
}
