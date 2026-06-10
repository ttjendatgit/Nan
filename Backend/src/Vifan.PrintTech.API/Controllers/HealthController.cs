using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Vifan.PrintTech.API.Controllers;

public class HealthController : BaseApiController
{
    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get() =>
        OkResponse(new
        {
            Status = "Healthy",
            Service = "Vifan PrintTech API",
            Timestamp = DateTime.UtcNow
        });
}
