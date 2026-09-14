using Vifan.PrintTech.Application.DTOs.OptionCatalog;

namespace Vifan.PrintTech.Application.Interfaces.Services;

public interface IOptionDefinitionService
{
    Task<IReadOnlyList<OptionDefinitionDto>> GetAllAsync(bool activeOnly, CancellationToken cancellationToken = default);
    Task<OptionDefinitionDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<OptionDefinitionDto> CreateAsync(CreateOptionDefinitionRequest request, CancellationToken cancellationToken = default);
    Task<OptionDefinitionDto> UpdateAsync(Guid id, UpdateOptionDefinitionRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
