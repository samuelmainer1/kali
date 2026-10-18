# Module 1 — Authentication, RBAC & App Foundation

## Scope

- Login / logout / forgot & reset password / change password / profile
- Role-based access (9 roles)
- Departments & branches (foundation for admin module)
- Activity logs (auth events)
- Company settings (singleton foundation)
- Role-aware dashboards (KPI placeholders)
- Enterprise app shell: sidebar, topbar, light/dark mode, toasts

## Database design

### `departments`

| Column | Type | Notes |
| --- | --- | --- |
| id | bigint PK | |
| name | string unique | e.g. Sales, Operations |
| code | string(20) unique | e.g. SAL, OPS |
| description | text nullable | |
| is_active | boolean default true | |
| timestamps | | |

### `branches`

| Column | Type | Notes |
| --- | --- | --- |
| id | bigint PK | |
| name | string | |
| code | string(20) unique | |
| city | string nullable | |
| country | string default Kenya | |
| phone | string nullable | |
| email | string nullable | |
| address | text nullable | |
| is_active | boolean default true | |
| timestamps | | |

### `users` (extensions)

| Column | Type | Notes |
| --- | --- | --- |
| phone | string nullable | |
| employee_code | string nullable unique | Internal staff ID |
| department_id | FK nullable → departments | |
| branch_id | FK nullable → branches | |
| is_active | boolean default true | Soft disable without delete |
| last_login_at | timestamp nullable | |
| avatar_path | string nullable | Future uploads |

Spatie tables: `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`.

### `activity_logs`

| Column | Type | Notes |
| --- | --- | --- |
| id | bigint PK | |
| user_id | FK nullable | Actor |
| action | string | e.g. auth.login |
| subject_type | string nullable | Morph class |
| subject_id | bigint nullable | Morph id |
| description | text | Human-readable |
| properties | json nullable | Extra context |
| ip_address | string(45) nullable | |
| user_agent | text nullable | |
| timestamps | | created_at primary interest |

### `company_settings`

| Column | Type | Notes |
| --- | --- | --- |
| id | bigint PK | Single-row intended |
| company_name | string | Globeflight Kenya |
| trading_name | string nullable | |
| email | string nullable | |
| phone | string nullable | |
| website | string nullable | |
| address | text nullable | |
| logo_path | string nullable | |
| timezone | string default Africa/Nairobi | |
| currency | string(3) default KES | |
| meta | json nullable | Extensible |
| timestamps | | |

## Seeded demo accounts

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

## Out of scope (later modules)

User CRUD UI, full audit viewer, CRM, shipments, real KPI metrics.
