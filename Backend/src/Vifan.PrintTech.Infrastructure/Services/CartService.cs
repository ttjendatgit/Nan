using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Cart;
using Vifan.PrintTech.Application.DTOs.Pricing;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Constants;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Services;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepository;
    private readonly ICartItemRepository _cartItemRepository;
    private readonly IProductRepository _productRepository;
    private readonly IProductOptionRepository _optionRepository;
    private readonly IPricingService _pricingService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public CartService(
        ICartRepository cartRepository,
        ICartItemRepository cartItemRepository,
        IProductRepository productRepository,
        IProductOptionRepository optionRepository,
        IPricingService pricingService,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _cartRepository = cartRepository;
        _cartItemRepository = cartItemRepository;
        _productRepository = productRepository;
        _optionRepository = optionRepository;
        _pricingService = pricingService;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    public async Task<CartDto> GetMyCartAsync(CancellationToken cancellationToken = default)
    {
        var customerId = RequireCustomerId();
        var cart = await GetOrCreateCartAsync(customerId, cancellationToken);
        return MapToDto(cart);
    }

    public async Task<CartItemDto> AddItemAsync(
        AddCartItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var customerId = RequireCustomerId();
        var product = await ValidateProductAsync(request.ProductId, cancellationToken);
        await ValidateOptionsAsync(request.ProductId, request.SelectedOptionIds, cancellationToken);
        ValidateCustomizableFile(product, request.UploadedFileUrl);

        var price = await CalculatePriceAsync(
            request.ProductId,
            request.Quantity,
            request.SelectedOptionIds,
            cancellationToken);

        var cart = await GetOrCreateCartAsync(customerId, cancellationToken);

        var item = new CartItem
        {
            CartId = cart.Id,
            ProductId = request.ProductId,
            Quantity = request.Quantity,
            SelectedOptionsJson = SelectedOptionsJsonHelper.Serialize(request.SelectedOptionIds),
            UploadedFileUrl = request.UploadedFileUrl,
            EstimatedPrice = price.EstimatedPrice
        };

        await _cartItemRepository.AddAsync(item, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        item.Product = product;
        return MapItemToDto(item);
    }

    public async Task<CartItemDto> UpdateItemAsync(
        Guid itemId,
        UpdateCartItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var customerId = RequireCustomerId();
        var item = await GetOwnedItemAsync(itemId, customerId, cancellationToken);

        await ValidateOptionsAsync(item.ProductId, request.SelectedOptionIds, cancellationToken);
        var product = item.Product ?? await _productRepository.GetByIdAsync(item.ProductId, cancellationToken)
            ?? throw new NotFoundException("Product not found.");

        ValidateCustomizableFile(product, request.UploadedFileUrl);

        var price = await CalculatePriceAsync(
            item.ProductId,
            request.Quantity,
            request.SelectedOptionIds,
            cancellationToken);

        item.Quantity = request.Quantity;
        item.SelectedOptionsJson = SelectedOptionsJsonHelper.Serialize(request.SelectedOptionIds);
        item.UploadedFileUrl = request.UploadedFileUrl;
        item.EstimatedPrice = price.EstimatedPrice;

        _cartItemRepository.Update(item);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapItemToDto(item);
    }

    public async Task RemoveItemAsync(Guid itemId, CancellationToken cancellationToken = default)
    {
        var customerId = RequireCustomerId();
        var item = await GetOwnedItemAsync(itemId, customerId, cancellationToken);

        _cartItemRepository.Remove(item);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task ClearCartAsync(CancellationToken cancellationToken = default)
    {
        var customerId = RequireCustomerId();
        var cart = await _cartRepository.GetByCustomerIdWithItemsAsync(customerId, cancellationToken);

        if (cart is null || cart.Items.Count == 0)
            return;

        foreach (var item in cart.Items.ToList())
            _cartItemRepository.Remove(item);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private Guid RequireCustomerId()
    {
        if (!_currentUserService.IsInRole(Roles.Customer))
            throw new ForbiddenException("Only customers can access the cart.");

        if (!_currentUserService.UserId.HasValue)
            throw new UnauthorizedException();

        return _currentUserService.UserId.Value;
    }

    private async Task<Cart> GetOrCreateCartAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var cart = await _cartRepository.GetByCustomerIdWithItemsAsync(customerId, cancellationToken);
        if (cart is not null)
            return cart;

        cart = new Cart { CustomerId = customerId };
        await _cartRepository.AddAsync(cart, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _cartRepository.GetByCustomerIdWithItemsAsync(customerId, cancellationToken) ?? cart;
    }

    private async Task<CartItem> GetOwnedItemAsync(
        Guid itemId,
        Guid customerId,
        CancellationToken cancellationToken)
    {
        var item = await _cartItemRepository.GetByIdWithCartAsync(itemId, cancellationToken)
            ?? throw new NotFoundException("Cart item not found.");

        if (item.Cart.CustomerId != customerId)
            throw new ForbiddenException("You can only access your own cart.");

        return item;
    }

    private async Task<Product> ValidateProductAsync(Guid productId, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(productId, cancellationToken);
        if (product is null || !product.IsActive)
            throw new NotFoundException("Product not found or is inactive.");

        return product;
    }

    private async Task ValidateOptionsAsync(
        Guid productId,
        IReadOnlyList<Guid> optionIds,
        CancellationToken cancellationToken)
    {
        if (optionIds.Count == 0)
            return;

        var options = await _optionRepository.GetByIdsForProductAsync(
            productId,
            optionIds,
            activeOnly: true,
            cancellationToken);

        if (options.Count != optionIds.Distinct().Count())
            throw new ValidationException("One or more selected options are invalid for this product.");
    }

    private static void ValidateCustomizableFile(Product product, string? uploadedFileUrl)
    {
        if (product.IsCustomizable && string.IsNullOrWhiteSpace(uploadedFileUrl))
            throw new BusinessRuleException("Design file URL is required for customizable products.");
    }

    private Task<PriceBreakdownDto> CalculatePriceAsync(
        Guid productId,
        int quantity,
        IReadOnlyList<Guid> optionIds,
        CancellationToken cancellationToken) =>
        _pricingService.CalculateAsync(new CalculatePriceRequest
        {
            ProductId = productId,
            Quantity = quantity,
            SelectedOptionIds = optionIds
        }, cancellationToken);

    private static CartDto MapToDto(Cart cart) =>
        new()
        {
            Id = cart.Id,
            CustomerId = cart.CustomerId,
            Items = cart.Items.Select(MapItemToDto).ToList(),
            TotalEstimatedPrice = cart.Items.Sum(i => i.EstimatedPrice),
            CreatedAt = cart.CreatedAt,
            UpdatedAt = cart.UpdatedAt
        };

    private static CartItemDto MapItemToDto(CartItem item) =>
        new()
        {
            Id = item.Id,
            ProductId = item.ProductId,
            ProductName = item.Product?.Name ?? string.Empty,
            Quantity = item.Quantity,
            SelectedOptionIds = SelectedOptionsJsonHelper.Deserialize(item.SelectedOptionsJson),
            UploadedFileUrl = item.UploadedFileUrl,
            EstimatedPrice = item.EstimatedPrice,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
}
