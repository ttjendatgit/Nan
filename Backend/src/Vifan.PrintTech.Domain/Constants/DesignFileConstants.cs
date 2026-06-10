namespace Vifan.PrintTech.Domain.Constants;

public static class DesignFileConstants
{
    public const long MaxFileSizeBytes = 50 * 1024 * 1024;

    public static readonly IReadOnlySet<string> AllowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ".ai", ".pdf", ".psd", ".png", ".jpg", ".jpeg"
    };

    public static readonly IReadOnlySet<string> AllowedContentTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "application/postscript",
        "application/illustrator",
        "image/vnd.adobe.photoshop",
        "application/octet-stream"
    };
}
