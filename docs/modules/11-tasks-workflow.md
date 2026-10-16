# Module 11 — Task & Workflow Management

## Scope (v1)

- Create and assign tasks to employees
- Priority, due date, department, status
- Comments thread
- Optional link to quotation / shipment / invoice / support ticket
- “My Tasks” for staff; managers with `tasks.manage` see all
- Create task from related record pages

Attachments deferred to a later iteration.

## Permissions (new)

| Permission | Use |
| --- | --- |
| `tasks.view` | See own assigned / created tasks |
| `tasks.create` | Create tasks and comment |
| `tasks.manage` | View all tasks, reassign, edit any |

## Status flow

```
todo → in_progress → done
                   ↘ cancelled
```

## Database

### `tasks`
reference, title, description, status, priority, due_date, completed_at,
assigned_to, created_by, department_id?,
related_type?, related_id?, timestamps

### `task_comments`
task_id, user_id, body, timestamps
