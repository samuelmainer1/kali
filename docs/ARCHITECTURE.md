# Globeflight ILMS — Architecture

## Product

**Globeflight ILMS** is an Integrated Logistics Management System for Globeflight Kenya. It centralizes CRM, quotations, shipments, warehouse, reporting, customer self-service, and administration.

## Stack decision

| Layer | Choice | Why |
| --- | --- | --- |
| Backend | Laravel 13 (latest stable) | Mature ecosystem, strong auth/security defaults, HostAfrica-friendly |
| Frontend | React 18 + Inertia.js | SPA UX without a separate API/CORS deploy for VPS |
| Auth | Laravel Breeze + Sanctum (session) | CSRF-safe cookie sessions; Sanctum ready for future API/mobile tokens |
| CSS | Tailwind CSS | Rapid enterprise UI; design tokens for brand |
| Charts | ApexCharts | Rich KPI dashboards |
| Icons | Lucide React | Consistent, lightweight |
| RBAC | Spatie Laravel Permission | Roles + fine-grained permissions |
| DB | MySQL / MariaDB | Production target on HostAfrica |

### Why Inertia monolith (not split SPA + API)?

1. One deployable app on HostAfrica VPS (Nginx → PHP-FPM + Vite build assets).
2. Session/CSRF security is built-in (no fragile token plumbing for day one).
3. Modules share one routing/auth layer; future WhatsApp/SMS/mobile can consume `/api/*` routes with Sanctum tokens without rewriting the core.

## High-level structure

```
app/
  Domain/                 # Future bounded contexts (CRM, Shipments, …)
  Http/Controllers/       # Thin controllers
  Http/Middleware/        # Auth, role, active-user gates
  Models/
  Services/               # Business logic (ActivityLog, notifications, …)
  Notifications/          # Email now; WhatsApp/SMS adapters later
database/
  migrations/
  seeders/
resources/js/
  Components/
  Layouts/                # App shell (sidebar + topbar)
  Pages/                  # Inertia pages per module
docs/                     # Architecture + per-module DB designs
```

## Role model

Roles (exact names used in seeders):

- `administrator`
- `management`
- `sales`
- `operations`
- `warehouse`
- `finance`
- `customer_care`
- `marketing`
- `customer`

Permissions are module-scoped (`users.view`, `shipments.update`, …). Controllers/middleware check permissions; navigation is filtered by the same permission set.

## Module roadmap (build order)

> Internal planning only — shown on admin/management dashboards.

1. Foundation + Authentication + RBAC + App shell + role dashboards (stubs)
2. Administration (users, roles, departments, branches, settings, audit logs)
3. CRM + Quotations (combined)
4. Shipments + Warehouse (combined)
5. Weekly / monthly employee reports
6. Support + Marketing (combined)
7. Invoices (Finance) + admin protections
8. **Task & Workflow Management** ← current
9. Customer portal self-service
10. Reporting exports (PDF/Excel)
11. Notification adapters (Email → WhatsApp/SMS)

See `docs/modules/` for per-module designs.

Each module gets a DB design doc and approval gate before implementation continues.

## Security baseline

- Password hashing (bcrypt)
- CSRF on all web mutations
- Role/permission authorization
- Active-user gate (disabled accounts cannot login)
- Activity logging for auth and admin actions
- Validated form requests
- Prepared file-upload rules (later modules)

## Brand tokens

Derived from the Globeflight logo:

| Token | Hex | Use |
| --- | --- | --- |
| `gf-yellow` | `#F5C400` | Accent / pending |
| `gf-green` | `#2EAF4A` | Success / delivered |
| `gf-red` | `#E30613` | Alert |
| `gf-blue` | `#00A5E3` | Info / in-transit |
| `gf-forest` | `#1A5C2E` | Brand secondary / tagline |
| `gf-ink` | `#0B1220` | Primary text / dark surfaces |

Light mode is default; dark mode is class-based (`html.dark`).

## Notifications (architecture ready)

`App\Services\Notifications\NotificationChannel` interface with `EmailChannel` implemented first. `WhatsAppChannel` and `SmsChannel` are stubbed for future providers without changing call sites.
