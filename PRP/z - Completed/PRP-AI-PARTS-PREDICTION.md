# PRP: AI Parts Prediction

**Feature:** Predict likely parts needed before tech dispatch  
**Priority:** Medium  
**Dependencies:** Work order classification, historical data  

---

## Problem Statement

Techs arrive at jobs without the right parts, causing:
- Return trips (wasted time, frustrated tenants)
- Delayed repairs
- Lower first-time completion rate

AI can predict likely parts from description + history, so techs arrive prepared.

---

## Value Proposition

**Current state:** 
- Tech reads description
- Grabs common parts
- 15-20% need return trip for parts

**With AI prediction:**
- AI suggests likely parts + "just in case" items
- Tech reviews suggestions before dispatch
- Target: <10% return trips for parts

---

## What AI Predicts

### 1. High Confidence Parts
- Almost certainly needed
- Tech should definitely bring

### 2. Medium Confidence Parts
- Probably needed
- Bring if truck has space

### 3. Diagnostic Uncertainty
- Could be multiple causes
- Bring options for each possibility

### 4. Tools/Equipment
- Special tools beyond standard kit
- Access equipment (ladder height, etc.)

---

## Data Sources for Prediction

### From Work Order
- Description keywords
- Issue category
- Fixture/appliance type
- Symptom patterns

### From Unit Profile
- Equipment make/model
- Equipment age
- Previous repairs on same item

### From Historical Data
- What parts used for similar descriptions
- What parts this unit has needed before
- Common parts for this building's fixtures

---

## Data Model

### New Table: `parts_predictions`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `work_order_id` | TEXT | FK to work order |
| `predicted_parts` | JSONB | Parts list with confidence |
| `suggested_tools` | JSONB | Special tools needed |
| `prediction_reasoning` | TEXT | Why these parts |
| `actual_parts_used` | JSONB | Filled after completion |
| `prediction_accuracy` | INTEGER | Score after completion |
| `created_at` | TIMESTAMPTZ | When predicted |

### Predicted Parts Structure

```json
{
  "high_confidence": [
    {
      "part": "Faucet cartridge",
      "part_number": "MOEN-1225",
      "reason": "Most common cause of faucet drip",
      "confidence": 90
    }
  ],
  "medium_confidence": [
    {
      "part": "O-ring kit",
      "reason": "Secondary cause if not cartridge",
      "confidence": 60
    }
  ],
  "if_diagnosis_shows": [
    {
      "condition": "If cartridge housing damaged",
      "part": "Complete faucet assembly",
      "confidence": 30
    }
  ]
}
```

---

## AI Prompt Structure

### Input

```
You are predicting parts needed for a maintenance work order.

WORK ORDER:
- Description: "{description}"
- Category: {category}
- Fixture/Appliance: {fixture_type}

UNIT CONTEXT:
- Building age: {building_age} years
- Unit: {unit}
- Known fixtures: {fixture_list}

EQUIPMENT DETAILS (if available):
- Make: {make}
- Model: {model}
- Age: {age} years

HISTORICAL DATA:
- Similar work orders in system: {similar_count}
- Most common parts for this issue: {common_parts}
- Previous repairs on this unit's {fixture}: {previous_repairs}
```

### Instructions

```
Predict what parts the technician should bring:

1. HIGH CONFIDENCE (>80%):
   - Parts almost certainly needed
   - Based on description + common patterns
   - Include part numbers if identifiable

2. MEDIUM CONFIDENCE (50-80%):
   - Parts probably needed
   - Depends on exact diagnosis
   - Worth bringing if available

3. CONDITIONAL:
   - "If X, then bring Y"
   - Cover multiple diagnostic outcomes

4. SPECIAL TOOLS:
   - Beyond standard tool kit
   - Access equipment needed

5. REASONING:
   - Brief explanation of prediction logic

Consider:
- What breaks most often for this symptom?
- What parts does this specific fixture use?
- What did we use on similar jobs?
```

### Expected Output

```json
{
  "high_confidence": [
    {
      "part": "Toilet flapper",
      "part_number": "Korky 2021BP",
      "reason": "Running toilet most commonly caused by worn flapper",
      "confidence": 85
    },
    {
      "part": "Flapper chain",
      "reason": "Often needs adjustment/replacement with flapper",
      "confidence": 80
    }
  ],
  "medium_confidence": [
    {
      "part": "Fill valve (Fluidmaster 400A)",
      "reason": "Second most common cause of running toilet",
      "confidence": 60
    }
  ],
  "conditional": [
    {
      "condition": "If tank cracked",
      "part": "Toilet tank",
      "note": "Would need to match existing toilet model"
    }
  ],
  "special_tools": [],
  "reasoning": "Running toilet typically caused by flapper (70%), fill valve (20%), or other (10%). Bringing both covers 90% of cases."
}
```

