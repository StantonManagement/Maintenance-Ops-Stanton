# PRP: AI Duplicate Analysis Component

**Feature:** AI-powered duplicate work order review and recommendations  
**Priority:** High  
**Dependencies:** PRP-DUPLICATE-DETECTION (already implemented)  

---

## Problem Statement

The duplicate detection flags potential matches, but Kristine still has to manually compare descriptions and decide. AI should do this analysis and give her a clear recommendation with reasoning.

---

## What AI Provides

For each duplicate candidate pair, AI generates:

1. **Recommendation:** MERGE / NOT DUPLICATE / NEEDS REVIEW
2. **Confidence:** 0-100%
3. **Reasoning:** Plain English explanation
4. **Key Differences:** If any exist between the two requests
5. **Suggested Action:** What to do if merged (append note, add photos, etc.)

---

## Data Model Addition

### Modify Table: `duplicate_candidates`

| New Column | Type | Purpose |
|------------|------|---------|
| `ai_recommendation` | TEXT | MERGE / NOT_DUPLICATE / NEEDS_REVIEW |
| `ai_confidence` | INTEGER | 0-100 |
| `ai_reasoning` | TEXT | Plain English explanation |
| `ai_key_differences` | TEXT | Notable differences if any |
| `ai_analyzed_at` | TIMESTAMPTZ | When AI reviewed |

---

## AI Prompt Structure

### Input Context

```
You are reviewing two work orders to determine if they are duplicates.

WORK ORDER A (Primary - Older):
- ID: {wo_a.id}
- Created: {wo_a.created_at}
- Unit: {wo_a.property_address}, {wo_a.unit}
- Tenant: {wo_a.resident_name}
- Description: "{wo_a.description}"
- Status: {wo_a.status}
- Category: {wo_a.category}

WORK ORDER B (Potential Duplicate - Newer):
- ID: {wo_b.id}
- Created: {wo_b.created_at}
- Unit: {wo_b.property_address}, {wo_b.unit}
- Tenant: {wo_b.resident_name}
- Description: "{wo_b.description}"
- Status: {wo_b.status}
- Category: {wo_b.category}

Time between requests: {time_diff}
```

### Instructions to AI

```
Analyze these work orders and determine if B is a duplicate of A.

Consider:
1. Are they describing the same issue or different issues?
2. Could the tenant be reporting the same problem twice?
3. Is there NEW information in B that adds to A?
4. Are there any red flags suggesting these are actually different problems?

Respond with:
- recommendation: "MERGE" | "NOT_DUPLICATE" | "NEEDS_REVIEW"
- confidence: 0-100
- reasoning: 2-3 sentences explaining your decision
- key_differences: Any notable differences, or "None" if identical issue
- merge_note: If recommending merge, what context from B should be added to A
```

### Expected Output Format

```json
{
  "recommendation": "MERGE",
  "confidence": 92,
  "reasoning": "Both work orders describe a kitchen faucet leak in the same unit, submitted 4 hours apart. The descriptions match and the second request appears to be a follow-up submission through a different channel.",
  "key_differences": "WO B mentions water on the floor, which adds urgency context.",
  "merge_note": "Tenant submitted second request noting water on floor - may need expedited response."
}
```

---

## Example Scenarios

### Scenario 1: Clear Duplicate

**WO A:** "Kitchen faucet is leaking"  
**WO B:** "Faucet in kitchen dripping water" (same unit, 2 hours later)

```json
{
  "recommendation": "MERGE",
  "confidence": 95,
  "reasoning": "Identical issue (kitchen faucet leak) reported by same tenant in same unit within 2 hours. Second submission adds no new information.",
  "key_differences": "None",
  "merge_note": "Duplicate submission, no additional context needed."
}
```

### Scenario 2: Same Unit, Different Issue

**WO A:** "Kitchen faucet is leaking"  
**WO B:** "Garbage disposal not working" (same unit, 1 day later)

```json
{
  "recommendation": "NOT_DUPLICATE",
  "confidence": 98,
  "reasoning": "Different issues entirely - one is a faucet leak, the other is a garbage disposal problem. Both require separate work orders even though they're in the same unit.",
  "key_differences": "Faucet leak vs garbage disposal - unrelated issues",
  "merge_note": null
}
```

### Scenario 3: Needs Human Review

**WO A:** "Water issue in kitchen"  
**WO B:** "Leak under sink" (same unit, 6 hours later)

```json
{
  "recommendation": "NEEDS_REVIEW",
  "confidence": 65,
  "reasoning": "Descriptions are vague but could refer to the same issue. 'Water issue in kitchen' and 'leak under sink' might be the same faucet leak, or could be separate problems (faucet vs drain line).",
  "key_differences": "WO A is vague, WO B is more specific about location",
  "merge_note": "If same issue, WO B clarifies the leak is under the sink."
}
```

### Scenario 4: Duplicate with New Info

**WO A:** "AC not cooling" (submitted Monday)  
**WO B:** "AC still not working, now making loud noise" (same unit, Wednesday)

```json
{
  "recommendation": "MERGE",
  "confidence": 88,
  "reasoning": "Same AC issue with escalating symptoms. Tenant is following up because problem persists and has worsened. Should merge but flag the new symptom (loud noise) for tech.",
  "key_differences": "WO B reports new symptom: loud noise from AC unit",
  "merge_note": "UPDATE: Tenant reports AC now making loud noise - possible compressor issue. Escalate priority."
}
```

---

## Coordinator Interface Updates

