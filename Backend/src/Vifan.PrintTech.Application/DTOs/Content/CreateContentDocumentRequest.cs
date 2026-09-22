namespace Vifan.PrintTech.Application.DTOs.Content;

/// <summary>Request body for creating a new content document.</summary>
public class CreateContentDocumentRequest
{
    /// <summary>Accepted values: ProductContent, Page, BlogPost.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Required when Type is ProductContent (must reference an existing Product); must
    /// be omitted/null for every other Type.</summary>
    public Guid? ProductId { get; set; }

    public string Title { get; set; } = string.Empty;

    /// <summary>Optional -- auto-generated from Title (and de-duplicated within the same Type)
    /// when omitted, mirroring Product/ProductCategory's existing slug convention.</summary>
    public string? Slug { get; set; }

    /// <summary>Accepted values: Draft, Published, Archived. Defaults to Draft.</summary>
    public string Status { get; set; } = "Draft";

    public string? BlocksJson { get; set; }
    public string? DraftBlocksJson { get; set; }
}
