using System.Text.Json;
using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.DTOs.Content;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Domain.Helpers;

namespace Vifan.PrintTech.Infrastructure.Services;

public class ContentDocumentService : IContentDocumentService
{
    private readonly IContentDocumentRepository _contentDocumentRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ContentDocumentService(
        IContentDocumentRepository contentDocumentRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork)
    {
        _contentDocumentRepository = contentDocumentRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<ContentDocumentDto>> GetAllAsync(
        ContentDocumentQueryParameters query,
        CancellationToken cancellationToken = default)
    {
        ContentDocumentType? typeFilter = null;
        if (!string.IsNullOrWhiteSpace(query.Type))
            typeFilter = ParseType(query.Type);

        var result = await _contentDocumentRepository.GetPagedAsync(
            typeFilter, query.PageNumber, query.PageSize, cancellationToken);

        return MapPaged(result);
    }

    public async Task<ContentDocumentDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var document = await _contentDocumentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Content document not found.");

        return MapToDto(document);
    }

    public async Task<ContentDocumentDto> CreateAsync(
        CreateContentDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        var type = ParseType(request.Type);
        var status = ParseStatus(request.Status);

        await ValidateProductReferenceAsync(type, request.ProductId, cancellationToken);
        ValidateBlocksJson(request.BlocksJson, nameof(request.BlocksJson));
        ValidateBlocksJson(request.DraftBlocksJson, nameof(request.DraftBlocksJson));

        var slug = await ResolveUniqueSlugAsync(
            type,
            string.IsNullOrWhiteSpace(request.Slug) ? SlugHelper.Generate(request.Title) : request.Slug!,
            null,
            cancellationToken);

        var document = new ContentDocument
        {
            Type = type,
            ProductId = request.ProductId,
            Slug = slug,
            Title = request.Title.Trim(),
            Status = status,
            BlocksJson = request.BlocksJson,
            DraftBlocksJson = request.DraftBlocksJson,
            SeoTitle = Normalize(request.SeoTitle),
            SeoDescription = Normalize(request.SeoDescription),
            SeoKeywords = Normalize(request.SeoKeywords),
            SeoImageUrl = Normalize(request.SeoImageUrl),
            CanonicalUrl = Normalize(request.CanonicalUrl)
        };

        await _contentDocumentRepository.AddAsync(document, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(document);
    }

    public async Task<ContentDocumentDto> UpdateAsync(
        Guid id,
        UpdateContentDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        var document = await _contentDocumentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Content document not found.");

        var status = ParseStatus(request.Status);
        ValidateBlocksJson(request.BlocksJson, nameof(request.BlocksJson));
        ValidateBlocksJson(request.DraftBlocksJson, nameof(request.DraftBlocksJson));

        var slug = await ResolveUniqueSlugAsync(
            document.Type,
            string.IsNullOrWhiteSpace(request.Slug) ? SlugHelper.Generate(request.Title) : request.Slug!,
            id,
            cancellationToken);

        document.Title = request.Title.Trim();
        document.Slug = slug;
        document.Status = status;
        document.BlocksJson = request.BlocksJson;
        document.DraftBlocksJson = request.DraftBlocksJson;
        document.SeoTitle = Normalize(request.SeoTitle);
        document.SeoDescription = Normalize(request.SeoDescription);
        document.SeoKeywords = Normalize(request.SeoKeywords);
        document.SeoImageUrl = Normalize(request.SeoImageUrl);
        document.CanonicalUrl = Normalize(request.CanonicalUrl);

        _contentDocumentRepository.Update(document);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(document);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var document = await _contentDocumentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Content document not found.");

        _contentDocumentRepository.Remove(document);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    // Enforces the invariant already documented on the entity (Phase 1.1): ProductId is required
    // exactly when Type is ProductContent, and must reference a real Product. This is the
    // entity's own already-declared shape, not a new business rule.
    private async Task ValidateProductReferenceAsync(
        ContentDocumentType type,
        Guid? productId,
        CancellationToken cancellationToken)
    {
        if (type == ContentDocumentType.ProductContent)
        {
            if (productId is null)
                throw new ValidationException("ProductId is required when Type is ProductContent.");

            var product = await _productRepository.GetByIdAsync(productId.Value, cancellationToken);
            if (product is null)
                throw new NotFoundException("Product not found.");
        }
        else if (productId is not null)
        {
            throw new ValidationException("ProductId must be empty unless Type is ProductContent.");
        }
    }

    // Mirrors ProductService.UpdateContentAsync's exact validation for the same JSON shape --
    // block content stays an opaque, app-validated JSON array, not a DB-enforced schema.
    private static void ValidateBlocksJson(string? json, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(json))
            return;

        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
                throw new ValidationException($"{fieldName} must be a JSON array.");
        }
        catch (JsonException)
        {
            throw new ValidationException($"{fieldName} is not valid JSON.");
        }
    }

    private async Task<string> ResolveUniqueSlugAsync(
        ContentDocumentType type,
        string baseSlug,
        Guid? excludeId,
        CancellationToken cancellationToken)
    {
        var slug = SlugHelper.Generate(baseSlug);
        var candidate = slug;
        var suffix = 1;

        while (await _contentDocumentRepository.SlugExistsAsync(type, candidate, excludeId, cancellationToken))
        {
            candidate = $"{slug}-{suffix++}";
        }

        return candidate;
    }

    // Same empty-string-becomes-null convention PricingRuleService uses for its optional text
    // fields -- avoids storing "" vs. null inconsistently for "not set."
    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ContentDocumentType ParseType(string value)
    {
        if (!Enum.TryParse<ContentDocumentType>(value, ignoreCase: true, out var parsed))
            throw new ValidationException($"Invalid Type. Valid values: {string.Join(", ", Enum.GetNames<ContentDocumentType>())}.");

        return parsed;
    }

    private static ContentStatus ParseStatus(string value)
    {
        if (!Enum.TryParse<ContentStatus>(value, ignoreCase: true, out var parsed))
            throw new ValidationException($"Invalid Status. Valid values: {string.Join(", ", Enum.GetNames<ContentStatus>())}.");

        return parsed;
    }

    private static PagedResult<ContentDocumentDto> MapPaged(PagedResult<ContentDocument> source) =>
        new()
        {
            Items = source.Items.Select(MapToDto).ToList(),
            PageNumber = source.PageNumber,
            PageSize = source.PageSize,
            TotalCount = source.TotalCount
        };

    private static ContentDocumentDto MapToDto(ContentDocument document) =>
        new()
        {
            Id = document.Id,
            Type = document.Type.ToString(),
            ProductId = document.ProductId,
            Slug = document.Slug,
            Title = document.Title,
            Status = document.Status.ToString(),
            BlocksJson = document.BlocksJson,
            DraftBlocksJson = document.DraftBlocksJson,
            SeoTitle = document.SeoTitle,
            SeoDescription = document.SeoDescription,
            SeoKeywords = document.SeoKeywords,
            SeoImageUrl = document.SeoImageUrl,
            CanonicalUrl = document.CanonicalUrl,
            CreatedAt = document.CreatedAt,
            UpdatedAt = document.UpdatedAt
        };
}
