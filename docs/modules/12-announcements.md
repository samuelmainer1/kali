# Module 12 — Internal Company Announcements

## Scope

- Company / department / emergency / policy announcements
- Audience: **All employees** (`department_id` null) or **one department**
- All staff (non-customer) can read; managers publish
- Shown on dashboard + header bell (unread badge) + Announcements page
- Optional expiry; urgent notices sorted first
- Mark as read (tracked per user)

## Permissions

| Permission | Use |
| --- | --- |
| *(staff role)* | Any authenticated non-customer can read |
| `announcements.manage` | Create / edit / publish |

## Database

### `announcements`
reference, title, body, type, department_id?, is_urgent, is_published,
published_at, expires_at, created_by, timestamps

### `announcement_reads`
announcement_id, user_id, read_at — unique(announcement_id, user_id)
