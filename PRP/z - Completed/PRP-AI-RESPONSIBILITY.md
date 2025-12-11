# PRP: AI Tenant vs Owner Responsibility

**Feature:** AI-powered responsibility determination for billing  
**Priority:** Medium  
**Dependencies:** Unit profile data, photo analysis  

---

## Problem Statement

When work is completed, someone has to pay. Need to determine:
- **Owner responsibility** - Normal wear, building issues, equipment age
- **Tenant responsibility** - Damage, negligence, unauthorized modifications

Currently inconsistent and causes billing disputes. Need defensible decisions with evidence.

---

## Decision Framework

### Owner Responsible When:

| Condition | Example |
|-----------|---------|
| Equipment age > warranty | 15-year-old water heater fails |
| Normal wear and tear | Faucet washer worn out after 5 years |
| Building defect | Roof leak causing ceiling damage |
| Code compliance | Smoke detector upgrade required |
| Recently installed by owner | New appliance fails in 6 months |

### Tenant Responsible When:

| Condition | Example |
|-----------|---------|
| Visible damage caused | Hole punched in wall |
| Negligence evident | Left window open, pipe froze |
| Unauthorized modification | Installed unapproved fixture |
| Pet damage | Dog chewed door frame |
| Excessive wear | Carpet destroyed in 1 year |

---

## What AI Evaluates

### 1. Work Description Analysis
- What broke and why?
- Any indication of cause?

### 2. Photo Evidence
- Damage pattern (impact, wear, neglect?)
- Age indicators
- Surrounding condition

### 3. Unit Profile Context
- Equipment installation dates
- Warranty status
- Tenant move-in date
- Previous similar issues

### 4. Tenant History
- Damage incidents on record
- Request patterns
- Time in unit vs wear level

---

## Data Model

### Modify: Work Order

| New Column | Type | Purpose |
|------------|------|---------|
| `responsibility` | TEXT | owner / tenant / shared |
| `responsibility_confidence` | INTEGER | 0-100 |
| `responsibility_reasoning` | TEXT | AI explanation |
| `tenant_charge_amount` | DECIMAL | If tenant responsible |
| `responsibility_evidence` | JSONB | Supporting factors |
| `responsibility_disputed` | BOOLEAN | Tenant contested? |

### New Table: `tenant_charges`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `work_order_id` | TEXT | FK to work order |
| `tenant_id` | TEXT | Who's being charged |
| `amount` | DECIMAL | Charge amount |
| `description` | TEXT | What for |
| `evidence_summary` | TEXT | Why tenant responsible |
| `status` | TEXT | pending / billed / paid / disputed / waived |
| `created_at` | TIMESTAMPTZ | When determined |

---

## AI Prompt Structure

### Input

```
You are determining financial responsibility for a maintenance repair.

WORK ORDER:
- Description: "{description}"
- Technician notes: "{tech_notes}"
- Category: {category}
- Total cost: ${cost}

UNIT CONTEXT:
- Unit: {unit}
- Building age: {building_age} years
- Tenant move-in: {move_in_date}
- Tenant duration: {tenant_duration}

EQUIPMENT CONTEXT (if applicable):
- Item: {equipment_name}
- Installed: {install_date}
- Age: {equipment_age} years
- Expected lifespan: {expected_lifespan} years
- Warranty expires: {warranty_date}

PHOTO ANALYSIS (if available):
- Damage type observed: {damage_type}
- Wear pattern: {wear_pattern}
- Condition notes: {condition_notes}

TENANT HISTORY:
- Previous damage charges: {damage_count}
- Similar issues reported: {similar_issues}
```

### Instructions

```
Determine who is financially responsible:

1. RESPONSIBILITY: "owner" | "tenant" | "shared"

2. CONFIDENCE: 0-100

3. REASONING: 2-3 sentences explaining decision

4. KEY FACTORS: List the evidence that drove your decision

5. IF TENANT RESPONSIBLE:
   - What specifically did tenant do/cause?
   - Is this damage, negligence, or unauthorized modification?
   - Recommended charge amount (full cost or partial)

6. IF SHARED:
   - What percentage owner vs tenant?
   - Why split?

7. DISPUTE RISK: low | medium | high
   - How likely is tenant to contest this?
   - What's our evidence strength?
```

### Expected Output

```json
{
  "responsibility": "owner",
  "confidence": 92,
  "reasoning": "Water heater is 14 years old, exceeding typical 10-12 year lifespan. Failure is normal end-of-life, not tenant-caused damage.",
  "key_factors": [
    "Equipment age (14 years) exceeds expected lifespan (10-12 years)",
    "No evidence of tenant misuse",
    "Warranty expired 4 years ago",
    "Normal wear failure pattern"
  ],
  "tenant_charge": null,
  "dispute_risk": "low"
}
```

---

## Classification Examples

### Example 1: Clear Owner - Equipment Age

**Description:** "Water heater leaking, needs replacement"  
**Equipment:** Water heater, installed 2010 (14 years old)

