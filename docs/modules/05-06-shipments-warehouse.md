# Modules 5 + 6 — Shipments & Warehouse (combined)

## Scope

### Shipments
- List / filter / view shipments
- Create shipment manually (or from quotation convert — already exists)
- Advance status through lifecycle with history trail
- Track origin/destination, service type, branch, weight/pieces

### Warehouse
- Inventory lots (on-hand cargo)
- Cargo movements (inbound / outbound / adjustment)
- Link movements to shipments and branches
- Dashboard: inventory counts + warehouse-stage shipments

## Lifecycle

```
created → cargo_collected → warehouse → booked → departed
→ arrived → customs_clearance → out_for_delivery → delivered
```

Only forward transitions allowed (no skipping backwards). Each change writes `shipment_status_histories`.

## Database

### Alter `shipments`
| Column | Type |
| --- | --- |
| branch_id | FK nullable → branches |
| current_location | string nullable |
| pieces | unsigned int default 1 |
| weight_kg | decimal nullable |
| tracking_number | string nullable unique |
| expected_departure / expected_arrival | date nullable |
| delivered_at | timestamp nullable |

### `shipment_status_histories`
| Column | Type |
| --- | --- |
| id | PK |
| shipment_id | FK |
| from_status | string nullable |
| to_status | string |
| notes | text nullable |
| changed_by | FK users nullable |
| created_at | timestamp |

### `inventory_items`
| Column | Type |
| --- | --- |
| id | PK |
| sku | string unique |
| name | string |
| description | text nullable |
| quantity_on_hand | decimal |
| unit | string default pcs |
| branch_id | FK nullable |
| shipment_id | FK nullable |
| location_code | string nullable |
| status | available\|held\|dispatched |
| timestamps | |

### `cargo_movements`
| Column | Type |
| --- | --- |
| id | PK |
| type | inbound\|outbound\|adjustment |
| inventory_item_id | FK nullable |
| shipment_id | FK nullable |
| branch_id | FK nullable |
| quantity | decimal |
| reference | string nullable |
| notes | text nullable |
| performed_by | FK users |
| moved_at | timestamp |
| timestamps | |

## Permissions
Existing: `shipments.view|create|update|track`, `warehouse.view|manage`
