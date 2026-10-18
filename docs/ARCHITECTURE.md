# Globeflight ILMS — Architecture

## Product

**Globeflight ILMS** is an Integrated Logistics Management System for Globeflight Kenya. It centralizes CRM, quotations, shipments, warehouse, reporting, customer self-service, and administration.

## Stack decision

| Layer | Choice | Why |
| --- | --- | --- |
| Language | PHP 8.4 | Server application |
| Framework | Laravel 13 | Jobs, permissions, documents, queues, mail, and invoices |
| Screens | React 19 with Inertia | Staff app and the customer tracking portal in one project |
| Styling | Tailwind CSS | Forms, tables, and the job timeline |
| Database | MySQL 8 | Customers, jobs, warehouse stock, and invoices. Tests use SQLite |
| Cache and queues | Redis | Tracking notifications, PDF generation, and imports. Tests use array cache and the sync queue |
| Files | Private disk, S3-compatible later | Air waybills, packing lists, and proof-of-delivery photos. Set `DOCUMENTS_DISK=s3` when the bucket is ready |
| Auth | Laravel session login, Sanctum tokens | Staff login now, a driver app later via `/api/login` |
| Permissions | Spatie Laravel Permission | Branch and role access |
| PDF and Excel | Queued DomPDF and PhpSpreadsheet | Invoices, manifests, and reports |
| Search | MySQL | Job number, airway bill, and customer name |

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
10. Reporting exports (PDF/Excel) — cargo manifests, shipment spreadsheets, and employee reports
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
