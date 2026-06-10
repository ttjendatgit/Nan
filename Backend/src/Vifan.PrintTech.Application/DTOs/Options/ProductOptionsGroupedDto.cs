namespace Vifan.PrintTech.Application.DTOs.Options;

public class ProductOptionsGroupedDto
{
    public Guid ProductId { get; set; }
    public IReadOnlyList<OptionTypeGroupDto> Groups { get; set; } = [];
}

public class OptionTypeGroupDto
{
    public string OptionType { get; set; } = string.Empty;
    public IReadOnlyList<ProductOptionDto> Options { get; set; } = [];
}
