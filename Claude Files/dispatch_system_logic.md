# Maintenance Dispatch System - Architecture & Logic

## Core Philosophy

**The coordinator is an exception handler, not a scheduler.**

The system auto-assigns 70-80% of work orders based on AI analysis of complete context. The coordinator (Christine) reviews, approves, and handles edge cases. She should spend 5-10 minutes per day on routine scheduling.

---

## Data Architecture (Foundation Layer)

### Real-Time Context Assembly

When any work order is analyzed, the system assembles complete context from three sources:

**1. Structured Data (Relational DB - Supabase)**
```
Work Order Context:
├─ Tenant record (payment status, request history, language, availability)
├─ Unit record (building age, maintenance history, equipment age)
├─ Property record (Section 8 status, owner entity, manager)
├─ Recent work orders (same unit, same building, same issue type)
└─ Technician records (skills, certifications, capacity, performance)

Query Pattern:
- Load work order with all relationships (tenant, unit, property)
- Query last 10 work orders for this unit
- Query last 5 work orders of this type in this building
- Load all technician availability and capacity
- Load all scheduled work for the week
```

**2. Semantic Data (Vector Store - Pinecone/pgvector)**
```
Historical Pattern Matching:
├─ Similar work orders (by description embeddings)
├─ Successful completion patterns (tech + work type combinations)
├─ Communication patterns (effective tenant messages)
└─ Root cause analysis (issue → likely causes)

Vector Queries:
- Embed work order description
- Search for top 10 similar completed work orders
- Extract: avg duration, parts needed, first-time fix rate
- Find best-performing tech for this issue type
- Identify root causes from similar cases
```

**3. Workflow State (Redis/Cache)**
```
Real-Time State:
├─ Active workflow context (current processing step)
├─ AI decision cache (recent recommendations)
├─ Rate limiting (prevent duplicate processing)
└─ Event queue (pending actions)

State Tracking:
- Store workflow progress for each work order
- Cache AI recommendations for 1 hour
- Track last action timestamp
- Queue retry attempts for failed operations
```

### Context Assembly Timing

**On Work Order Creation:**
- Assemble full context (500ms target)
- Run AI analysis immediately
- Cache results for coordinator review
- If confidence >85%, auto-assign
- If confidence 60-84%, queue for review
- If confidence <60%, escalate

**On Hover (UI):**
- Return cached AI analysis instantly
- Show: confidence, recommendation, reasoning
- No new computation needed

**On Drag (UI):**
- Return full context dump for manual decision
- Show: tenant details, unit history, tech comparison
- Everything needed to override AI

---

## AI Agent Architecture

### Work Order Classification Agent

**Input:** Raw work order (description, building, unit, tenant)

**Context Provided:**
- Tenant request history
- Unit maintenance history  
- Similar work orders (vector search)
- Current system capacity

**Outputs:**
```json
{
  "priority": "emergency|high|medium|low",
  "skills_required": ["plumbing", "electrical"],
  "estimated_duration": 2.5,
  "requires_parts": true,
  "likely_parts": ["P-trap", "drywall compound"],
  "first_time_fix_probability": 0.65,
  "multi_visit_likely": true,
  "safety_concern": false,
  "confidence": 0.92
}
```

### Technician Assignment Agent

**Input:** Classified work order + tenant availability

**Context Provided:**
- All technician schedules
- Technician skill matches
- Technician performance history
- Route optimization data
- Current workload

**Outputs:**
```json
{
  "recommended_tech": "ramon",
  "recommended_time": "Wed 2:00pm",
  "confidence": 0.92,
  "reasoning": [
    "Ramon has plumbing certification (required)",
    "Completed 12 similar ceiling leaks (experience)",
    "Wed 2pm aligns with tenant availability",
    "Near his 4pm job in Building B (route optimized)"
  ],
  "warnings": [
    "Leak likely requires 2-visit job (diagnosis + repair)",
    "Historical data shows 65% first-time fix rate"
  ],
  "alternatives": [
    {
      "tech": "carlos",
      "time": "Thu 10am",
      "confidence": 0.78,
      "reason": "No plumbing cert, would need Ramon backup"
    }
  ]
}
```

