namespace Vifan.PrintTech.Application.DTOs.OptionCatalog;

public class CreateOptionDefinitionRequest
{
    public string OptionType { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public string OptionValue { get; set; } = string.Empty;

    /// <summary>One of: None, FixedPerUnit, FixedPerOrder. Defaults to FixedPerUnit when omitted.</summary>
    public string? PriceAdjustmentType { get; set; }

    public decimal AdditionalPrice { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
