using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.QuoteRequests;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Infrastructure.Services;

public class QuoteRequestService : IQuoteRequestService
{
    private readonly IQuoteRequestRepository _quoteRequestRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public QuoteRequestService(
        IQuoteRequestRepository quoteRequestRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork)
    {
        _quoteRequestRepository = quoteRequestRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<QuoteRequestDto> CreateAsync(
        CreateQuoteRequestRequest request,
        CancellationToken ct = default)
    {
        string? productNameSnapshot = null;
        string? categoryNameSnapshot = null;

        if (request.ProductId.HasValue)
        {
            var product = await _productRepository.GetByIdAsync(request.ProductId.Value, ct);
            if (product is null)
                throw new NotFoundException($"Product '{request.ProductId}' was not found.");

            productNameSnapshot = product.Name;
            categoryNameSnapshot = product.Category?.Name;
        }

        var entity = new QuoteRequest
        {
            ProductId = request.ProductId,
            ProductNameSnapshot = productNameSnapshot,
            CategoryNameSnapshot = categoryNameSnapshot,
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email?.Trim(),
            CompanyName = request.CompanyName?.Trim(),
            Quantity = request.Quantity,
            NeededDate = request.NeededDate,
            UseCase = request.UseCase?.Trim(),
            Message = request.Message?.Trim(),
            Status = QuoteRequestStatus.New
        };

        await _quoteRequestRepository.AddAsync(entity, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return MapToDto(entity);
    }

    public async Task<PagedResult<QuoteRequestDto>> GetAllAsync(
        QuoteRequestQueryParameters query,
        CancellationToken ct = default)
    {
        var paged = await _quoteRequestRepository.GetPagedAsync(
            query.Status,
            query.Search,
            query.PageNumber,
            query.PageSize,
            ct);

        return new PagedResult<QuoteRequestDto>
        {
            Items = paged.Items.Select(MapToDto).ToList(),
            PageNumber = paged.PageNumber,
            PageSize = paged.PageSize,
            TotalCount = paged.TotalCount
        };
    }

    public async Task<QuoteRequestDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _quoteRequestRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Quote request not found.");

        return MapToDto(entity);
    }

    public async Task<QuoteRequestDto> UpdateStatusAsync(
        Guid id,
        UpdateQuoteRequestStatusRequest request,
        CancellationToken ct = default)
    {
        var entity = await _quoteRequestRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Quote request not found.");

        if (!Enum.TryParse<QuoteRequestStatus>(request.Status, ignoreCase: true, out var newStatus))
            throw new ValidationException($"Invalid status value '{request.Status}'.");

        entity.Status = newStatus;

        _quoteRequestRepository.Update(entity);
        await _unitOfWork.SaveChangesAsync(ct);

        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _quoteRequestRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Quote request not found.");

        _quoteRequestRepository.Remove(entity);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    private static QuoteRequestDto MapToDto(QuoteRequest q) => new()
    {
        Id = q.Id,
        ProductId = q.ProductId,
        ProductNameSnapshot = q.ProductNameSnapshot,
        CategoryNameSnapshot = q.CategoryNameSnapshot,
        FullName = q.FullName,
        Phone = q.Phone,
        Email = q.Email,
        CompanyName = q.CompanyName,
        Quantity = q.Quantity,
        NeededDate = q.NeededDate,
        UseCase = q.UseCase,
        Message = q.Message,
        Status = q.Status.ToString(),
        CreatedAt = q.CreatedAt,
        UpdatedAt = q.UpdatedAt
    };
}
