namespace Vifan.PrintTech.Domain.Enums;

/// <summary>
/// What a ContentDocument represents. Determines whether ProductId is meaningful and,
/// eventually, which public route serves the document -- not a general polymorphic type tag.
/// </summary>
public enum ContentDocumentType
{
    /// <summary>Extended content for one Product (ProductId is required). Foundation only today
    /// -- Product.ContentBlocksJson remains the live storage for product content; nothing writes
    /// ContentDocument rows of this type yet.</summary>
    ProductContent = 0,

    /// <summary>A standalone static page (e.g. About, Terms). ProductId is null.</summary>
    Page = 1,

    /// <summary>A blog post. ProductId is null.</summary>
    BlogPost = 2
}
