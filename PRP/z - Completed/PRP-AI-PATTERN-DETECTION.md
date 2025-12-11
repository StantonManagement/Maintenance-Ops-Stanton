# PRP: AI Root Cause & Pattern Detection

**Feature:** Detect recurring issues and building-wide patterns  
**Priority:** Medium  
**Dependencies:** Historical work order data  

---

## Problem Statement

Issues that keep coming back indicate underlying problems:
- Same unit, same issue = missed root cause
- Multiple units, same issue = building-wide problem
- Seasonal spikes = preventable with prep

Currently these patterns are invisible until someone remembers "didn't we fix this before?"

---

## What AI Detects

### 1. Recurring Unit Issues
- Same issue in same unit within X months
- Indicates root cause not addressed

### 2. Building-Wide Patterns
- Same issue across multiple units
- Indicates systemic problem (plumbing, electrical, HVAC)

### 3. Seasonal Patterns
- Issues spiking at certain times
- Enables preventive scheduling

### 4. Cascade Indicators
- One issue causing others
- Example: Roof leak → ceiling damage → mold

---

## Pattern Types

### Recurring Issue (Same Unit)

**Trigger:** Same category + same unit + within 6 months

**Example:**
- WO #1234: "Toilet running" - Unit 205 - March
- WO #1456: "Toilet running" - Unit 205 - July

**Alert:** "Recurring toilet issue in Unit 205. Previous repair March 15. May need full replacement vs repair."

---

### Building Pattern (Multiple Units)

**Trigger:** Same category + same building + 3+ units + within 30 days

**Example:**
- WO #1234: "No hot water" - Building A, Unit 101 - Dec 1
- WO #1235: "No hot water" - Building A, Unit 205 - Dec 3
- WO #1236: "Water not hot" - Building A, Unit 310 - Dec 5

**Alert:** "3 hot water complaints in Building A this week. Possible boiler issue - recommend building-wide inspection."

---

### Seasonal Pattern

**Trigger:** Issue category spikes compared to same period last year

**Example:**
- Heating complaints: 2 in September
- Heating complaints: 15 in October
- Last October: 18 heating complaints

**Alert:** "Heating season starting. 15 HVAC complaints this month (typical for October). Ensure boiler maintenance scheduled."

---

### Cascade Pattern

**Trigger:** Sequential issues in same unit suggesting causation

**Example:**
- WO #1234: "Ceiling leak" - Unit 305 - June 1
- WO #1235: "Ceiling stain spreading" - Unit 305 - June 15
- WO #1236: "Mold in bathroom" - Unit 305 - July 1

**Alert:** "Possible cascade: Ceiling leak → Water damage → Mold in Unit 305. Original leak source may not be resolved."

---

## Data Model

### New Table: `pattern_alerts`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `pattern_type` | TEXT | recurring / building / seasonal / cascade |
| `severity` | TEXT | info / warning / critical |
| `title` | TEXT | Short description |
| `description` | TEXT | Full explanation |
| `affected_units` | TEXT[] | Units involved |
| `affected_building` | TEXT | Building if applicable |
| `related_work_orders` | TEXT[] | WO IDs that triggered |
| `recommended_action` | TEXT | What to do |
| `status` | TEXT | new / acknowledged / resolved / dismissed |
| `acknowledged_by` | UUID | Who saw it |
| `resolved_at` | TIMESTAMPTZ | When addressed |
| `created_at` | TIMESTAMPTZ | When detected |

### New Table: `pattern_rules`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `pattern_type` | TEXT | Type of pattern |
| `category_match` | TEXT | Issue category to watch |
| `unit_threshold` | INTEGER | How many units trigger |
| `time_window_days` | INTEGER | Lookback period |
| `enabled` | BOOLEAN | Is rule active |
| `severity` | TEXT | Alert level when triggered |

---

## Detection Logic

### Daily Pattern Scan

Run nightly (or on each WO creation):

1. **Recurring Check:**
   - For each new WO, query same unit + same category + last 6 months
   - If match found, create recurring alert

2. **Building Check:**
   - Group today's WOs by building + category
   - If 3+ units same issue, create building alert

3. **Seasonal Check:**
   - Compare this month's category counts to last year
   - Flag significant spikes or emerging trends

4. **Cascade Check:**
   - For units with 3+ WOs in 60 days
   - AI analyzes if issues are related

---

## AI Prompt Structure

### For Cascade Detection

```
Analyze these work orders from the same unit to determine if they're related:

UNIT: {unit}
BUILDING: {building}

WORK ORDER HISTORY (Last 90 days):
{for each wo}
- Date: {date}
- Description: "{description}"
- Category: {category}
- Resolution: "{resolution}"
{end for}

Determine:
1. Are these issues likely connected?
2. What might be the root cause?
3. Is there an unresolved underlying problem?
4. What action should be taken?
```

### For Building Pattern Analysis

