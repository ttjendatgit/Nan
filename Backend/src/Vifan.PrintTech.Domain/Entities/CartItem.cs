using Vifan.PrintTech.Domain.Common;

namespace Vifan.PrintTech.Domain.Entities;

public class CartItem : BaseEntity
{
    public Guid CartId { get; set; }
    public Cart Cart { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int Quantity { get; set; }
    public string SelectedOptionsJson { get; set; } = "[]";
    public string? UploadedFileUrl { get; set; }
    public decimal EstimatedPrice { get; set; }
}
