namespace Vifan.PrintTech.Application.DTOs.Cart;

public class UpdateCartItemRequest
{
    public int Quantity { get; set; }
    public IReadOnlyList<Guid> SelectedOptionIds { get; set; } = [];
    public string? UploadedFileUrl { get; set; }
}
