namespace Vifan.PrintTech.Application.DTOs.Options;

/// <summary>Assigns an existing catalog entry to a product. Does not create a new catalog entry.</summary>
public class CreateProductOptionRequest
{
    public Guid OptionDefinitionId { get; set; }

    /// <summary>Per-product display order. Omit to auto-append after the last option in the same OptionType group on this product.</summary>
    public int? SortOrder { get; set; }

    public bool IsActive { get; set; } = true;
}
