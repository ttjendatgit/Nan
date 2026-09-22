namespace Vifan.PrintTech.Domain.Enums;

/// <summary>Editorial state of a ContentDocument.</summary>
public enum ContentStatus
{
    /// <summary>Not publicly visible. DraftBlocksJson holds in-progress edits.</summary>
    Draft = 0,

    /// <summary>Publicly visible. BlocksJson is the live, published content.</summary>
    Published = 1,

    /// <summary>No longer publicly visible, kept for record-keeping rather than deleted.</summary>
    Archived = 2
}
