using Vifan.PrintTech.Application.DTOs.Cart;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface ICartService
{
    Task<CartDto> GetMyCartAsync(CancellationToken cancellationToken = default);
    Task<CartItemDto> AddItemAsync(AddCartItemRequest request, CancellationToken cancellationToken = default);
    Task<CartItemDto> UpdateItemAsync(Guid itemId, UpdateCartItemRequest request, CancellationToken cancellationToken = default);
    Task RemoveItemAsync(Guid itemId, CancellationToken cancellationToken = default);
    Task ClearCartAsync(CancellationToken cancellationToken = default);
}
