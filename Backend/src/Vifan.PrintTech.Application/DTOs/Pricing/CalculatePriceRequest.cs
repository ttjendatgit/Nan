namespace Vifan.PrintTech.Application.DTOs.Pricing;

public class CalculatePriceRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public IReadOnlyList<Guid> SelectedOptionIds { get; set; } = [];
}
