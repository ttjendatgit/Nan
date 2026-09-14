namespace Vifan.PrintTech.Application.DTOs.OptionCatalog;

public class OptionDefinitionDto
{
    public Guid Id { get; set; }
    public string OptionType { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public string OptionValue { get; set; } = string.Empty;
    public string PriceAdjustmentType { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }

    /// <summary>Number of products this catalog entry is currently assigned to. Admin-only signal, not exposed on public endpoints.</summary>
    public int ProductAssignmentCount { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
