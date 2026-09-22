namespace Vifan.PrintTech.Application.DTOs.Content;

/// <summary>Read model returned by content document endpoints. Enum fields are exposed as their
/// string names (e.g. "ProductContent", "Draft"), matching the OptionDefinition/PricingRule
/// convention -- never a raw numeric enum value.</summary>
public class ContentDocumentDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public Guid? ProductId { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? BlocksJson { get; set; }
    public string? DraftBlocksJson { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
