# PRP: AI Work Order Classification

**Feature:** AI-powered work order intake classification  
**Priority:** High  
**Dependencies:** None  

---

## Problem Statement

Work orders arrive via multiple channels (AppFolio, SMS, phone, portal) with varying detail. Currently using keyword matching for priority. AI can do better classification and extract additional useful info.

---

## What AI Extracts

### 1. Priority Level
- Emergency / High / Medium / Low / Cosmetic
- Reasoning for classification
- Override recommendation if urgent keywords buried in text

### 2. Required Skills
- Primary skill (plumbing, electrical, HVAC, general, etc.)
- Secondary skills if multi-trade
- Certification requirements (licensed electrician, etc.)

### 3. Time Estimate
- Expected duration in hours
- Confidence level
- Factors that might extend time

### 4. Parts Prediction
- Likely parts needed
- Confidence level
- "Bring just in case" items

### 5. Issue Category
- Standardized category for reporting
- Subcategory if applicable

### 6. Special Flags
- Safety concern
- Tenant-caused damage possible
- Recurring issue indicator
- Multi-visit likely

---

## Current State (Keyword-Based)

From `config_rules.json`:
```json
"emergency": {
  "keywords": ["leak", "flooding", "no heat", "sparks", ...]
}
```

**Problem:** "Small drip from faucet" matches "leak" → marked Emergency

**AI Improvement:** Understands context, "small drip" ≠ "flooding"

---

## Data Model

### Modify Table: `AF_work_order_new` (or operational copy)

| New Column | Type | Purpose |
|------------|------|---------|
| `ai_priority` | TEXT | AI-determined priority |
| `ai_priority_confidence` | INTEGER | 0-100 |
| `ai_priority_reasoning` | TEXT | Why this priority |
| `ai_skills_required` | TEXT[] | Array of skills |
| `ai_estimated_hours` | DECIMAL | Time estimate |
| `ai_estimated_hours_confidence` | INTEGER | 0-100 |
| `ai_likely_parts` | JSONB | Parts prediction |
| `ai_category` | TEXT | Standardized category |
| `ai_flags` | JSONB | Special flags object |
| `ai_classified_at` | TIMESTAMPTZ | When analyzed |

### New Table: `work_order_classification_log`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `work_order_id` | TEXT | FK to work order |
| `input_description` | TEXT | Original text |
| `ai_output` | JSONB | Full AI response |
| `coordinator_override` | JSONB | If Kristine changed anything |
| `created_at` | TIMESTAMPTZ | When classified |

---

## AI Prompt Structure

### Input

```
You are classifying a maintenance work order for a residential property.

WORK ORDER:
- Description: "{description}"
- Building: {property_address}
- Unit: {unit}
- Submitted by: {resident_name}
- Submitted via: {channel} (portal/sms/phone/appfolio)
- Submitted at: {created_at}

BUILDING CONTEXT:
- Building age: {building_age} years
- Unit type: {unit_type}
- Section 8: {is_section_8}

TENANT HISTORY (if available):
- Previous requests this year: {request_count}
- Request types: {previous_categories}
```

### Instructions

```
Classify this work order:

1. PRIORITY (emergency/high/medium/low/cosmetic):
   - emergency: Active safety hazard, water damage spreading, no heat/cooling in extreme weather
   - high: Major system down but not immediate danger (HVAC, appliance, plumbing backup)
   - medium: Standard repairs needed within 3 days
   - low: Routine maintenance, can wait a week
   - cosmetic: Appearance only, lowest priority
   
   Consider: Is this urgent because of IMPACT, not just keywords?

2. SKILLS REQUIRED:
   - Primary skill needed
   - Any secondary skills
   - Certification needed? (licensed electrician, HVAC certified, etc.)

3. TIME ESTIMATE:
   - Estimated hours for completion
   - What factors might extend this?

4. LIKELY PARTS:
   - Parts probably needed (high confidence)
   - Parts to bring just in case (medium confidence)

5. CATEGORY:
   Choose one: plumbing | electrical | hvac | appliance | structural | 
   doors_windows | flooring | painting | cleaning | pest | locksmith | other

6. FLAGS:
   - safety_concern: true if any safety issue
   - possible_tenant_damage: true if description suggests tenant caused
   - likely_recurring: true if sounds like ongoing issue
   - multi_visit_likely: true if probably needs diagnosis then return
```

### Expected Output

