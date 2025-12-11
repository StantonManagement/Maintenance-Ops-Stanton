# PRP 07: Portfolio & Unit Management

## Goal
Replace mock data in portfolio views and add missing unit detail views.

## Pre-Check
```bash
grep -r "mockPortfolio\|MOCK_EQUIPMENT\|Coming soon" src/components/portfolio/ src/components/units/
```

## Issues to Fix

### 1. Portfolio Stats - Falls back to `mockPortfolios`
**Fix:** Query real data
- Properties from `AF_properties` or similar
- Aggregate work order counts per property
- Calculate occupancy if data available

### 2. Unit Equipment - Uses `MOCK_EQUIPMENT`
**Fix:** 
- Create `unit_equipment` table if not exists
- Query real equipment per unit
- Fields: unit_id, equipment_type, make, model, install_date, warranty_expiration

### 3. Unit History - Shows "Coming soon"
**Fix:** 
- Query `work_order_assignments` and `AF_work_order_new` for unit
- Display list of past work orders
- Show status, date, description

### 4. Inspection Logs - Shows "Coming soon"
**Fix:**
- Create `inspections` table if not exists
- Query inspections for unit
- Fields: unit_id, inspection_type, date, result, notes, inspector

### 5. Tenant History - Shows "Coming soon"
**Fix:**
- Query work orders where `UnitNumber` matches
- Filter by tenant (if tenant data available)
- Show maintenance request history

## Create/Modify Files

### 1. `src/services/portfolioService.ts`
- `getPortfolioStats(): Promise<Portfolio[]>`
- `getPropertyDetails(propertyCode: string): Promise<Property>`

### 2. `src/services/unitService.ts`
- `getUnitEquipment(unitId: string): Promise<Equipment[]>`
- `getUnitWorkOrderHistory(unitId: string): Promise<WorkOrder[]>`
- `getUnitInspections(unitId: string): Promise<Inspection[]>`

### 3. `src/components/units/UnitHistory.tsx`
- Replace "Coming soon" with actual data table
- Columns: Date, Description, Status, Technician

### 4. `src/components/units/EquipmentInventory.tsx`
- Replace MOCK_EQUIPMENT with real query
- Add "Add Equipment" button with modal

### 5. `src/components/units/InspectionLogs.tsx`
- Replace "Coming soon" with inspection list
- Add "Log Inspection" button

## Database Tables Needed
```sql
-- unit_equipment
id, unit_id, equipment_type, make, model, serial_number,
install_date, warranty_expiration, last_service_date, status

-- inspections
id, unit_id, property_code, inspection_type, inspection_date,
result, notes, inspector_name, next_inspection_date
```

## Validation
```bash
npm run build
# Manual: View portfolio, verify real property data
# Manual: View unit detail, verify equipment list
# Manual: Add equipment to unit
# Manual: View unit history tab
```
