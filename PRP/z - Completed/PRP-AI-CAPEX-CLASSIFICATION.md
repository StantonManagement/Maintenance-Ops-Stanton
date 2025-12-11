# PRP: AI CapEx vs Maintenance Classification

**Feature:** AI-powered financial categorization for work orders  
**Priority:** Medium  
**Dependencies:** Work order completion data  

---

## Problem Statement

Every completed work order needs financial categorization:
- **CapEx** (capital expenditure) - below the line, affects property value
- **Maintenance** - hits NOI, operating expense

Currently manual or inconsistent. Need defensible, auditable decisions.

---

## Core Rule (from Business Rules)

**Longevity-Based Classification:**
> If the result will last >1 year, it's CapEx

NOT dollar-based. A $50 P-trap replacement is CapEx. A $500 emergency drain clearing is Maintenance.

---

## What AI Evaluates

### 1. Work Type Analysis
- Replacement vs Repair vs Service
- Full replacement = likely CapEx
- Repair/service = likely Maintenance

### 2. Longevity Prediction
- Expected lifespan of work performed
- Based on item type and industry standards

### 3. Description Keywords
- "Replace" / "Install new" / "New" → CapEx signals
- "Fix" / "Repair" / "Clear" / "Unclog" → Maintenance signals

### 4. Parts Used
- New fixtures/equipment = CapEx
- Consumables/repairs = Maintenance

---

## Standard Lifespans (Reference)

| Item | Expected Life | Category |
|------|---------------|----------|
| Toilet | 10-15 years | CapEx |
| Faucet | 10-15 years | CapEx |
| P-trap | 10-15 years | CapEx |
| Water heater | 10-12 years | CapEx |
| HVAC system | 15-20 years | CapEx |
| Windows | 20+ years | CapEx |
| Doors | 20+ years | CapEx |
| Drain clearing | N/A (service) | Maintenance |
| Caulking | 2-5 years | Maintenance |
| Filters | <1 year | Maintenance |
| Paint touch-up | 1-3 years | Maintenance |

---

## Data Model

### Modify: Work Order or Completion Record

| New Column | Type | Purpose |
|------------|------|---------|
| `financial_category` | TEXT | capex / maintenance |
| `ai_financial_confidence` | INTEGER | 0-100 |
| `ai_financial_reasoning` | TEXT | Explanation |
| `ai_estimated_lifespan_years` | DECIMAL | Predicted longevity |
| `financial_override_by` | UUID | If manually changed |
| `financial_override_reason` | TEXT | Why overridden |

### New Table: `capex_items`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `work_order_id` | TEXT | FK to work order |
| `item_description` | TEXT | What was installed |
| `item_category` | TEXT | fixture / appliance / system / structural |
| `estimated_lifespan_years` | INTEGER | Expected life |
| `installed_date` | DATE | Put in service |
| `warranty_expires` | DATE | If applicable |
| `cost` | DECIMAL | Item cost |
| `unit_id` | TEXT | For unit profile |

---

## AI Prompt Structure

### Input

```
You are categorizing a completed maintenance work order for financial reporting.

WORK ORDER:
- Description: "{description}"
- Technician notes: "{tech_notes}"
- Parts used: {parts_list}
- Total cost: ${total_cost}

CLASSIFICATION RULE:
- CapEx: Work where the result will last MORE than 1 year
- Maintenance: Services, repairs, or work lasting LESS than 1 year

This is LONGEVITY-based, not cost-based.
```

### Instructions

```
Analyze this work order and determine:

1. CATEGORY: "capex" or "maintenance"

2. CONFIDENCE: 0-100

3. REASONING: Explain in 1-2 sentences why this classification

4. WORK TYPE: "replacement" | "repair" | "service" | "installation"

5. ESTIMATED LIFESPAN: 
   - If CapEx: How many years should this last?
   - If Maintenance: N/A

6. CAPEX ITEMS (if applicable):
   - List any items that should be tracked as capital assets
   - Include estimated lifespan for each

Reminder: 
- Replacing a $30 P-trap = CapEx (will last 10+ years)
- Clearing a drain for $200 = Maintenance (service, not permanent)
```

### Expected Output