### Duplicate Queue Card Enhancement

```
┌─────────────────────────────────────────────────────────────────┐
│  POTENTIAL DUPLICATE                                            │
│                                                                 │
│  AI Recommendation: [MERGE ✓]        Confidence: 92%            │
│  ─────────────────────────────────────────────────────────────  │
│  "Both describe kitchen faucet leak in same unit, submitted     │
│   4 hours apart. Second request adds detail about water on      │
│   floor - suggests urgency."                                    │
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │ WO #1234 (Primary)  │    │ WO #1238 (Duplicate)│            │
│  │ Dec 8, 10:32 AM     │    │ Dec 8, 2:15 PM      │            │
│  │ Kitchen faucet is   │    │ Water leak in       │            │
│  │ leaking under sink  │    │ kitchen, water on   │            │
│  │                     │    │ floor now           │            │
│  │ Status: Scheduled   │    │ Status: New         │            │
│  └─────────────────────┘    └─────────────────────┘            │
│                                                                 │
│  If merged, will add: "Tenant reports water now on floor"       │
│                                                                 │
│  [✓ Merge]  [✗ Not Duplicate]  [View Full Details]              │
└─────────────────────────────────────────────────────────────────┘
```

### Color Coding by Recommendation

| AI Recommendation | Card Accent Color | Action Emphasis |
|-------------------|-------------------|-----------------|
| MERGE (>85%) | Green border | "Merge" button primary |
| MERGE (70-85%) | Yellow border | Both buttons neutral |
| NEEDS_REVIEW | Orange border | "View Details" emphasized |
| NOT_DUPLICATE | Gray border | "Not Duplicate" primary |

### Quick Actions Based on AI

**High confidence MERGE (>90%):**
- Single click merge
- AI merge_note auto-appended
- Toast: "Merged - added note about water on floor"

**Medium confidence (70-90%):**
- Standard two-button interface
- Coordinator reviews reasoning before acting

**NEEDS_REVIEW:**
- Expand by default to show full descriptions
- Require explicit decision
- Optional: Add note explaining decision

---

## Auto-Merge Enhancement

### Updated Logic

Auto-merge triggers when ALL conditions met:
1. AI recommendation = "MERGE"
2. AI confidence >= threshold (default 90%)
3. Auto-merge enabled in settings
4. Neither WO has status beyond "scheduled"

### Auto-Merge Logging

When auto-merge occurs, record:
- `ai_recommendation`: "MERGE"
- `ai_confidence`: 92
- `ai_reasoning`: (full text)
- `merged_by`: NULL (indicates auto)
- `auto_merge_reason`: "AI confidence 92% exceeded threshold 90%"

---

## Hook Addition

### `useAIDuplicateAnalysis`

**Method:** `analyzeCandidate(candidateId)`

**Flow:**
1. Fetch both work orders
2. Call AI service with prompt
3. Parse response
4. Update `duplicate_candidates` row with AI fields
5. Return analysis result

**Method:** `bulkAnalyze(candidateIds[])`

**Flow:**
1. Queue candidates for analysis
2. Process in batches (avoid rate limits)
3. Update all with results
4. Return summary

---

## Service Addition

### `aiDuplicateService.ts`

```typescript
interface DuplicateAnalysis {
  recommendation: 'MERGE' | 'NOT_DUPLICATE' | 'NEEDS_REVIEW';
  confidence: number;
  reasoning: string;
  keyDifferences: string | null;
  mergeNote: string | null;
}

// analyzeDuplicatePair(woA: WorkOrder, woB: WorkOrder): Promise<DuplicateAnalysis>
// Called when duplicate candidate is created or on-demand
```

---

## Trigger Points

### When to Run AI Analysis

**Option A: On Detection (Recommended)**
- When duplicate_candidate row created
- AI analyzes immediately
- Result ready when coordinator views queue

**Option B: On View**
- When coordinator opens duplicate queue
- AI analyzes candidates missing analysis
- May have brief loading state

**Option C: Batch Job**
- Scheduled job runs every 15 minutes
- Analyzes all pending candidates
- Most efficient for API costs

**Recommendation:** Option A for best UX, with Option C as fallback for high volume

---

## Validation Checkpoints

### Checkpoint 1: AI Integration
- [ ] AI service endpoint configured
- [ ] Prompt template returns expected format
- [ ] Response parsing handles edge cases

### Checkpoint 2: Data Storage
- [ ] New columns added to duplicate_candidates
- [ ] AI results persisting correctly
- [ ] Analysis timestamp recording

### Checkpoint 3: UI Display
- [ ] AI recommendation shows in queue card
- [ ] Reasoning text displays clearly
- [ ] Color coding matches recommendation
- [ ] Merge note previews correctly

### Checkpoint 4: Auto-Merge Update
- [ ] Auto-merge respects AI recommendation
- [ ] Confidence threshold works correctly
- [ ] Logging captures AI decision

---

## Success Metrics

- AI MERGE recommendations accepted by coordinator: >90%
- AI NOT_DUPLICATE recommendations accepted: >95%
- NEEDS_REVIEW cases correctly flagged: Coordinator agrees it was ambiguous
- Time to process duplicate queue: Reduced by 50%+ vs manual review
- False positive rate (AI says merge, shouldn't have): <5%

---

## Cost Considerations

- Estimate ~200-500 tokens per analysis
- At high volume, consider caching similar patterns
- Batch processing during off-hours if cost-sensitive
- Could use smaller/faster model for initial screening, larger model for edge cases