---

## Prediction Examples

### Example 1: Toilet Running

**Description:** "Toilet keeps running, won't stop"

```json
{
  "high_confidence": [
    {"part": "Flapper", "confidence": 85},
    {"part": "Flapper chain", "confidence": 80}
  ],
  "medium_confidence": [
    {"part": "Fill valve", "confidence": 60}
  ],
  "reasoning": "Running toilet: 70% flapper, 20% fill valve"
}
```

### Example 2: No Hot Water

**Description:** "No hot water in apartment"

```json
{
  "high_confidence": [
    {"part": "Thermocouple", "confidence": 75},
    {"part": "Pilot assembly", "confidence": 70}
  ],
  "medium_confidence": [
    {"part": "Gas control valve", "confidence": 45}
  ],
  "conditional": [
    {
      "condition": "If water heater >10 years old",
      "part": "May need full replacement",
      "note": "Verify age before dispatch"
    }
  ],
  "special_tools": [
    "Multimeter for element testing"
  ],
  "reasoning": "Gas water heater no-heat usually pilot/thermocouple. Electric usually element/thermostat."
}
```

### Example 3: Garbage Disposal Jammed

**Description:** "Garbage disposal won't turn on, just hums"

```json
{
  "high_confidence": [
    {"part": "Allen wrench (1/4\")", "confidence": 95, "note": "For manual rotation"},
    {"part": "Reset button check", "confidence": 90, "note": "No part needed"}
  ],
  "medium_confidence": [
    {"part": "Garbage disposal unit", "confidence": 40, "note": "If motor burned out"}
  ],
  "reasoning": "Humming disposal usually just jammed - 80% fixed with allen wrench rotation. If motor burned, needs replacement."
}
```

---

## Technician Interface

### Pre-Dispatch Parts Check

```
┌─────────────────────────────────────────────────────────────────┐
│  WO #1234 - Toilet Running                                      │
│  Building A, Unit 205                                           │
│  ───────────────────────────────────────────────────────────────│
│                                                                 │
│  Suggested Parts:                                               │
│                                                                 │
│  BRING THESE: (High Confidence)                                 │
│  ☑ Toilet flapper (Korky 2021BP)                               │
│  ☑ Flapper chain                                                │
│                                                                 │
│  CONSIDER BRINGING: (Medium Confidence)                         │
│  ☐ Fill valve (Fluidmaster 400A)                               │
│                                                                 │
│  IF NEEDED:                                                     │
│  • If tank cracked → Will need to order tank                    │
│                                                                 │
│  [Confirm Parts Loaded]  [Add Custom Part]                      │
└─────────────────────────────────────────────────────────────────┘
```

### Post-Completion Feedback

After job:
- What parts were actually used?
- Were predicted parts correct?
- What was missing from prediction?

This feedback improves future predictions.

---

## Accuracy Tracking

### After Each Job

Compare:
- Predicted high confidence vs actually used
- Were medium confidence parts needed?
- Any parts needed that weren't predicted?

### Scoring

```
Prediction Accuracy = 
  (Predicted & Used) / (Predicted + Used - Overlap)
```

Target: >80% accuracy on high confidence predictions

---

## Inventory Integration (Future)

### With Truck Inventory System

- Check if predicted parts in tech's truck
- If not, flag for stock before dispatch
- Track which parts running low

### With Warehouse

- Trigger reorder for commonly needed parts
- Pre-stage parts for scheduled work
- Route tech to pick up if needed

---

## Validation Checkpoints

### Checkpoint 1: Data Model
- [ ] `parts_predictions` table created
- [ ] Links to work orders
- [ ] Actual parts field for feedback

### Checkpoint 2: AI Integration
- [ ] Prompt returns structured parts list
- [ ] Handles unknown fixtures gracefully
- [ ] Historical data incorporated when available

### Checkpoint 3: UI Display
- [ ] Parts show on work order detail
- [ ] Tech can check off parts loaded
- [ ] Add custom parts option

### Checkpoint 4: Feedback Loop
- [ ] Actual parts captured at completion
- [ ] Accuracy calculated
- [ ] Low-accuracy predictions flagged

---

## Success Metrics

- High confidence accuracy: >80% actually needed
- Parts return trips: Reduce from 15-20% to <10%
- First-time completion: Improve by 5-10%
- Tech satisfaction: Parts suggestions helpful >80% of time