```json
{
  "category": "capex",
  "confidence": 95,
  "reasoning": "Toilet replacement is a fixture that will last 10-15 years, meeting CapEx longevity threshold.",
  "work_type": "replacement",
  "estimated_lifespan_years": 12,
  "capex_items": [
    {
      "description": "Toilet - American Standard",
      "category": "fixture",
      "lifespan_years": 12,
      "cost": 185
    }
  ]
}
```

---

## Classification Examples

### Example 1: Clear CapEx

**Description:** "Replace kitchen faucet"  
**Parts:** Moen kitchen faucet - $145

```json
{
  "category": "capex",
  "confidence": 98,
  "reasoning": "Faucet replacement will last 10-15 years.",
  "work_type": "replacement",
  "estimated_lifespan_years": 12
}
```

### Example 2: Clear Maintenance

**Description:** "Clear clogged kitchen drain"  
**Parts:** None

```json
{
  "category": "maintenance",
  "confidence": 98,
  "reasoning": "Drain clearing is a service with no permanent component installed.",
  "work_type": "service",
  "estimated_lifespan_years": null
}
```

### Example 3: Mixed Work Order

**Description:** "Fix bathroom - replaced toilet fill valve and cleared slow drain"  
**Parts:** Fluidmaster fill valve - $12

```json
{
  "category": "maintenance",
  "confidence": 75,
  "reasoning": "Fill valve is a repair part with 3-5 year life, below CapEx threshold. Drain clearing is service.",
  "work_type": "repair",
  "estimated_lifespan_years": 4,
  "note": "If entire toilet was replaced, would be CapEx. Fill valve alone is repair."
}
```

### Example 4: Edge Case - Paint

**Description:** "Paint entire unit - turnover"  
**Parts:** Paint, supplies - $450

```json
{
  "category": "maintenance",
  "confidence": 70,
  "reasoning": "Full unit paint typically lasts 3-5 years between turnovers, below CapEx threshold. However, some organizations capitalize turnover paint.",
  "work_type": "service",
  "note": "Policy decision - some treat turnover paint as CapEx. Flagging for review."
}
```

---

## Coordinator Interface

### Completion Review Addition

```
┌─────────────────────────────────────────────────────────────────┐
│  Financial Classification                                       │
│  ───────────────────────────────────────────────────────────────│
│                                                                 │
│  AI Recommendation: [CAPEX]         Confidence: 95%             │
│                                                                 │
│  "Toilet replacement will last 10-15 years, meeting CapEx       │
│   longevity threshold."                                         │
│                                                                 │
│  Item for Asset Tracking:                                       │
│  • Toilet (American Standard) - 12 year expected life           │
│                                                                 │
│  Category: [CapEx ▼]  ← Override dropdown                       │
│                                                                 │
│  [Confirm Classification]                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Bulk Classification (Month-End)

For work orders not yet classified:
- List view with AI recommendations
- Bulk approve matching recommendations
- Flag low-confidence for individual review

---

## Trigger Points

### When to Classify

1. **Work order marked complete** - After coordinator approves
2. **Parts entered** - Reclassify if parts list changes
3. **On demand** - Manual reclassification request
4. **Bulk** - Month-end batch for any missing

---

## Unit Profile Integration

When CapEx item identified:
- Add to `capex_items` table
- Link to unit profile
- Set warranty tracking if applicable
- Enable lifecycle reporting

---

## Validation Checkpoints

### Checkpoint 1: Data Model
- [ ] Financial columns added to work orders
- [ ] `capex_items` table created
- [ ] Links to unit profile

### Checkpoint 2: AI Integration
- [ ] Prompt returns expected format
- [ ] Handles parts list parsing
- [ ] Edge cases handled gracefully

### Checkpoint 3: UI Display
- [ ] Classification shows in approval flow
- [ ] Override option available
- [ ] CapEx items display for tracking

### Checkpoint 4: Reporting
- [ ] CapEx vs Maintenance totals accurate
- [ ] By-property breakdown available
- [ ] Audit trail complete

---

## Success Metrics

- Classification accuracy: >90% match with accountant review
- Audit defensibility: Every decision has documented reasoning
- Time savings: <5 seconds vs manual lookup
- CapEx tracking: 100% of replacements logged to unit profile
