namespace Vifan.PrintTech.Application.DTOs.Media;

public class MediaUploadResultDto
{
    public string PublicId { get; set; } = string.Empty;
    public string SecureUrl { get; set; } = string.Empty;
    public string OriginalFilename { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public int? Width { get; set; }
    public int? Height { get; set; }
    public long Bytes { get; set; }
    public string Folder { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
