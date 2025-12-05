# PRP-15: AI Suggestions & Automation (Phase 3)

## Goal
Implement AI-powered features: auto-classification, smart assignment suggestions, photo analysis, and predictive maintenance alerts.

## Success Criteria
- [ ] AI suggests technician based on skills + workload + location
- [ ] AI classifies work order priority from description
- [ ] AI analyzes photos for completion verification
- [ ] AI suggests preventive maintenance based on patterns
- [ ] Confidence scores on all AI suggestions
- [ ] Coordinator can accept/reject/modify all suggestions

---

## Context

**AI Integration approach:**
- Claude API for text analysis (classification, suggestions)
- Vision API for photo analysis
- All suggestions are advisory - coordinator approves

**Confidence-based routing:**
- >85%: Auto-assign (with undo option)
- 60-84%: Queue for review with suggestion
- <60%: Escalate to coordinator, no suggestion

---

## Tasks

### Task 1: AI Service Layer
CREATE `src/services/aiService.ts`
- Wrapper for Claude API calls
- Methods: classifyWorkOrder, suggestTechnician, analyzePhoto, predictMaintenance
- Handles API errors gracefully
- Caches recent suggestions

### Task 2: Work Order Classification
CREATE `src/hooks/useAIClassification.ts`
- Takes work order description
- Returns: suggested priority, category, skills needed, estimated duration
- Confidence score for each field
- Called on work order creation

### Task 3: Smart Assignment Suggestion
CREATE `src/hooks/useAIAssignment.ts`
- Input: work order, available technicians
- Returns: ranked list of technicians with scores
- Factors: skills match, current workload, location, past performance
- Explains reasoning

### Task 4: AI Suggestion Card
CREATE `src/components/ai/AISuggestionCard.tsx`
- Shows AI recommendation
- Confidence meter (visual)
- "Accept" / "Modify" / "Ignore" buttons
- Expandable reasoning section
- Appears in work order detail and assignment flows

### Task 5: Photo Analysis for Completion
CREATE `src/hooks/usePhotoAnalysis.ts`
- Input: before/after photos
- Returns: completion confidence, issues detected, cleanup verified
- Flags: "Work appears incomplete", "Area not cleaned"
- Assists coordinator in approval decision

### Task 6: Photo Analysis Results Display
CREATE `src/components/ai/PhotoAnalysisResults.tsx`
- Shows in approval detail
- Checkmarks for verified items
- Warnings for issues detected
- AI confidence score
- "AI suggests: Approve" or "AI suggests: Request rework"

### Task 7: Predictive Maintenance Alerts
CREATE `src/components/ai/PredictiveMaintenanceAlerts.tsx`
- Analyzes patterns across portfolio
- "Building A has had 3 ceiling leaks this year - investigate roof"
- "Water heater in Unit 205 is 11 years old - schedule inspection"
- Priority ranking of suggestions
- "Create Work Order" button

### Task 8: AI Settings & Tuning
CREATE `src/pages/AISettingsPage.tsx`
- Toggle AI features on/off
- Adjust confidence thresholds
- View AI decision history
- Override frequency metrics
- Feedback mechanism for training

---

## Validation Checkpoints

1. Create work order - AI suggests priority
2. Assign work order - AI ranks technicians
3. Upload completion photos - AI analyzes
4. AI suggestion appears with confidence
5. Accept suggestion - work order updated
6. Predictive alerts appear based on data

---

## Files to Create
- src/services/aiService.ts
- src/hooks/useAIClassification.ts
- src/hooks/useAIAssignment.ts
- src/components/ai/AISuggestionCard.tsx
- src/hooks/usePhotoAnalysis.ts
- src/components/ai/PhotoAnalysisResults.tsx
- src/components/ai/PredictiveMaintenanceAlerts.tsx
- src/pages/AISettingsPage.tsx

---

## Anti-Patterns
- ❌ Don't auto-execute without coordinator visibility
- ❌ Don't hide AI reasoning from users
- ❌ Don't trust low-confidence suggestions
- ❌ Don't forget API rate limiting
- ❌ Don't send PII to AI without sanitization

---

## Phase 3 Complete
After PRP-15, Phase 3 core features are complete.

The system now includes:
- Phase 1: Core operations (work orders, messages, approvals)
- Phase 2: Intelligence (calendar, real-time, dispatch, automation)
- Phase 3: Enterprise scale (analytics, financials, profiles, AI)
