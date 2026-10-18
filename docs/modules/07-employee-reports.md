# Module 7 — Employee Reports (weekly / monthly)

## Scope

- Employees create **weekly** or **monthly** work reports
- Save as draft, then submit for review
- Management reviews: approve, reject, or request revision
- Authors can edit drafts / revision-requested reports and resubmit
- List/filter by period type, status, author, department
- Dashboard KPIs (pending review, my drafts, submitted this week)

Anyone who can open a report can queue its PDF. Users with `reports.export` can queue the spreadsheet of every report.

## Permissions (existing)

| Permission | Use |
| --- | --- |
| `reports.weekly.submit` | Create, edit own drafts, submit / resubmit |
| `reports.weekly.review` | Approve / reject / request revision |
| `reports.view_all` | View all employees' reports |
| `reports.export` | Reserved for later export module |

Authors without `view_all` only see their own reports. Reviewers/managers see the full queue.

## Status flow

```
draft → submitted → approved
                 ↘ rejected
                 ↘ revision_requested → draft (edit) → submitted
```

## Database

### `employee_reports`

| Column | Type |
| --- | --- |
| id | PK |
| reference | string unique (e.g. WR-2026-0001 / MR-2026-0001) |
| user_id | FK → users (author) |
| department_id | FK nullable → departments |
| branch_id | FK nullable → branches |
| period_type | weekly \| monthly |
| period_start | date |
| period_end | date |
| title | string |
| accomplishments | text |
| challenges | text nullable |
| next_plans | text nullable |
| metrics | json nullable (optional KPI map) |
| status | draft \| submitted \| approved \| rejected \| revision_requested |
| submitted_at | timestamp nullable |
| reviewed_by | FK nullable → users |
| reviewed_at | timestamp nullable |
| reviewer_notes | text nullable |
| timestamps | |

Unique: `(user_id, period_type, period_start)` — one report per person per period.

## UI

- `/reports` — index (mine vs all)
- `/reports/create` — new report (auto-fills period dates)
- `/reports/{id}` — show + review actions
- `/reports/{id}/edit` — edit draft / revision-requested
