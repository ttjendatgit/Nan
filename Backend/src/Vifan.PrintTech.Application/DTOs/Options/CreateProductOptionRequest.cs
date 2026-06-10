namespace Vifan.PrintTech.Application.DTOs.Options;

public class CreateProductOptionRequest
{
    public string OptionType { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public string OptionValue { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }
    public bool IsActive { get; set; } = true;
}
