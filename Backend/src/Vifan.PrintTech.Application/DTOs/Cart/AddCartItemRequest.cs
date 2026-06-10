namespace Vifan.PrintTech.Application.DTOs.Cart;

public class AddCartItemRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public IReadOnlyList<Guid> SelectedOptionIds { get; set; } = [];
    public string? UploadedFileUrl { get; set; }
}
