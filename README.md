# Globeflight Portal

Integrated Logistics Management System (ILMS) for **Globeflight Kenya**.

## Stack

- PHP 8.3+ and Laravel 13 + Inertia.js + React 18
- Tailwind CSS + Lucide Icons + ApexCharts
- MySQL / MariaDB for the database, sessions, cache, and queues
- Predis, ready for Redis when the app moves to a VPS
- Local private document storage, with an S3 disk ready for a later bucket
- DomPDF and PhpSpreadsheet for PDF and Excel downloads
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

## Shared hosting

Yes. This release is set up for shared hosting, then a VPS later.

On the host:

1. Point the site's document root at the `public` folder. If the panel cannot do that, the root `.htaccess` forwards requests into `public`.
2. PHP 8.3 or newer, with `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `gd`, `mbstring`, `openssl`, `pdo_mysql`, `tokenizer`, `xml`, and `zip`.
3. Create a MySQL database and put its name, user, and password in `.env`.
4. Run `composer install --no-dev`, `php artisan key:generate`, `php artisan migrate --seed`, and `php artisan storage:link`.
5. Build the frontend on a computer that has Node (`npm install --legacy-peer-deps` and `npm run build`) and upload the `public/build` folder. Shared hosting does not need Node.
6. Make `storage` and `bootstrap/cache` writable.
7. Add a cron job that runs every minute: `php /home/USER/path/to/artisan schedule:run`. That cron drains queued work. There is no long-running queue process to keep alive.

Leave these `.env` values as they are on shared hosting:

```
CACHE_STORE=database
QUEUE_CONNECTION=database
DOCUMENTS_DISK=documents
REDIS_CLIENT=predis
```

When you move to a VPS that has Redis and a file bucket, change `CACHE_STORE` and `QUEUE_CONNECTION` to `redis`, and `DOCUMENTS_DISK` to `s3` after filling in the `AWS_*` values.

## Development approach

Work proceeds **module by module**. Domain modules (CRM, quotations, shipments, etc.) are scaffolded only after architecture/DB design approval for that module.
