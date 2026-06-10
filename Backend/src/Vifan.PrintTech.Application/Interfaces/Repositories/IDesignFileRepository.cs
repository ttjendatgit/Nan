using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Application.Interfaces.Repositories;

public interface IDesignFileRepository : IRepository<DesignFile>
{
    Task<IReadOnlyList<DesignFile>> GetByCustomerIdAsync(
        Guid customerId,
        CancellationToken cancellationToken = default);

    Task<DesignFile?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}
