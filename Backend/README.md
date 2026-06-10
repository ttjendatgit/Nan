# Vifan PrintTech API

ASP.NET Core Web API backend for a print-tech e-commerce platform (.NET 8).

## Architecture

Clean Architecture with four layers:

| Layer | Project | Responsibility |
|-------|---------|----------------|
| Domain | `Vifan.PrintTech.Domain` | Entities, constants, base types |
| Application | `Vifan.PrintTech.Application` | DTOs, interfaces, validators, exceptions, API contracts |
| Infrastructure | `Vifan.PrintTech.Infrastructure` | EF Core, Identity, JWT, repositories |
| API | `Vifan.PrintTech.API` | Controllers, middleware, Swagger, CORS |

## Tech stack

- ASP.NET Core Web API (.NET 8)
- Entity Framework Core + SQL Server
- ASP.NET Core Identity + JWT Bearer authentication
- Role-based authorization (`Customer`, `Staff`, `Manager`)
- FluentValidation
- Swagger/OpenAPI

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- SQL Server or LocalDB

## Getting started

```bash
# Restore and build
dotnet restore
dotnet build

# Apply database migrations (from repo root)
dotnet ef database update --project src/Vifan.PrintTech.Infrastructure --startup-project src/Vifan.PrintTech.API

# Run API
dotnet run --project src/Vifan.PrintTech.API
```

Swagger UI (Development): `https://localhost:7xxx` (see launchSettings.json).

## Configuration

Update `src/Vifan.PrintTech.API/appsettings.json`:

- `ConnectionStrings:DefaultConnection` — SQL Server connection string
- `Jwt:Secret` — at least 32 characters for production
- `Cors:AllowedOrigins` — frontend URLs

## API response format

All successful and error responses use a standard envelope:

```json
{
  "success": true,
  "message": "Optional message",
  "data": { },
  "errors": null
}
```

## Roles

- **Customer** — end users (cart, orders, quotes — to be implemented)
- **Staff** — order/design workflow (to be implemented)
- **Manager** — full access (to be implemented)

## Default Manager account (seeded on startup)

| Field | Value |
|-------|-------|
| Email | `manager@vifan.com` |
| Password | `Manager@123` |

Configure in `Seed:Manager` in appsettings.

## API endpoints

### Auth
- `POST /api/auth/register` — Customer registration (anonymous)
- `POST /api/auth/login` — Login (anonymous)
- `POST /api/auth/refresh-token` — Refresh JWT (anonymous)
- `GET /api/auth/me` — Current user profile (authorized)

### Users (Manager only)
- `POST /api/users/staff` — Create Staff account
- `GET /api/users` — List users (pagination, search, role filter)
- `PUT /api/users/{id}/status` — Activate/deactivate user

### Categories
- `GET /api/categories` — Public: active only; Manager: all
- `GET /api/categories/{id}`
- `POST /api/categories` — Manager
- `PUT /api/categories/{id}` — Manager
- `DELETE /api/categories/{id}` — Manager

### Products
- `GET /api/products` — Search, filter by category, pagination
- `GET /api/products/{id}`
- `GET /api/products/by-category/{categoryId}`
- `POST /api/products` — Manager
- `PUT /api/products/{id}` — Manager
- `DELETE /api/products/{id}` — Manager

## Migrations

```bash
dotnet ef migrations add <Name> --project src/Vifan.PrintTech.Infrastructure --startup-project src/Vifan.PrintTech.API
dotnet ef database update --project src/Vifan.PrintTech.Infrastructure --startup-project src/Vifan.PrintTech.API
```

Latest: `AddProductOptionsAndPricingRules` (ProductOptions, PricingRules).

### Product options
- `GET /api/products/{productId}/options` — grouped by OptionType (public: active only)
- `POST /api/products/{productId}/options` — Manager
- `PUT /api/product-options/{id}` — Manager
- `DELETE /api/product-options/{id}` — Manager

OptionType: `Size`, `Material`, `PrintingSide`, `ColorOption`, `Finishing`, `Lamination`, `Cutting`, `Folding`, `SpecialEffect`, `DeliverySpeed`

### Pricing
- `POST /api/pricing/calculate` — estimated price with breakdown (anonymous)
- `GET /api/pricing-rules/product/{productId}` — Manager
- `POST /api/pricing-rules` — Manager
- `PUT /api/pricing-rules/{id}` — Manager
- `DELETE /api/pricing-rules/{id}` — Manager

**Price formula:** `(BaseUnitPrice + option prices per unit) × quantity + AdditionalCost − DiscountAmount + UrgentDeliveryCost`