```json
{
  "responsibility": "owner",
  "confidence": 95,
  "reasoning": "Water heater exceeded expected 10-12 year lifespan. Normal end-of-life failure.",
  "key_factors": [
    "14 years old, expected life 10-12 years",
    "No abuse indicators",
    "Warranty long expired"
  ],
  "dispute_risk": "low"
}
```

### Example 2: Clear Tenant - Damage

**Description:** "Hole in bedroom wall, approximately 6 inches"  
**Photos:** Show impact damage, fist-sized hole

```json
{
  "responsibility": "tenant",
  "confidence": 95,
  "reasoning": "Impact damage to drywall is tenant-caused. Hole size and pattern consistent with punch or thrown object.",
  "key_factors": [
    "Impact damage pattern visible",
    "Not wear-related",
    "Drywall was in good condition"
  ],
  "tenant_charge": {
    "amount": 150,
    "description": "Drywall repair - impact damage",
    "damage_type": "physical_damage"
  },
  "dispute_risk": "low"
}
```

### Example 3: Shared - Partial Negligence

**Description:** "Frozen pipe burst in bathroom"  
**Context:** Tenant reported being away for holidays, heat set low

```json
{
  "responsibility": "shared",
  "confidence": 70,
  "reasoning": "Pipe freeze during cold snap while tenant away. Tenant should maintain heat, but older building may have inadequate insulation.",
  "key_factors": [
    "Tenant set heat low while away (negligence factor)",
    "Building is 40 years old (owner factor)",
    "Extreme cold snap (weather factor)"
  ],
  "split": {
    "owner_percent": 70,
    "tenant_percent": 30
  },
  "tenant_charge": {
    "amount": 180,
    "description": "Partial responsibility - frozen pipe (30% of $600)",
    "damage_type": "negligence"
  },
  "dispute_risk": "medium"
}
```

### Example 4: Needs More Info

**Description:** "Smoke detector not working"  
**Equipment:** Unknown install date

```json
{
  "responsibility": "owner",
  "confidence": 60,
  "reasoning": "Smoke detector failure defaults to owner responsibility for safety compliance. However, if tenant removed batteries, responsibility shifts.",
  "key_factors": [
    "Safety device - owner must maintain",
    "Unknown if tenant tampered"
  ],
  "note": "Recommend tech verify if batteries were removed or device tampered with",
  "dispute_risk": "low"
}
```

---

## Photo Evidence Integration

### What Photos Can Show

| Observation | Likely Responsibility |
|-------------|----------------------|
| Impact marks, holes | Tenant |
| Burns, scorching | Tenant (unless electrical fault) |
| Water stains (old) | Owner - maintenance failure |
| Pet scratches/chew marks | Tenant |
| Rust, corrosion | Owner - age/maintenance |
| Mold (recent) | Owner - building issue |
| Broken glass (inside) | Tenant |
| Normal wear pattern | Owner |

### Photo Analysis Integration

If photo analysis already run:
- Pull damage type classification
- Pull wear pattern assessment
- Include in responsibility determination

---

## Coordinator Interface

### Responsibility Panel (Approval Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│  Financial Responsibility                                       │
│  ───────────────────────────────────────────────────────────────│
│                                                                 │
│  AI Determination: [TENANT]         Confidence: 92%             │
│                                                                 │
│  "Impact damage to drywall from tenant. Hole pattern            │
│   consistent with punch or thrown object."                      │
│                                                                 │
│  Evidence:                                                      │
│  ✓ Impact damage visible in photos                              │
│  ✓ Not wear-related                                             │
│  ✓ Unit was in good condition at move-in                        │
│                                                                 │
│  Recommended Charge: $150                                       │
│  Dispute Risk: Low                                              │
│                                                                 │
│  Responsibility: [Tenant ▼]  Amount: [$150    ]                 │
│                                                                 │
│  [Confirm & Create Charge]  [Waive - Owner Pays]                │
└─────────────────────────────────────────────────────────────────┘
```

### Dispute Handling

If tenant disputes:
- Flag charge as disputed
- Show original AI reasoning + evidence
- Coordinator can adjust or uphold
- Log final decision with reason

---

## Unit Profile Integration

### Look Up Before Determining

- Equipment installation dates
- Tenant move-in date
- Previous tenant charges
- Similar issues in unit history

### Update After Determining

- Log damage incident to tenant profile
- Track patterns across tenants
- Flag units with recurring issues

---

## Validation Checkpoints

### Checkpoint 1: Data Model
- [ ] Responsibility columns added
- [ ] `tenant_charges` table created
- [ ] Links to tenant/unit profiles

### Checkpoint 2: AI Integration  
- [ ] Prompt handles all scenarios
- [ ] Equipment context incorporated
- [ ] Photo analysis integrated

### Checkpoint 3: UI Display
- [ ] Determination shows in approval
- [ ] Override option works
- [ ] Charge creation flows correctly

### Checkpoint 4: Billing Integration
- [ ] Charges flow to billing system
- [ ] Dispute tracking works
- [ ] Reporting accurate

---

## Success Metrics

- Determination accuracy: >85% match with Kristine's judgment
- Dispute rate: <15% of tenant charges contested
- Evidence documentation: 100% have reasoning logged
- Collection rate: >70% of tenant charges recovered
