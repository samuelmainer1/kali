# Globeflight Portal

Integrated Logistics Management System (ILMS) for **Globeflight Kenya**.

## Stack

- Laravel 13 + Inertia.js + React 18
- Tailwind CSS + Lucide Icons + ApexCharts
- MySQL / MariaDB
- Spatie Laravel Permission (RBAC)
- Laravel Breeze / Sanctum session auth

## Module 1 (this release)

Authentication, role-based access, branded app shell (sidebar, light/dark), and role-aware dashboard stubs.

See:

- `docs/ARCHITECTURE.md`
- `docs/modules/01-authentication-rbac.md`

## Local setup

```bash
composer install
cp .env.example .env
php artisan key:generate
# Configure MySQL credentials in .env
php artisan migrate --seed
npm install --legacy-peer-deps
npm run build
php artisan serve
```

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
