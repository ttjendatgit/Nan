namespace Vifan.PrintTech.Application.DTOs.Options;

public class ProductOptionDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string OptionType { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public string OptionValue { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