### Communication Generation Agent

**Input:** Work order assignment + tenant profile

**Context Provided:**
- Tenant language preference
- Past communication history
- Response patterns
- Effective message templates

**Outputs:**
```json
{
  "message": "Hi Roxanne, maintenance scheduled for ceiling leak Wednesday 2pm. Ramon will arrive with tools for diagnosis. Reply YES to confirm or suggest another time.",
  "language": "english",
  "channel": "sms",
  "expected_response_time": "2 hours",
  "confidence": 0.89
}
```

---

## Business Rules Engine

### Auto-Assignment Rules

**Rule: Standard Auto-Assignment**
```yaml
conditions:
  ai_confidence: ">= 0.85"
  tech_available: true
  tenant_availability_matched: true
  no_safety_concerns: true
  
actions:
  - assign_technician
  - notify_tenant
  - notify_technician
  - log_decision
  
metadata:
  auto_approve: true
  requires_coordinator_review: false
```

**Rule: Medium Confidence Review**
```yaml
conditions:
  ai_confidence: "0.60 to 0.84"
  
actions:
  - queue_for_coordinator_review
  - flag_low_confidence
  - log_decision
  
metadata:
  auto_approve: false
  requires_coordinator_review: true
  review_priority: "medium"
```

**Rule: Safety Escalation**
```yaml
conditions:
  priority: "emergency"
  safety_concern: true
  OR
  ai_confidence: "< 0.60"
  
actions:
  - escalate_to_coordinator
  - flag_for_immediate_review
  - notify_property_manager
  - log_decision
  
metadata:
  auto_approve: false
  requires_coordinator_review: true
  review_priority: "critical"
```

### Capacity Rules

**Rule: Daily Workload Limits**
```yaml
conditions:
  tech_role: "standard"
  
parameters:
  max_daily_work_orders: 6
  max_concurrent_active: 3
  emergency_override_allowed: true
  
exceptions:
  - "Manager can override with reason"
  - "Emergency work doesn't count toward preventive limit"
```

**Rule: Emergency Override Protocol**
```yaml
conditions:
  override_by: "dean" OR "property_manager"
  reason: "turnover" OR "emergency"
  
actions:
  - allow_override
  - notify_coordinator
  - reschedule_displaced_work
  - log_override_reason
  
metadata:
  requires_explanation: true
  auto_reschedule: true
```

---

## Event-Driven Workflows

### Work Order Creation Flow

```
1. SMS/Call received → webhook fires
   ├─ Event: work_order.created
   └─ Data: {description, building, unit, tenant, channel}

2. Context Assembly Workflow triggered
   ├─ Load structured data (tenant, unit, property)
   ├─ Query vector DB (similar work orders)
   ├─ Assemble complete context
   └─ Event: context.assembled

3. Classification Agent triggered
   ├─ Receives complete context
   ├─ Classifies priority, skills, duration
   ├─ Outputs classification with confidence
   └─ Event: work_order.classified

4. Rules Engine evaluates
   ├─ Check confidence threshold
   ├─ Check safety concerns
   ├─ Route: auto-assign OR review OR escalate
   └─ Event: routing.decided

5a. If auto-assign route:
   ├─ Assignment Agent triggered
   ├─ Selects tech, time, generates reasoning
   ├─ Event: assignment.created
   ├─ Notify tenant (SMS Agent)
   ├─ Notify tech (SMS Agent)
   └─ Event: assignment.confirmed

5b. If review route:
   ├─ Queue for coordinator review
   ├─ Cache AI recommendation
   └─ Event: review.queued

5c. If escalate route:
   ├─ Notify coordinator immediately
   ├─ Notify property manager
   └─ Event: escalation.created
```

### Override Flow (Dean Pulls Technician)

