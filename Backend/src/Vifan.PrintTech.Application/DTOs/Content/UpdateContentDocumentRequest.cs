namespace Vifan.PrintTech.Application.DTOs.Content;

/// <summary>
/// Request body for updating an existing content document. Type and ProductId are not included
/// here -- they are immutable after creation (mirrors PricingRule, where ProductId cannot be
/// changed on update either), since Type determines whether a ProductId is even valid.
/// </summary>
public class UpdateContentDocumentRequest
{
    public string Title { get; set; } = string.Empty;

    /// <summary>Optional -- auto-generated from Title when omitted, same as on create.</summary>
    public string? Slug { get; set; }

    /// <summary>Accepted values: Draft, Published, Archived.</summary>
    public string Status { get; set; } = string.Empty;

    public string? BlocksJson { get; set; }
    public string? DraftBlocksJson { get; set; }
}
