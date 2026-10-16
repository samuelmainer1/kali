# Modules 8 + 9 — Support & Marketing (combined)

## Scope

### Support (Customer Care)
- Support tickets with priority, category, status
- Optional link to customer / shipment
- Threaded replies (public + internal staff notes)
- Assign to care agents; resolve / close
- Customers see and update **their own** tickets; staff with `support.manage` see all

### Marketing
- Campaigns (channel, schedule, status, budget, message)
- Leads pipeline (new → contacted → qualified → converted / lost)
- Optional link lead → campaign and/or CRM customer
- Dashboard KPIs for open tickets and active campaigns / new leads

## Permissions (existing)

| Permission | Use |
| --- | --- |
| `support.view` | List/show (scoped), create ticket, public reply |
| `support.manage` | View all, assign, status changes, internal notes |
| `marketing.view` | View campaigns and leads |
| `marketing.manage` | Create/update campaigns and leads |

## Support status flow

```
open → in_progress → waiting_customer → resolved → closed
                  ↘ resolved
```

## Database

### `support_tickets`
| Column | Type |
| --- | --- |
| id | PK |
| reference | string unique (TK-YYYY-####) |
| subject | string |
| description | text |
| status | open\|in_progress\|waiting_customer\|resolved\|closed |
| priority | low\|medium\|high\|urgent |
| category | general\|shipment\|billing\|quotation\|other |
| requester_id | FK → users |
| customer_id | FK nullable → customers |
| shipment_id | FK nullable → shipments |
| assigned_to | FK nullable → users |
| resolved_at / closed_at | timestamp nullable |
| timestamps | |

### `support_ticket_replies`
| Column | Type |
| --- | --- |
| id | PK |
| support_ticket_id | FK |
| user_id | FK → users |
| body | text |
| is_internal | boolean default false |
| timestamps | |

### `marketing_campaigns`
| Column | Type |
| --- | --- |
| id | PK |
| reference | string unique (MC-YYYY-####) |
| name | string |
| channel | email\|whatsapp\|sms\|social\|event\|other |
| status | draft\|scheduled\|active\|completed\|cancelled |
| audience | text nullable |
| content | text nullable |
| budget | decimal nullable |
| currency | string(3) default KES |
| start_date / end_date | date nullable |
| metrics | json nullable |
| notes | text nullable |
| created_by | FK → users |
| timestamps | |

### `marketing_leads`
| Column | Type |
| --- | --- |
| id | PK |
| name | string |
| email / phone | string nullable |
| company | string nullable |
| source | string nullable |
| status | new\|contacted\|qualified\|converted\|lost |
| campaign_id | FK nullable → marketing_campaigns |
| customer_id | FK nullable → customers |
| assigned_to | FK nullable → users |
| notes | text nullable |
| timestamps | |
