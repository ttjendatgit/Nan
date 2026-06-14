using Microsoft.AspNetCore.Http;

namespace Vifan.PrintTech.API.Helpers;

/// <summary>
/// Validates an <see cref="IFormFile"/> before uploading it to Cloudinary.
/// Enforces allowed image content types and maximum file size.
/// </summary>
internal static class ImageUploadGuard
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif"
    };

    private const long MaxBytes = 10L * 1024 * 1024; // 10 MB

    /// <summary>
    /// Returns <c>null</c> if the file passes validation, or a user-facing error message if it does not.
    /// </summary>
    public static string? Validate(IFormFile file)
    {
        if (!AllowedContentTypes.Contains(file.ContentType))
            return $"Unsupported image type '{file.ContentType}'. Allowed: JPEG, PNG, WebP, AVIF.";

        if (file.Length > MaxBytes)
            return $"Image exceeds the maximum size of 10 MB (received {file.Length / 1024 / 1024} MB).";

        return null;
    }
}
