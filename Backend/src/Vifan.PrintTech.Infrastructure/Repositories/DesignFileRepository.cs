using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Infrastructure.Repositories;

public class DesignFileRepository : Repository<DesignFile>, IDesignFileRepository
{
    public DesignFileRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<DesignFile>> GetByCustomerIdAsync(
        Guid customerId,
        CancellationToken cancellationToken = default) =>
        await DbSet
            .AsNoTracking()
            .Where(f => f.CustomerId == customerId)
            .OrderByDescending(f => f.UploadedAt)
            .ToListAsync(cancellationToken);

    public async Task<DesignFile?> GetByIdWithDetailsAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        await DbSet
            .Include(f => f.Customer)
            .Include(f => f.Staff)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
}