```json
{
  "priority": "medium",
  "priority_confidence": 88,
  "priority_reasoning": "Faucet drip is not causing damage or safety issue. Can be scheduled within normal timeframe.",
  
  "skills_required": ["plumbing"],
  "certification_required": null,
  
  "estimated_hours": 1.5,
  "estimated_hours_confidence": 75,
  "time_factors": ["May need to replace entire faucet if cartridge unavailable"],
  
  "likely_parts": {
    "high_confidence": ["faucet cartridge", "O-rings"],
    "bring_just_in_case": ["complete faucet assembly"]
  },
  
  "category": "plumbing",
  "subcategory": "faucet",
  
  "flags": {
    "safety_concern": false,
    "possible_tenant_damage": false,
    "likely_recurring": false,
    "multi_visit_likely": false
  }
}
```

---

## Priority Override Logic

AI should upgrade priority if:
- Tenant mentions elderly/disabled resident
- Issue affects multiple units
- Previous failed repair attempts mentioned
- Weather factor (no heat + winter, no AC + heat wave)
- Safety buried in description ("also smells like gas")

AI should downgrade priority if:
- "Small" / "minor" / "occasional" qualifiers
- "When you get a chance" / "not urgent" from tenant
- Cosmetic-only impact

---

## Classification Examples

### Example 1: Keyword Would Overcategorize

**Description:** "Kitchen faucet has a small drip"

**Keyword result:** "leak" → Emergency ❌

**AI result:**
```json
{
  "priority": "low",
  "priority_reasoning": "Small drip indicates minor faucet wear, not active leak causing damage. Routine repair.",
  "estimated_hours": 1.0
}
```

### Example 2: Should Escalate Despite No Keywords

**Description:** "The outlet in the baby's room sparks sometimes when I plug things in"

**Keyword result:** "sparks" → Emergency ✓ (correct but for wrong reason)

**AI result:**
```json
{
  "priority": "emergency",
  "priority_reasoning": "Electrical sparking is fire hazard. Baby's room increases urgency. Needs immediate licensed electrician.",
  "skills_required": ["electrical"],
  "certification_required": "licensed_electrician",
  "flags": {
    "safety_concern": true
  }
}
```

### Example 3: Multi-Trade Detection

**Description:** "Water leaking from ceiling in bathroom, looks like it's coming from unit above"

**AI result:**
```json
{
  "priority": "high",
  "skills_required": ["plumbing", "drywall"],
  "multi_visit_likely": true,
  "time_factors": [
    "Need to access unit above to find source",
    "Ceiling repair after leak fixed"
  ]
}
```

---

## Coordinator Interface

### New Work Order View

```
┌─────────────────────────────────────────────────────────────────┐
│  NEW: WO #1234                                                  │
│  "Kitchen faucet has a small drip"                              │
│  ───────────────────────────────────────────────────────────────│
│                                                                 │
│  AI Classification:                                             │
│                                                                 │
│  Priority:  [LOW ▼]        ← Dropdown to override               │
│  AI says: "Small drip, routine repair, no damage"               │
│                                                                 │
│  Skills:    [Plumbing ▼]                                        │
│  Time Est:  1.5 hours (75% confident)                           │
│                                                                 │
│  Suggested Parts:                                               │
│  • Faucet cartridge                                             │
│  • O-rings                                                      │
│  • ? Faucet assembly (just in case)                             │
│                                                                 │
│  Flags: None                                                    │
│                                                                 │
│  [Accept & Assign]  [Edit Classification]                       │
└─────────────────────────────────────────────────────────────────┘
```

### Override Tracking

When Kristine changes AI classification:
- Log original vs override
- Optional: Reason dropdown (AI wrong / More context / Policy exception)
- Feed back to improve model

---

## Trigger Points

### When to Run Classification

1. **New work order created** (any channel)
2. **Description updated** (before assignment)
3. **On demand** (Kristine clicks "Reclassify")

### When NOT to Reclassify

- Work order already assigned
- Work order in progress or beyond
- Already manually classified by coordinator

---

## Validation Checkpoints

### Checkpoint 1: Data Model
- [ ] New columns added to work orders table
- [ ] Classification log table created
- [ ] Indexes on work_order_id

### Checkpoint 2: AI Integration
- [ ] Prompt returns expected JSON format
- [ ] All fields populated correctly
- [ ] Handles edge cases (empty description, etc.)

### Checkpoint 3: Trigger Flow
- [ ] New WO triggers classification
- [ ] Results stored within 5 seconds
- [ ] UI displays AI classification

### Checkpoint 4: Override Flow
- [ ] Coordinator can change any field
- [ ] Override logged with original
- [ ] Changed values persist

---

## Success Metrics

- Classification time: <5 seconds
- Priority accuracy: >90% match with Kristine's judgment
- Emergency detection: >99% (never miss a real emergency)
- False emergency rate: <5% (don't cry wolf)
- Time estimate accuracy: Within 30% of actual 80% of the time
