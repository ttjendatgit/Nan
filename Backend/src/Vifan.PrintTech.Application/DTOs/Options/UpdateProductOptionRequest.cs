namespace Vifan.PrintTech.Application.DTOs.Options;

/// <summary>Updates a Product's assignment of a catalog entry (display order / per-product active flag). Never changes catalog price/label data.</summary>
public class UpdateProductOptionRequest
{
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}
