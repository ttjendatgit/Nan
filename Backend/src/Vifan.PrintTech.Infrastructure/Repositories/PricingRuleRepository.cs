using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Infrastructure.Repositories;

public class PricingRuleRepository : Repository<PricingRule>, IPricingRuleRepository
{
    public PricingRuleRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<PricingRule>> GetByProductIdAsync(
        Guid productId,
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        var query = DbSet.AsNoTracking().Where(x => x.ProductId == productId);

        if (activeOnly)
            query = query.Where(x => x.IsActive);

        return await query
            .OrderBy(x => x.MinQuantity)
            .ToListAsync(cancellationToken);
    }

    public async Task<PricingRule?> FindBestMatchAsync(
        Guid productId,
        int quantity,
        string? material,
        string? size,
        string? printingSide,
        CancellationToken cancellationToken = default)
    {
        var rules = await DbSet
            .AsNoTracking()
            .Where(x => x.ProductId == productId && x.IsActive)
            .Where(x => x.MinQuantity <= quantity && (x.MaxQuantity == null || x.MaxQuantity >= quantity))
            .ToListAsync(cancellationToken);

        return rules
            .Where(r => MatchesField(r.Material, material))
            .Where(r => MatchesField(r.Size, size))
            .Where(r => MatchesField(r.PrintingSide, printingSide))
            .OrderByDescending(r => RuleSpecificityScore(r))
            .ThenByDescending(r => r.DiscountPercent)
            .FirstOrDefault();
    }

    private static bool MatchesField(string? ruleValue, string? selectedValue)
    {
        if (string.IsNullOrWhiteSpace(ruleValue))
            return true;

        return string.Equals(
            ruleValue.Trim(),
            selectedValue?.Trim(),
            StringComparison.OrdinalIgnoreCase);
    }

    private static int RuleSpecificityScore(PricingRule rule)
    {
        var score = 0;
        if (!string.IsNullOrWhiteSpace(rule.Material)) score++;
        if (!string.IsNullOrWhiteSpace(rule.Size)) score++;
        if (!string.IsNullOrWhiteSpace(rule.PrintingSide)) score++;
        return score;
    }
}