```
1. Dean marks tech as overridden
   └─ Event: tech.overridden
   
2. Override Handler triggered
   ├─ Identify displaced work orders
   ├─ Mark displaced orders as needs_reassignment
   ├─ Notify coordinator
   └─ Event: work_orders.displaced

3. Reassignment Workflow triggered
   ├─ For each displaced order:
   ├─ Re-run Assignment Agent
   ├─ Generate new recommendations
   ├─ If confidence >85%, auto-reschedule
   └─ If confidence <85%, queue for coordinator

4. Notification Workflow
   ├─ Text affected tenants: "Your appointment moved to..."
   ├─ Update coordinator dashboard
   └─ Log override reason and impact
```

---

## UI State Management

### Real-Time Updates

**WebSocket Events:**
```javascript
// Subscribe to events
socket.on('work_order.created', (data) => {
  // Add new card to unscheduled list
  // Show notification: "New ceiling leak - Building A"
});

socket.on('assignment.created', (data) => {
  // Move card from unscheduled to calendar
  // Show notification: "Auto-assigned to Ramon"
  // Update tech capacity ring
});

socket.on('tech.overridden', (data) => {
  // Highlight affected calendar block
  // Show override badge: "Dean - Turnover"
  // Move displaced orders back to unscheduled
});
```

### Context Display Logic

**On Work Order Click:**
```javascript
// Show cached AI analysis immediately (no loading)
const analysis = cache.get(`ai_analysis_${workOrderId}`);

// Display in right panel:
// - AI confidence and recommendation
// - Reasoning points
// - Warnings
// - Alternatives
// - Full context (tenant, unit, historical)
```

**On Hover Over Calendar Slot (while dragging):**
```javascript
// Show compatibility instantly
const compatibility = calculateSlotCompatibility(
  workOrder,
  technician,
  day,
  timeSlot
);

// Display:
// - Green: Optimal match (skills + availability + capacity)
// - Amber: At capacity but possible
// - Red: Tenant unavailable
// - Gray: Missing required skills
```

**On Accept AI Suggestion:**
```javascript
// One-click action
async function acceptAISuggestion(workOrderId) {
  // Fire event: assignment.confirmed
  await api.post('/assignments/accept-ai', {
    work_order_id: workOrderId,
    accepted_by: 'coordinator',
    timestamp: now()
  });
  
  // Event triggers:
  // 1. SMS to tenant
  // 2. SMS to tech
  // 3. Calendar update
  // 4. Capacity update
  // 5. Dashboard refresh
}
```

---

## Performance Targets

### Context Assembly
- **Target:** <500ms for complete context
- **Components:**
  - Structured DB queries: <100ms
  - Vector similarity search: <200ms
  - Redis cache lookup: <10ms
  - Context packaging: <50ms
  - Buffer: 140ms

### AI Agent Response
- **Classification:** <2 seconds
- **Assignment Recommendation:** <3 seconds
- **Total from creation to recommendation:** <5 seconds

### UI Responsiveness
- **Click to detail view:** <50ms (cached)
- **Drag interaction feedback:** <16ms (60fps)
- **Event propagation:** <100ms
- **Calendar update:** <200ms

---

## Metrics & Monitoring

### System Health Metrics

**Auto-Assignment Rate:**
- Target: >70% of work orders auto-assigned
- Measure: (Auto-assigned / Total created) × 100
- Alert: If drops below 60%

**AI Confidence Distribution:**
- High (>85%): Should be 70%+
- Medium (60-84%): Should be 20-25%
- Low (<60%): Should be <10%

**Override Rate:**
- Target: <15% coordinator overrides AI
- Measure: (Manual assignments / AI suggestions) × 100
- Alert: If >25% (AI needs retraining)

### Coordinator Efficiency

**Time Spent per Work Order:**
- Auto-assigned: 0 minutes (no touch)
- Medium confidence review: <1 minute
- Low confidence escalation: 2-5 minutes
- Target: <10 minutes total daily for routine scheduling

