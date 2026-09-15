namespace Vifan.PrintTech.Domain.Enums;

/// <summary>
/// The specific customer-facing quote status emails this system sends. Deliberately limited to
/// the two business-required notifications -- not a general event/notification type list.
/// </summary>
public enum QuoteEmailNotificationType
{
    Contacted = 0,
    Quoted = 1
}
