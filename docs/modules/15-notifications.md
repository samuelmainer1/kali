# Module 15 — Notifications

## Scope (v1)

In-app notification bell + email alerts for:

- Quotation submitted for approval → users with `quotations.approve`
- Shipment status changed → shipment creator + customer salesperson
- Purchase request submitted → users with `procurement.approve`
- Invoice overdue → finance (`invoices.manage`) + invoice creator

WhatsApp/SMS channels remain stubbed for later.

## UI

- Header **Notifications** bell (separate from Announcements bell)
- Notifications index page
- Mark one / mark all as read

## Ops

```bash
php artisan invoices:flag-overdue
```

Scheduled daily at 08:00 when the scheduler is running.