```
Multiple units in this building have reported similar issues:

BUILDING: {building}
TIME PERIOD: {date_range}

AFFECTED UNITS AND ISSUES:
{for each wo}
- Unit {unit}: "{description}" on {date}
{end for}

Analyze:
1. Is this likely a building-wide problem?
2. What system might be affected?
3. Should we inspect other units proactively?
4. What's the recommended action?
```

---

## Alert Examples

### Recurring Issue Alert

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ RECURRING ISSUE                              [Warning]       │
│  ───────────────────────────────────────────────────────────────│
│  Unit 205 - Toilet Running (3rd time this year)                 │
│                                                                 │
│  History:                                                       │
│  • Mar 15: Replaced flapper                                     │
│  • Jun 22: Replaced fill valve                                  │
│  • Oct 8: Current complaint (running again)                     │
│                                                                 │
│  AI Analysis:                                                   │
│  "Multiple component failures suggest toilet approaching        │
│   end of life. Recommend full toilet replacement vs             │
│   continued part repairs."                                      │
│                                                                 │
│  Recommended Action: Schedule toilet replacement                │
│                                                                 │
│  [Create Replacement WO]  [Dismiss]  [Acknowledge]              │
└─────────────────────────────────────────────────────────────────┘
```

### Building Pattern Alert

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨 BUILDING PATTERN                             [Critical]     │
│  ───────────────────────────────────────────────────────────────│
│  Building A - 5 Hot Water Complaints This Week                  │
│                                                                 │
│  Affected Units: 101, 205, 208, 310, 412                        │
│                                                                 │
│  AI Analysis:                                                   │
│  "5 units across different floors reporting hot water issues    │
│   within 7 days indicates building boiler problem, not          │
│   individual water heater failures. Recommend immediate         │
│   boiler inspection."                                           │
│                                                                 │
│  Recommended Action: Dispatch HVAC tech to inspect boiler       │
│                                                                 │
│  [Create Inspection WO]  [View All Related WOs]                 │
└─────────────────────────────────────────────────────────────────┘
```

### Seasonal Trend Alert

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 SEASONAL TREND                               [Info]         │
│  ───────────────────────────────────────────────────────────────│
│  Heating Season Starting - Complaint Volume Rising              │
│                                                                 │
│  This Month: 18 HVAC complaints                                 │
│  Last October: 22 HVAC complaints                               │
│  Trend: Normal seasonal increase                                │
│                                                                 │
│  Buildings Without Boiler Service This Year:                    │
│  • Building C (last service: Nov 2023)                          │
│  • Building F (last service: Oct 2023)                          │
│                                                                 │
│  Recommended Action: Schedule preventive boiler service         │
│                                                                 │
│  [Create PM Schedule]  [Dismiss]                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Coordinator Interface

### Pattern Dashboard Widget

```
┌─────────────────────────────────────────────────────────────────┐
│  Pattern Alerts                                    [View All]   │
│  ───────────────────────────────────────────────────────────────│
│  🚨 1 Critical  ⚠️ 3 Warnings  ℹ️ 5 Info                         │
│                                                                 │
│  Recent:                                                        │
│  • Building A hot water (5 units) - Critical                    │
│  • Unit 205 recurring toilet - Warning                          │
│  • Unit 310 possible cascade - Warning                          │
└─────────────────────────────────────────────────────────────────┘
```

### Pattern Alert List

Filterable by:
- Type (recurring, building, seasonal, cascade)
- Severity (critical, warning, info)
- Status (new, acknowledged, resolved)
- Building
- Date range

---

## Preventive Action Generation

When pattern detected, optionally auto-create:

### For Recurring Issues
- Preventive maintenance WO
- Equipment replacement WO
- Inspection WO

### For Building Patterns
- Building-wide inspection WO
- System service WO
- Multiple unit check WOs

### For Seasonal Trends
- Preventive maintenance batch
- Pre-season inspection schedule

---

## Validation Checkpoints

### Checkpoint 1: Data Model
- [ ] `pattern_alerts` table created
- [ ] `pattern_rules` table created
- [ ] Indexes for efficient querying

### Checkpoint 2: Detection Jobs
- [ ] Recurring detection runs on WO creation
- [ ] Building pattern check runs daily
- [ ] Seasonal analysis runs monthly

### Checkpoint 3: AI Integration
- [ ] Cascade analysis prompt working
- [ ] Building analysis prompt working
- [ ] Recommendations generated correctly

### Checkpoint 4: UI Display
- [ ] Dashboard widget shows alerts
- [ ] Alert detail view complete
- [ ] Action buttons create appropriate WOs

---

## Success Metrics

- Pattern detection rate: Catch 80%+ of recurring issues
- False positive rate: <20% dismissed as not relevant
- Preventive action rate: 50%+ of alerts result in action
- Repeat issue reduction: 20% fewer recurring issues over 6 months
- Building issue response: Systemic problems caught before 5+ complaints
