# Module 2 — Administration

## Scope

Administrator (and permitted roles) can manage:

- Users (create, edit, activate/deactivate, assign role/department/branch)
- Roles & permissions (view roles, sync permissions)
- Departments (CRUD)
- Branches (CRUD)
- Company settings (singleton update)
- Audit / activity logs (filterable read-only viewer)

## Database

Reuses Module 1 tables — **no new core tables required**:

| Table | Use in Module 2 |
| --- | --- |
| `users` | Staff/customer accounts |
| `departments` | Org units |
| `branches` | Physical locations |
| `company_settings` | Singleton company profile |
| `activity_logs` | Audit trail |
| Spatie `roles` / `permissions` | RBAC |

### Optional indexes (already present or covered)

- `activity_logs.action`, `activity_logs.created_at`, `activity_logs.user_id`

## Permissions used

| Permission | Capability |
| --- | --- |
| `users.view` / `create` / `update` / `delete` | User management |
| `roles.view` / `roles.manage` | Role & permission sync |
| `departments.manage` | Departments CRUD |
| `branches.manage` | Branches CRUD |
| `settings.manage` | Company settings |
| `audit.view` | Activity log viewer |

## Architecture decisions

1. **Thin controllers + Form Requests** — validation isolated; controllers authorize via Spatie `permission:` middleware.
2. **No hard-delete of roles in UI** — system roles are seeded; admins sync permissions only.
3. **Soft disable users** via `is_active` rather than deleting (preserves audit history). Self-deactivation blocked.
4. **Activity logging** on all admin mutations through `ActivityLogService`.
5. **Inertia pages under `Admin/*`** with shared table/filter patterns for later modules.

## Routes (prefix `/admin`)

```
GET|POST         /admin/users
GET|PUT          /admin/users/{user}
PATCH            /admin/users/{user}/toggle-active

GET              /admin/roles
GET|PUT          /admin/roles/{role}

GET|POST         /admin/departments
PUT|DELETE       /admin/departments/{department}

GET|POST         /admin/branches
PUT|DELETE       /admin/branches/{branch}

GET|PUT          /admin/settings

GET              /admin/audit-logs
```

## Out of scope

CRM customers, quotations, shipments, PDF/Excel export of audit logs (later Reports module).
