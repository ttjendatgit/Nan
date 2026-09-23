namespace Vifan.PrintTech.Application.DTOs.Media;

/// <summary>Read model for one indexed Media Library asset.</summary>
public class MediaAssetDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string PublicId { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long Size { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? Folder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
