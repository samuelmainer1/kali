# Modules 3 + 4 — CRM & Quotations (combined)

## Scope

### CRM
- Companies (customers)
- Contacts
- Addresses
- Assigned salesperson
- Customer status (`lead`, `active`, `inactive`, `blocked`)

### Quotations
- Create / edit quotation with line items
- Submit for approval
- Approve / reject (management/admin)
- Convert **approved** quotation into a shipment record (minimal shipment stub; full lifecycle in Module 5)

## Database design

### `customers`
| Column | Type | Notes |
| --- | --- | --- |
| id | bigint PK | |
| name | string | Legal/company name |
| trading_name | string nullable | |
| email | string nullable | |
| phone | string nullable | |
| website | string nullable | |
| country | string default Kenya | |
| tax_number | string nullable | |
| status | string | lead\|active\|inactive\|blocked |
| assigned_salesperson_id | FK users nullable | |
| notes | text nullable | |
| timestamps | | |

### `customer_contacts`
| Column | Type |
| --- | --- |
| id | bigint PK |
| customer_id | FK |
| name | string |
| email | string nullable |
| phone | string nullable |
| job_title | string nullable |
| is_primary | boolean |

### `customer_addresses`
| Column | Type |
| --- | --- |
| id | bigint PK |
| customer_id | FK |
| label | string | billing\|shipping\|other |
| line1 | string |
| line2 | string nullable |
| city | string nullable |
| state | string nullable |
| postal_code | string nullable |
| country | string |
| is_default | boolean |

### `quotations`
| Column | Type | Notes |
| --- | --- | --- |
| id | bigint PK | |
| reference | string unique | e.g. QT-2026-0001 |
| customer_id | FK | |
| contact_id | FK nullable | |
| created_by | FK users | |
| status | string | draft\|pending_approval\|approved\|rejected\|converted\|cancelled |
| valid_until | date nullable | |
| currency | char(3) | KES |
| subtotal | decimal(15,2) | |
| tax_amount | decimal(15,2) | |
| total | decimal(15,2) | |
| origin_country | string nullable | |
| destination_country | string nullable | |
| service_type | string nullable | air\|sea\|road\|express\|other |
| notes | text nullable | |
| terms | text nullable | |
| approved_by / approved_at | nullable | |
| rejected_by / rejected_at / rejection_reason | nullable | |
| converted_shipment_id | FK nullable | |
| timestamps | | |

### `quotation_items`
| Column | Type |
| --- | --- |
| id | bigint PK |
| quotation_id | FK |
| description | string |
| quantity | decimal(12,2) |
| unit | string nullable |
| unit_price | decimal(15,2) |
| line_total | decimal(15,2) |
| weight_kg | decimal(12,2) nullable |
| sort_order | unsigned int |

### `shipments` (stub for convert)
| Column | Type | Notes |
| --- | --- | --- |
| id | bigint PK | |
| reference | string unique | SH-2026-0001 |
| quotation_id | FK nullable | |
| customer_id | FK | |
| status | string | starts at `created` |
| origin_country / destination_country | nullable | |
| service_type | nullable | |
| created_by | FK users | |
| notes | text nullable | |
| timestamps | | |

Full shipment lifecycle UI lands in Module 5.

## Status flows

```
Quotation: draft → pending_approval → approved → converted
                              ↘ rejected
```

Convert only when `approved`. Creates shipment with status `created`.

## Permissions (existing)
`customers.*`, `quotations.view|create|update|approve|reject|convert`, `shipments.view|create`
