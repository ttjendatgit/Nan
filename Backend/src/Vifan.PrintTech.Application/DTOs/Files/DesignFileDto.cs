namespace Vifan.PrintTech.Application.DTOs.Files;

public class DesignFileDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid? OrderItemId { get; set; }
    public Guid? QuoteRequestId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ReviewStatus { get; set; } = string.Empty;
    public Guid? StaffId { get; set; }
    public string? ReviewNote { get; set; }
    public DateTime UploadedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
