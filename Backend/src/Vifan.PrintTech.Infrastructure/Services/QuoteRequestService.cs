using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Pricing;
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
    private readonly IPricingService _pricingService;
    private readonly IQuoteStatusNotificationService _quoteStatusNotificationService;
    private readonly IUnitOfWork _unitOfWork;

    public QuoteRequestService(
        IQuoteRequestRepository quoteRequestRepository,
        IProductRepository productRepository,
        IPricingService pricingService,
        IQuoteStatusNotificationService quoteStatusNotificationService,
        IUnitOfWork unitOfWork)
    {
        _quoteRequestRepository = quoteRequestRepository;
        _productRepository = productRepository;
        _pricingService = pricingService;
        _quoteStatusNotificationService = quoteStatusNotificationService;
        _unitOfWork = unitOfWork;
    }

    public async Task<QuoteRequestDto> CreateAsync(
        CreateQuoteRequestRequest request,
        CancellationToken ct = default)
    {
        string? productNameSnapshot = null;
        string? categoryNameSnapshot = null;
        PriceBreakdownDto? pricing = null;

        if (request.ProductId.HasValue)
        {
            var product = await _productRepository.GetByIdAsync(request.ProductId.Value, ct);
            if (product is null)
                throw new NotFoundException($"Product '{request.ProductId}' was not found.");

            productNameSnapshot = product.Name;
            categoryNameSnapshot = product.Category?.Name;

            // Server is the sole pricing authority: any price implied by the client is ignored.
            // This call also enforces cross-product option validation and the product's MinQuantity.
            pricing = await _pricingService.CalculateAsync(new CalculatePriceRequest
            {
                ProductId = request.ProductId.Value,
                Quantity = request.Quantity,
                SelectedOptionIds = request.SelectedOptionIds
            }, ct);
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

        if (pricing is not null)
        {
            entity.BaseUnitPriceSnapshot = pricing.BaseUnitPrice;
            entity.CalculatedUnitPriceSnapshot = pricing.UnitPrice;
            entity.CalculatedSubtotalSnapshot = pricing.Subtotal;
            entity.AdditionalFeesSnapshot = pricing.AdditionalCost + pricing.OrderAdjustmentsTotal;
            entity.DiscountAmountSnapshot = pricing.DiscountAmount;
            entity.CalculatedTotalSnapshot = pricing.CalculatedTotal;
            entity.AppliedPricingRuleIdSnapshot = pricing.AppliedPricingRuleId;
            entity.Currency = pricing.Currency;

            entity.Options = pricing.SelectedOptions.Select(o => new QuoteRequestOption
            {
                OptionDefinitionId = o.OptionDefinitionId,
                OptionTypeSnapshot = o.OptionType,
                OptionNameSnapshot = o.OptionName,
                OptionValueSnapshot = o.OptionValue,
                PriceAdjustmentTypeSnapshot = o.PriceAdjustmentType,
                PriceAdjustmentSnapshot = o.AdditionalPrice,
                CalculatedAmountSnapshot = o.PriceAdjustmentType == nameof(PriceAdjustmentType.FixedPerUnit)
                    ? o.AdditionalPrice * request.Quantity
                    : o.PriceAdjustmentType == nameof(PriceAdjustmentType.FixedPerOrder)
                        ? o.AdditionalPrice
                        : 0m
            }).ToList();
        }

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

    public async Task<QuoteStatusUpdateResultDto> UpdateStatusAsync(
        Guid id,
        UpdateQuoteRequestStatusRequest request,
        CancellationToken ct = default)
    {
        var entity = await _quoteRequestRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Quote request not found.");

        if (!Enum.TryParse<QuoteRequestStatus>(request.Status, ignoreCase: true, out var newStatus))
            throw new ValidationException($"Invalid status value '{request.Status}'.");

        var previousStatus = entity.Status;
        entity.Status = newStatus;

        _quoteRequestRepository.Update(entity);
        await _unitOfWork.SaveChangesAsync(ct);

        // The status change above is already committed by this point. A notification failure
        // (caught internally by the notification service) must never undo it -- it only ever
        // adds an explicit outcome to the response below.
        var notification = await _quoteStatusNotificationService.NotifyIfApplicableAsync(
            entity, previousStatus, newStatus, ct);

        return new QuoteStatusUpdateResultDto
        {
            Quote = MapToDto(entity),
            Notification = notification
        };
    }

    public async Task<QuoteRequestDto> SetFinalQuotedPriceAsync(
        Guid id,
        SetFinalQuotedPriceRequest request,
        CancellationToken ct = default)
    {
        var entity = await _quoteRequestRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Quote request not found.");

        // Additive override only: CalculatedTotalSnapshot (what the pricing engine actually
        // computed at submission time) is never touched or overwritten here.
        entity.FinalQuotedPrice = request.FinalQuotedPrice;
        entity.ManualAdjustment = request.ManualAdjustment;
        entity.InternalNote = request.InternalNote?.Trim();

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
        BaseUnitPriceSnapshot = q.BaseUnitPriceSnapshot,
        CalculatedUnitPriceSnapshot = q.CalculatedUnitPriceSnapshot,
        CalculatedSubtotalSnapshot = q.CalculatedSubtotalSnapshot,
        AdditionalFeesSnapshot = q.AdditionalFeesSnapshot,
        DiscountAmountSnapshot = q.DiscountAmountSnapshot,
        CalculatedTotalSnapshot = q.CalculatedTotalSnapshot,
        AppliedPricingRuleIdSnapshot = q.AppliedPricingRuleIdSnapshot,
        Currency = q.Currency,
        ManualAdjustment = q.ManualAdjustment,
        FinalQuotedPrice = q.FinalQuotedPrice,
        InternalNote = q.InternalNote,
        Options = q.Options.Select(o => new QuoteRequestOptionDto
        {
            Id = o.Id,
            OptionDefinitionId = o.OptionDefinitionId,
            OptionTypeSnapshot = o.OptionTypeSnapshot,
            OptionNameSnapshot = o.OptionNameSnapshot,
            OptionValueSnapshot = o.OptionValueSnapshot,
            PriceAdjustmentTypeSnapshot = o.PriceAdjustmentTypeSnapshot,
            PriceAdjustmentSnapshot = o.PriceAdjustmentSnapshot,
            CalculatedAmountSnapshot = o.CalculatedAmountSnapshot
        }).ToList(),
        CreatedAt = q.CreatedAt,
        UpdatedAt = q.UpdatedAt
    };
}
