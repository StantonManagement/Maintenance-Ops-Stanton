# PRP Index - Maintenance Operations Center

## Summary
- **Original PRPs**: 1-25 (Foundation through Enterprise)
- **Wiring PRPs**: 26-32 (Connect UI shells to real data)
- **Total**: 32 PRPs

---

## Wiring PRPs (Run These Next)

These PRPs connect existing UI shells to real Supabase data:

| PRP | Feature | Current State | Wires To |
|-----|---------|---------------|----------|
| 26 | Voice Queue | Mock data, no persistence | work_orders table |
| 27 | Vendor Management | Mock data, "Add" disabled | vendors + vendor_requests tables |
| 28 | Preventive Maintenance | Mock, WOs don't persist | work_orders + preventive_schedules |
| 29 | Tenant Portal | Requests don't persist | work_orders from public portal |
| 30 | IoT Sensors | Mock sensors, no alerts | sensors + auto work orders |
| 31 | Rules Engine | UI only, rules don't fire | business_rules + triggers |
| 32 | Portfolio Dashboard | Mock hierarchy, filters broken | portfolios + real stats |

### Recommended Order
```
PRP-26 (Voice Queue)     → Quick win, creates WOs
PRP-29 (Tenant Portal)   → Creates WOs from public
PRP-28 (Preventive)      → Creates WOs from schedules
PRP-27 (Vendor)          → Standalone, no WO creation
PRP-30 (IoT Sensors)     → Creates emergency WOs
PRP-31 (Rules Engine)    → Fires on WO events
PRP-32 (Portfolio)       → Reads existing data
```

---

## Original PRPs Reference

### Phase 1: Communication Core
| PRP | Feature | Status |
|-----|---------|--------|
| 01 | Foundation & Data Layer | ✅ Complete |
| 02 | Layout & Navigation | ✅ Complete |
| 03 | Work Order List | ✅ Complete |
| 04 | Work Order Detail | ✅ Complete |
| 05 | Messages UI | ✅ Complete |
| 06 | Approvals Queue | ✅ Complete |

### Phase 2: Intelligence
| PRP | Feature | Status |
|-----|---------|--------|
| 07 | Calendar & Scheduling | ✅ Complete |
| 08 | Real-Time Updates | ✅ Complete |
| 09 | Technician Dispatch | ✅ Complete |
| 10 | Automated Communications | ✅ UI Complete |
| 11 | Workload Protection | ✅ Complete |
| 16 | Voice Work Orders | ⚠️ UI Only → PRP-26 |
| 17 | Vendor Management | ⚠️ UI Only → PRP-27 |
| 18 | Mobile Tech App | ✅ UI Complete |
| 19 | GPS Location | ⚠️ Mock data |
| 21 | Settings | ✅ UI Complete |

### Phase 3: Enterprise
| PRP | Feature | Status |
|-----|---------|--------|
| 12 | Analytics | ✅ UI Complete |
| 13 | Financial Intelligence | ⚠️ UI Only |
| 14 | Unit/Tenant Profiles | ⚠️ UI Only |
| 15 | AI Suggestions | ⚠️ UI Only |
| 20 | Preventive Maintenance | ⚠️ UI Only → PRP-28 |
| 22 | Rules Engine | ⚠️ UI Only → PRP-31 |
| 23 | Portfolio Dashboard | ⚠️ UI Only → PRP-32 |
| 24 | Tenant Portal | ⚠️ UI Only → PRP-29 |
| 25 | IoT Sensors | ⚠️ UI Only → PRP-30 |

---

## Database Tables Summary

### Already Created (Phase 1)
- work_orders
- messages  
- technicians
- approvals
- (AF_ tables - read only)

### Need to Create (Wiring PRPs)

**PRP-26 Voice:**
- voice_submissions

**PRP-27 Vendors:**
- vendors
- vendor_requests
- vendor_responses

**PRP-28 Preventive:**
- preventive_schedules
- preventive_work_orders

**PRP-29 Tenant Portal:**
- tenant_portal_sessions
- tenant_portal_requests

**PRP-30 IoT:**
- sensors
- sensor_readings
- sensor_alerts

**PRP-31 Rules:**
- business_rules
- rule_executions
- rule_versions

**PRP-32 Portfolio:**
- portfolios
- regions
- property_portfolio_mapping

---

## Key Data Flow Connections

```
                    ┌─────────────────┐
                    │   work_orders   │
                    └────────▲────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────┴───────┐  ┌─────────┴────────┐  ┌───────┴───────┐
│ Voice Queue   │  │ Tenant Portal    │  │ Preventive    │
│ (PRP-26)      │  │ (PRP-29)         │  │ Maint (PRP-28)│
└───────────────┘  └──────────────────┘  └───────────────┘

┌───────────────┐                        ┌───────────────┐
│ IoT Sensors   │──── creates ───────────│ Emergency WO  │
│ (PRP-30)      │                        └───────────────┘
└───────────────┘

┌───────────────┐                        ┌───────────────┐
│ Rules Engine  │──── modifies ──────────│ WO fields     │
│ (PRP-31)      │                        │ (priority,etc)│
└───────────────┘                        └───────────────┘
```

---

## Quick Start Commands

### Create All Tables
Run migrations in order:
```bash
# Core tables (if not done)
supabase migration new 001_core_tables

# Wiring tables
supabase migration new 002_voice_submissions
supabase migration new 003_vendors
supabase migration new 004_preventive
supabase migration new 005_tenant_portal
supabase migration new 006_sensors
supabase migration new 007_rules
supabase migration new 008_portfolios

supabase db push
```

### Seed Test Data
```bash
psql $DATABASE_URL -f seeds/voice_submissions.sql
psql $DATABASE_URL -f seeds/vendors.sql
# etc.
```

---

## Files by PRP

### PRP-26 (Voice)
- src/hooks/useVoiceQueue.ts (modify)
- src/components/voice/VoiceWorkOrderDraft.tsx (modify)
- supabase/functions/voice-webhook/index.ts (create)

### PRP-27 (Vendors)
- src/hooks/useVendors.ts (modify)
- src/hooks/useVendorRequests.ts (create)
- src/components/vendors/AddVendorModal.tsx (create)
- src/components/vendors/VendorDirectory.tsx (modify)

### PRP-28 (Preventive)
- src/hooks/usePreventiveSchedules.ts (modify)
- src/components/preventive/NewScheduleModal.tsx (create)
- src/components/preventive/ScheduleList.tsx (modify)

### PRP-29 (Tenant Portal)
- src/hooks/useTenantPortal.ts (create)
- src/pages/TenantPortalPage.tsx (modify)

### PRP-30 (Sensors)
- src/hooks/useSensors.ts (create)
- src/components/sensors/ThresholdConfigModal.tsx (create)
- supabase/functions/sensor-data/index.ts (create)

### PRP-31 (Rules)
- src/hooks/useRules.ts (modify)
- src/components/rules/RuleEditorModal.tsx (create)
- src/components/rules/ConditionBuilder.tsx (create)
- src/components/rules/ActionBuilder.tsx (create)

### PRP-32 (Portfolio)
- src/hooks/usePortfolio.ts (create)
- src/pages/PortfolioDashboardPage.tsx (modify)
- src/pages/WorkOrdersPage.tsx (modify for filters)
