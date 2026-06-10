namespace Vifan.PrintTech.Application.DTOs.Cart;

public class CartDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public IReadOnlyList<CartItemDto> Items { get; set; } = [];
    public decimal TotalEstimatedPrice { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
