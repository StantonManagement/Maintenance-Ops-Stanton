# PRP Index: AI Features

**Overview:** All AI-powered features for the Maintenance Operations Center  
**Last Updated:** December 2024  

---

## AI Feature Map

| PRP | Feature | Priority | Trigger Point |
|-----|---------|----------|---------------|
| PRP-DUPLICATE-AI-ANALYSIS | Duplicate WO detection | High | WO creation |
| PRP-AI-PHOTO-COMPLETION | Photo verification | High | Status → Ready for Review |
| PRP-AI-CLASSIFICATION | WO priority/skills/time | High | WO creation |
| PRP-AI-CAPEX-CLASSIFICATION | CapEx vs Maintenance | Medium | WO completion |
| PRP-AI-RESPONSIBILITY | Tenant vs Owner billing | Medium | WO completion |
| PRP-AI-PARTS-PREDICTION | Parts needed prediction | Medium | WO assignment |
| PRP-AI-PATTERN-DETECTION | Recurring/building patterns | Medium | Daily scan + WO creation |

---

## Implementation Order

### Phase 1: Intake Intelligence
1. **AI Classification** - Priority, skills, time estimate on every new WO
2. **Duplicate Detection** - Catch duplicates before they create overhead

### Phase 2: Completion Intelligence  
3. **Photo Analysis** - Verify work completion, reduce Kristine's review time
4. **CapEx Classification** - Automatic financial categorization

### Phase 3: Operational Intelligence
5. **Parts Prediction** - Reduce return trips, improve first-time fix
6. **Responsibility Determination** - Consistent tenant billing decisions
7. **Pattern Detection** - Catch systemic issues early

---

## Shared Infrastructure

### AI Service Configuration

All features use common AI service with:
- Model selection (Claude, GPT-4, etc.)
- Rate limiting
- Response caching
- Error handling
- Cost tracking

### Confidence Thresholds (from config)

| Decision Type | Auto-Act | Human Review | Escalate |
|---------------|----------|--------------|----------|
| General automated | ≥90% | 60-89% | <60% |
| Emergency classification | ≥95% | 80-94% | <80% |
| Completion verification | ≥98% | 90-97% | <90% |
| Financial categorization | ≥90% | 70-89% | <70% |

### Common Data Patterns

All AI features should:
- Store confidence scores
- Store reasoning text
- Log full AI response
- Track coordinator overrides
- Enable accuracy measurement

---

## Coordinator Override Tracking

For every AI decision, track:

```json
{
  "ai_decision": "what AI recommended",
  "ai_confidence": 85,
  "ai_reasoning": "why",
  "coordinator_action": "accepted | modified | rejected",
  "coordinator_value": "what they chose instead",
  "coordinator_reason": "why they overrode (optional)"
}
```

This enables:
- Model improvement
- Threshold tuning
- Trust building over time

---

## Cost Considerations

### Per-Feature Estimates

| Feature | Tokens/Call | Calls/Day | Est. Daily Cost |
|---------|-------------|-----------|-----------------|
| Classification | ~500 | 20-50 | $0.10-0.25 |
| Duplicate Analysis | ~800 | 5-15 | $0.05-0.15 |
| Photo Analysis | ~1500 | 15-30 | $0.20-0.50 |
| CapEx Classification | ~400 | 15-30 | $0.08-0.15 |
| Responsibility | ~600 | 5-15 | $0.05-0.10 |
| Parts Prediction | ~500 | 20-50 | $0.10-0.25 |
| Pattern Detection | ~1000 | 1-5 | $0.02-0.05 |

**Estimated total:** $0.60-1.50/day at 150 units

### Cost Optimization

- Cache similar requests
- Batch where possible (pattern detection)
- Use smaller models for simple classification
- Skip analysis for obvious cases

---

## Success Metrics Summary

### Time Savings

| Task | Current | With AI | Savings |
|------|---------|---------|---------|
| Classify new WO | 1-2 min | 5 sec | 90% |
| Review for approval | 3-5 min | 30 sec | 85% |
| Determine responsibility | 5-10 min | 1 min | 80% |
| Financial categorization | 2-3 min | 10 sec | 90% |

### Quality Improvements

| Metric | Current | Target |
|--------|---------|--------|
| First-time fix rate | ~85% | 90%+ |
| Duplicate WO rate | Unknown | <5% |
| Rework rate | ~15% | <10% |
| Parts return trips | ~15-20% | <10% |

---

## File Downloads

- [PRP-DUPLICATE-AI-ANALYSIS.md](computer:///mnt/user-data/outputs/PRP-DUPLICATE-AI-ANALYSIS.md)
- [PRP-AI-PHOTO-COMPLETION.md](computer:///mnt/user-data/outputs/PRP-AI-PHOTO-COMPLETION.md)
- [PRP-AI-CLASSIFICATION.md](computer:///mnt/user-data/outputs/PRP-AI-CLASSIFICATION.md)
- [PRP-AI-CAPEX-CLASSIFICATION.md](computer:///mnt/user-data/outputs/PRP-AI-CAPEX-CLASSIFICATION.md)
- [PRP-AI-RESPONSIBILITY.md](computer:///mnt/user-data/outputs/PRP-AI-RESPONSIBILITY.md)
- [PRP-AI-PARTS-PREDICTION.md](computer:///mnt/user-data/outputs/PRP-AI-PARTS-PREDICTION.md)
- [PRP-AI-PATTERN-DETECTION.md](computer:///mnt/user-data/outputs/PRP-AI-PATTERN-DETECTION.md)