**Decision Latency:**
- From creation to assignment: Target <6 hours
- Emergency: Target <2 hours
- Standard: Target <24 hours

### Technician Performance

**First-Time Fix Rate:**
- Target: >85% per technician
- Track by work type and technician
- Use in AI confidence scoring

**Schedule Adherence:**
- On-time arrival: >90%
- Completion within estimate: >80%
- Photo documentation compliance: 100%

---

## Critical Implementation Notes for Cursor

### Technology Stack
- **Frontend:** React 18 + Tailwind CSS
- **State:** React Context + WebSocket for real-time
- **Backend API:** FastAPI (Python) or Express (Node)
- **Database:** Supabase (Postgres + Realtime)
- **Vector DB:** Supabase pgvector or Pinecone
- **Cache:** Redis
- **AI:** Claude Sonnet 4.5 via Anthropic API
- **Events:** Supabase Realtime or custom WebSocket

### Key Decisions

**Why Supabase:**
- Single platform for SQL + Vector + Realtime
- Built-in auth and row-level security
- No separate vector DB needed (pgvector extension)
- Easy local development

**Why Event-Driven:**
- Decouples services (AI can fail, system continues)
- Real-time UI updates are natural
- Easy to add new workflows
- Audit trail is automatic (every event logged)

**Why Cache AI Recommendations:**
- Hovering shouldn't re-compute (expensive)
- 1-hour cache is fresh enough
- Coordinator sees same recommendation in UI and detail
- Re-compute only on new information

**Why Complete Context Assembly:**
- AI agents are only as good as their context
- Assemble once, use everywhere
- Workflow layer handles all querying
- Agents are stateless and fast

### Cursor Prompt Strategy

**Phase 1: Data Layer**
```
Build Supabase schema with:
- work_orders table with full context fields
- technicians table with skills, certs, capacity
- tenants table with preferences and history
- Vector column for work order descriptions
- Real-time subscriptions enabled
```

**Phase 2: Context Assembly**
```
Build context assembly service that:
- Queries all related data for a work order
- Performs vector similarity search
- Packages into standard format
- Caches result in Redis
- Returns in <500ms
```

**Phase 3: AI Agents**
```
Build Classification Agent that:
- Takes work order + complete context
- Returns priority, skills, duration, confidence
- Uses Claude Sonnet 4.5
- Includes reasoning in output

Build Assignment Agent that:
- Takes classified order + context
- Returns best tech + time + confidence
- Includes reasoning and alternatives
- Uses same Claude model
```

**Phase 4: Event System**
```
Build event bus that:
- Emits events on state changes
- Triggers workflows via subscriptions
- Logs all events to database
- Supports replay for debugging
```

**Phase 5: UI Components**
```
Build React components:
- WorkOrderCard (shows AI suggestion)
- CalendarGrid (drag-drop enabled)
- ContextPanel (displays reasoning)
- EventLog (shows real-time activity)
- WebSocket connection for live updates
```

---

## Success Criteria

### Week 1 (MVP)
- Work orders created from SMS
- Context assembled in <500ms
- AI classifies and suggests assignment
- Coordinator can accept/reject suggestion
- Calendar shows assignments

### Month 1 (Production)
- 70%+ work orders auto-assigned
- <10 minutes daily coordinator time
- Real-time updates working
- Override tracking functional
- Basic metrics dashboard

### Month 3 (Optimized)
- 80%+ auto-assignment rate
- <5% coordinator override rate
- Predictive parts ordering
- Route optimization
- Full analytics suite

---

## Anti-Patterns to Avoid

**Don't:**
- Store business logic in UI components
- Make coordinator approval required for system to function
- Query databases from AI agents (pass context instead)
- Hardcode rules in code (use Rules Engine)
- Build custom calendar from scratch (use library)

**Do:**
- Assemble context once, use everywhere
- Make AI decisions transparent (show reasoning)
- Let system work without human (auto-assign)
- Log everything (events, decisions, context)
- Keep agents stateless and fast
