using Vifan.PrintTech.Application.DTOs.Options;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IProductOptionService
{
    Task<ProductOptionsGroupedDto> GetByProductIdAsync(
        Guid productId,
        bool activeOnly,
        CancellationToken cancellationToken = default);

    Task<ProductOptionDto> CreateAsync(
        Guid productId,
        CreateProductOptionRequest request,
        CancellationToken cancellationToken = default);

    Task<ProductOptionDto> UpdateAsync(
        Guid id,
        UpdateProductOptionRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
