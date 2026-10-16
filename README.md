# Globeflight ILMS

Integrated Logistics Management System (ILMS) for **Globeflight Kenya**.

## Stack

- PHP 8.4, Laravel 13, Inertia.js, React 19
- Tailwind CSS
- MySQL 8
- Redis for cache and queues
- Private document disk, S3-compatible storage when `DOCUMENTS_DISK=s3`
- Session login now, Sanctum tokens for a later mobile app
- Spatie Laravel Permission
- Queued PDF (DomPDF) and Excel (PhpSpreadsheet) documents

## Modules included

1. **Authentication + RBAC + app shell** — login, roles, dashboards stubs  
2. **Administration** — users, roles/permissions, departments, branches, company settings, audit logs  
3. **CRM + Quotations** — companies/contacts/addresses, quote lifecycle, convert to shipment stub  

See:

- `docs/ARCHITECTURE.md`
- `docs/modules/01-authentication-rbac.md`
- `docs/modules/02-administration.md`
- `docs/modules/03-04-crm-quotations.md`

## Local setup

```bash
composer install
cp .env.example .env
php artisan key:generate
# Configure MySQL credentials in .env
php artisan migrate --seed
npm install
npm run build
php artisan serve
php artisan queue:work
```

Redis must be running. Cache, tracking notifications, invoice PDFs, and spreadsheet exports use it. Set `DOCUMENTS_DISK=s3` when air waybills and proof-of-delivery photos should move to S3-compatible storage.

In another terminal (optional for HMR):

```bash
npm run dev
```

## Demo accounts

Password for all: `Password1!`

| Role | Email |
| --- | --- |
| Administrator | admin@globeflight.co.ke |
| Management | management@globeflight.co.ke |
| Sales | sales@globeflight.co.ke |
| Operations | operations@globeflight.co.ke |
| Warehouse | warehouse@globeflight.co.ke |
| Finance | finance@globeflight.co.ke |
| Customer Care | care@globeflight.co.ke |
| Marketing | marketing@globeflight.co.ke |
| Customer | customer@example.com |

## Development approach

Work proceeds **module by module**. Domain modules (CRM, quotations, shipments, etc.) are scaffolded only after architecture/DB design approval for that module.
