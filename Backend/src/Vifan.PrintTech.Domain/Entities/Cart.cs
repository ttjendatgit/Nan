using Vifan.PrintTech.Domain.Common;

namespace Vifan.PrintTech.Domain.Entities;

public class Cart : BaseEntity
{
    public Guid CustomerId { get; set; }
    public ApplicationUser Customer { get; set; } = null!;
    public ICollection<CartItem> Items { get; set; } = [];
}
