# Module 10 — Invoices (Finance)

## Scope

- Create invoices manually or from an approved/converted quotation
- Line items with totals (subtotal, tax, total)
- Status: draft → sent → paid / overdue / cancelled
- Print-friendly invoice page (browser print / PDF via print dialog)
- Company letterhead from Company Settings
- Nav + finance dashboard KPIs

## Permissions (existing)

| Permission | Use |
| --- | --- |
| `invoices.view` | List / show / print |
| `invoices.manage` | Create, edit draft, mark sent/paid/cancel |

## Database

### `invoices`
reference, customer_id, quotation_id?, shipment_id?, status, currency, subtotal, tax_amount, total, issue_date, due_date, paid_at, notes, terms, created_by, timestamps

### `invoice_items`
invoice_id, description, quantity, unit, unit_price, line_total, sort_order
