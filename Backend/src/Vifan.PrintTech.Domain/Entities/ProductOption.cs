using Vifan.PrintTech.Domain.Common;

namespace Vifan.PrintTech.Domain.Entities;

/// <summary>
/// Links a Product to a catalog <see cref="OptionDefinition"/> the admin has explicitly assigned
/// to it. This is a pure assignment row: it carries no pricing or label data of its own -- all of
/// that lives on the referenced <see cref="OptionDefinition"/> and is read live at pricing time,
/// so an admin editing the catalog price immediately affects every product it's assigned to.
/// </summary>
public class ProductOption : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid OptionDefinitionId { get; set; }
    public OptionDefinition OptionDefinition { get; set; } = null!;

    /// <summary>Per-product display order. Independent of the catalog's own SortOrder -- the same catalog item can sort differently on different products.</summary>
    public int SortOrder { get; set; }

    /// <summary>Per-product assignment active flag. Distinct from OptionDefinition.IsActive: this hides the option from THIS product only, without touching the catalog entry or any other product using it.</summary>
    public bool IsActive { get; set; } = true;
}
