# Maintenance Dispatch System - Implementation Phases

## Implementation Strategy

Build in 5 phases over 12-16 weeks. Each phase is production-ready and provides value independently. No "big bang" launch - deploy incrementally.

**Key Principle:** Each phase must work standalone. If we stop after Phase 2, the system is still useful.

---

## Phase 1: Inbound Work Order Processing (Weeks 1-3)

### What Already Exists
- ✅ SMS Agent receiving messages from tenants
- ✅ AppFolio → Supabase sync (work orders flowing in)
- ✅ Vendor data in AppFolio (needs filtering)
- ✅ Basic Supabase tables (work_orders, properties, units)

### Goal
Clean up incoming data, enrich it with context, and make it ready for AI analysis.

### What Gets Built

**AppFolio Data Cleanup**
- Filter vendor list: Create "approved vendors" table in Supabase
- Only sync work orders assigned to internal techs OR approved vendors
- Ignore the noise (hundreds of one-off vendors)
- Map AppFolio fields → our schema (status codes, priority levels)
- Handle AppFolio's quirks (weird status names, missing data)

**SMS → Work Order Creation**
- When SMS received: "There's a leak in my ceiling"
- Extract: phone number → lookup tenant → get unit/building
- Create work_order record with: description, tenant_id, building, unit, source='sms'
- Auto-reply: "Got it! We'll schedule maintenance soon. Work order #2182"
- If can't identify tenant: "Please include your unit number (Building A - 205)"

**Context Enrichment on Creation**
- When work_order created (from SMS or AppFolio):
  - Load tenant history (last 10 work orders)
  - Load unit history (last 10 work orders in this unit)
  - Calculate tenant request frequency
  - Check if similar recent issues in building
  - Store enriched context in work_order.metadata JSONB field

**Technician Profile Setup**
- Create technicians table if doesn't exist
- Import Ramon, Kishan, Carlos with:
  - Skills: ['plumbing', 'general'] etc
  - Certifications: [{"type": "plumbing", "number": "45821"}]
  - Phone numbers for SMS notifications
  - Max capacity: 6 orders/day
  - Current stats: first_time_fix_rate (start at 0.85 default)

**Event Logging Foundation**
- Create events table
- Log every work order creation with source (sms/appfolio)
- Log every SMS sent/received with context
- Simple event viewer: List events, filter by type, search by work order

**Work Order List View (Simple)**
- Show all work orders, most recent first
- Filter by: status, priority, building, assigned tech
- Click work order → see details + enriched context
- Manually assign to technician (dropdown)
- Status change buttons (in_progress, completed, etc)

### Phase 1 Success Criteria
- SMS creates work order in <10 seconds
- Tenant auto-identified 90%+ of time from phone number
- AppFolio work orders syncing (only relevant ones)
- Can see enriched context (tenant history, unit history) for every work order
- Techs imported with skills and certs
- Event log shows everything happening

**Value:** Clean data foundation. SMS works end-to-end. Christine can see what's happening in real-time.

---

## Phase 2: AI Classification & Auto-Assignment (Weeks 4-6)

### Goal
AI analyzes work orders and makes assignment recommendations. 70%+ auto-assigned without human touch.

### What Gets Built

**Classification Agent**
- Takes work order + assembled context
- Returns: priority (emergency/high/medium/low), skills_required, estimated_duration
- Includes confidence score (0.0-1.0) and reasoning
- Warns about complications (multi-visit jobs, safety concerns, parts likely needed)
- Caches decision for 1 hour

**Assignment Agent**
- Takes classified work order + context
- Analyzes all technician schedules, skills, locations
- Returns: best tech, best time, confidence, reasoning
- Includes alternatives (2nd/3rd best options)
- Considers: skill match, capacity, route optimization, tenant availability

**Rules Engine**
- Auto-assign if confidence >85% AND no safety concerns
- Queue for review if confidence 60-84%
- Escalate if confidence <60% OR safety issue
- Enforce capacity limits (max 6 orders/tech/day)
- Allow emergency overrides with logged reason

**Auto-Assignment Workflow**
```
work_order.created event
  → assemble context (500ms)
  → classification agent (2s)
  → assignment agent (3s)
  → rules engine evaluates
  → if auto-approve: assign + notify + log
  → if review needed: queue for coordinator
  → if escalate: notify coordinator + manager
```

**Coordinator Review UI**
- "Auto-Assigned" tab: See what happened automatically
- "Review Queue" tab: Medium confidence items needing approval
- "Escalations" tab: Low confidence or safety issues
- For each: Show AI reasoning, accept/reject/modify
- One-click accept AI suggestion
- Override with manual assignment + reason

### Phase 2 Success Criteria
- 70%+ work orders auto-assigned
- AI confidence >85% for auto-assigned orders
- <10 minutes coordinator time for 20 work orders
- All decisions have reasoning visible to coordinator

**Value:** Christine spends 10 minutes instead of 2 hours on scheduling. AI handles routine, she handles exceptions.

---

## Phase 3: Real-Time Calendar & Drag-Drop (Weeks 7-9)

### Goal
Visual dispatch interface with smart drag-drop. Real-time updates via WebSocket.

### What Gets Built

**Calendar Grid Component**
- Week view: 5 days × N technicians × hourly slots
- Color-coded status: completed (green), in_progress (blue), scheduled (gray)
- Capacity rings on each tech showing workload
- Current location and stats per tech
- Scheduled blocks show work order details on hover

**Smart Drag-Drop**
- Drag work order from left panel to calendar
- Slots light up: green (optimal), amber (at capacity), red (unavailable), gray (no skills)
- Hover over slot shows tooltip: "✓ Drop here - Ramon available" or "⚠️ At capacity"
- Drop triggers confirmation + assignment
- Override warnings if capacity exceeded

**Context-Aware UI**
- Hover work order card → Quick AI suggestion popup (light, fast)
- Click work order card → Full detail panel (reasoning, context, alternatives)
- Drag work order → Slots show compatibility instantly
- All based on cached AI analysis (no re-computation)

**WebSocket Real-Time**
- work_order.created → Card appears in unscheduled list
- assignment.confirmed → Card moves to calendar
- tech.overridden → Calendar block highlights with warning
- status.changed → Block updates color/content
- All coordinators see updates simultaneously

**Event Log Panel**
- Shows last 20 events in real-time
- Filterable by type (assignments, communications, overrides)
- Click event → Shows full context snapshot

### Phase 3 Success Criteria
- Drag-drop feels responsive (<16ms)
- WebSocket updates arrive in <100ms
- Can handle 50+ work orders without lag
- Coordinator can assign 10 orders in <2 minutes

**Value:** Visual, intuitive interface. Christine sees everything in real-time. Drag-drop for manual overrides.

---

## Phase 4: Communication & Status Management (Weeks 10-12)

### Goal
Automated tenant/tech communication. Proper status workflow with parts tracking and access issues.

### What Gets Built

**SMS Communication Agent**
- Auto-send when work order assigned: "Maintenance scheduled Wed 2pm. Reply YES to confirm"
- Tenant responses trigger workflow: YES → confirmed, NO/time conflict → reschedule
- Tech notifications: "New assignment: Ceiling Leak - Building A-302. Details: [link]"
- "On my way" texts: Tech taps button → tenant gets "Ramon arriving in 15 min"
- Reminders: Auto-send day before, 1 hour before appointment

**Status State Machine**
```
created → needs_assignment (coordinator assigns)
  → scheduled (tenant + tech confirmed)
  → in_progress (tech checked in)
  → waiting_parts (tech: "need P-trap, back Friday")
     → scheduled (parts arrived, auto-reschedule)
  → waiting_access (tenant didn't answer door)
     → scheduled (tenant responds)
  → ready_review (tech uploads photos)
  → completed (coordinator approves)
  OR → failed_review (coordinator rejects)
     → in_progress (tech returns to fix)
```

**Parts Tracking**
- Tech can mark "waiting_parts" with list of needed parts
- System sends tenant: "Parts ordered, will return Friday 2pm"
- Doesn't count toward tech capacity while waiting
- Auto-reminder when parts arrive to reschedule
- Track which parts needed for which job types (analytics)

**Access Management**
- Tenant no-show triggers "waiting_access" status
- Auto-text tenant: "Maintenance arrived but couldn't access unit. When available?"
- Escalation after 2 failed attempts: Case worker → Legal → Eviction
- Track access issues per tenant (pattern detection)

**Photo Documentation Workflow**
- Tech uploads before/after/cleanup photos
- Location verification: GPS must match building
- AI analyzes photos for completeness
- Status auto-changes to "ready_review"
- Coordinator sees photos side-by-side
- Approve/reject with notes

**Coordinator Approval Process**
- "Ready for Review" queue shows all completed work
- Each item shows: photos, tech notes, completion checklist
- AI pre-analyzes: "Cleanup verified, work appears complete (92% confidence)"
- Approve → work_order completed, tenant survey sent
- Reject → returns to in_progress, tech notified with issue

### Phase 4 Success Criteria
- 90%+ tenants respond to scheduling texts
- 100% work orders have required photos
- <5% no-access situations (tenant compliance high)
- Coordinator approves/rejects in <30 seconds per order
- Parts delays tracked with ETAs

**Value:** Communication fully automated. Christine knows when work is really done. No "phantom completions."

---

## Phase 5: Advanced Intelligence & Optimization (Weeks 13-16)

### Goal
Predictive maintenance, route optimization, vendor integration, complete analytics.

### What Gets Built

**Predictive Maintenance**
- Analyze historical patterns: "Building A has ceiling leak every 6 months"
- Preventive work order creation: "Check Building A ceiling before next leak"
- Equipment lifecycle tracking: "Water heater in Unit 205 installed 2015, typical life 10 years - inspect now"
- Seasonal preparation: "Schedule boiler draining for all buildings before October"
- Pattern alerts: "3 ceiling leaks in Building A this year - investigate roof"

**Route Optimization**
- Cluster jobs by location when assigning
- Calculate drive time between jobs
- AI suggests: "Assign Ramon both Building A jobs (8min apart) same day"
- Track drive time vs work time (efficiency metric)
- Alert if routing is inefficient: "Carlos driving 45min between jobs - reschedule?"

**Vendor Request System**
- When no internal tech available: Auto-create vendor request
- Rules: Electrical emergency + Kishan unavailable = vendor electrician
- Send to 2-3 approved vendors: "Emergency electrical outlet - can you respond today?"
- Vendors respond with ETA and quote
- Coordinator approves vendor selection
- Same photo/completion workflow as internal techs
- Track vendor performance (response time, quality, cost)

**Advanced Analytics Dashboard**

*Operational Metrics:*
- Auto-assignment rate (target >70%)
- First-time fix rate by tech/work type
- Average time from request to completion
- Tenant satisfaction by building/tech
- Coordinator override rate (target <15%)

*Financial Metrics:*
- Cost per work order (labor + parts + overhead)
- Vendor vs internal cost comparison
- Buildings ranked by maintenance spend
- Predictive budget: "Building A trending $2k/month - investigate"

*Performance Trends:*
- Tech leaderboard (first-time fix, response time, tenant satisfaction)
- Work type trends (seasonal patterns, recurring issues)
- Building health score (maintenance frequency vs age)
- Escalation patterns (which situations need coordinator most)

*AI Performance:*
- Confidence distribution over time
- Accuracy tracking (predicted duration vs actual)
- Override reasons (why coordinator changes AI suggestions)
- Model retraining triggers (accuracy drops below threshold)

**Rules Configuration UI**
- Coordinator edits business rules without code changes
- Daily capacity limits per tech (currently 6)
- Confidence thresholds (auto-assign >85%, review 60-84%, escalate <60%)
- Emergency response requirements (2 hours max)
- Override permissions (who can pull techs)
- A/B test rules: Run two versions, measure outcomes

**Multi-Property Portfolio View**
- Switch between properties (150 current + 400 incoming)
- Compare metrics across portfolio
- Identify best/worst performing buildings
- Share techs across properties based on proximity
- Property-specific rules (some buildings have different requirements)

### Phase 5 Success Criteria
- 80%+ auto-assignment rate (improved from 70%)
- Predictive maintenance reduces emergency calls by 20%
- Route optimization saves 5+ hours tech drive time per week
- Vendor costs tracked and compared to internal
- Christine configures rules herself (no engineer needed)
- Portfolio scales to 550+ units smoothly

**Value:** System learns and improves. Prevents problems instead of reacting. Scales effortlessly to 10x the work.

---

## Technology Stack

**Frontend**
- React 18 with TypeScript
- Tailwind CSS for styling
- React Context + WebSocket for state
- FullCalendar for calendar grid
- Recharts for analytics
- React DnD for drag-drop

**Backend**
- FastAPI (Python) or Express (Node) - API layer
- Supabase for database + realtime + auth
- Redis for caching and session state
- Anthropic API (Claude Sonnet 4.5) for AI agents

**Infrastructure**
- Supabase (Postgres + pgvector + Realtime)
- Vercel or Netlify for frontend hosting
- Railway or Render for API hosting
- Redis Cloud for caching
- Anthropic API for AI

**Key Decisions**
- Supabase: Single platform for SQL + Vector + Realtime + Auth
- Event-driven: Decoupled services, easy to extend
- Context assembly: AI gets complete picture every time
- Cache aggressively: UI feels instant, AI doesn't re-compute
- WebSocket: Real-time updates without polling

---

## Migration Strategy

### Current State → Phase 1
- Import existing work orders from AppFolio
- Import tenant/property/unit data
- Create technician profiles
- Generate embeddings for historical work orders
- Test context assembly on real data

### Phase 1 → Phase 2
- Run AI classification on 50 historical work orders
- Compare AI suggestions to actual assignments
- Tune confidence thresholds based on accuracy
- Train coordinators on review queue workflow
- Deploy in "advisory mode" first (AI suggests, human always approves)

### Phase 2 → Phase 3
- Coordinators use new UI alongside old system
- Export calendar as PDF for comparison
- Gradually shift to using drag-drop instead of manual entry
- Keep old system as backup for first 2 weeks

### Phase 3 → Phase 4
- Enable SMS for one building first
- Test photo upload workflow with 2-3 techs
- Refine approval process based on coordinator feedback
- Roll out to all buildings after 1 week success

### Phase 4 → Phase 5
- Analytics in read-only mode first (observe, don't act on insights yet)
- Add vendor integration for emergencies only
- Expand vendor usage based on performance
- Enable rule editing for coordinator after training
- Predictive maintenance starts as suggestions, not auto-creation

---

## Risk Mitigation

**What Could Go Wrong:**

*AI Makes Bad Assignments:*
- Mitigation: Confidence thresholds, coordinator review queue, override tracking
- Fallback: Disable auto-assignment, queue everything for review

*Context Assembly Too Slow:*
- Mitigation: Aggressive caching, parallel queries, performance monitoring
- Fallback: Reduce context depth, prioritize speed over completeness

*WebSocket Disconnections:*
- Mitigation: Auto-reconnect, optimistic UI updates, periodic polling backup
- Fallback: Refresh button, poll every 10 seconds

*SMS Delivery Failures:*
- Mitigation: Delivery receipts, retry logic, fallback to email/call
- Fallback: Coordinator manually contacts tenant

*Coordinator Doesn't Trust AI:*
- Mitigation: Show reasoning always, track accuracy, start in advisory mode
- Fallback: Disable auto-assignment, AI suggests only

*System Overload at 550 Units:*
- Mitigation: Performance testing, database optimization, rate limiting
- Fallback: Separate databases per property cluster

**Emergency Stop:**
Every phase has an "off switch":
- Phase 2: Disable auto-assignment, queue all for review
- Phase 3: Fall back to list view instead of calendar
- Phase 4: Disable automated SMS, coordinator sends manually
- Phase 5: Turn off predictive maintenance, back to reactive

---

## Success Metrics by Phase

**Phase 1:**
- Context assembly time <500ms (P95)
- Zero data loss in event log
- 100% event attribution (who triggered what)

**Phase 2:**
- 70%+ auto-assignment rate
- AI confidence >85% for auto-assigned
- <15% coordinator override rate
- <10 minutes daily coordinator time

**Phase 3:**
- Calendar renders in <200ms
- Drag-drop response <16ms (60fps)
- WebSocket updates <100ms
- Zero conflicts (double-booking)

**Phase 4:**
- 90%+ SMS delivery rate
- 100% photo documentation compliance
- <5% no-access situations
- Coordinator approves in <30s per order

**Phase 5:**
- 80%+ auto-assignment rate
- 20% reduction in emergency calls (predictive wins)
- 5+ hours saved in drive time weekly
- Coordinator configures rules without engineer

---

## Timeline Summary

**Week 1-3:** Foundation (Database, Context, Events)
**Week 4-6:** AI Intelligence (Classification, Assignment, Auto-assign)
**Week 7-9:** Visual Interface (Calendar, Drag-drop, Real-time)
**Week 10-12:** Communication (SMS, Status, Photos, Approval)
**Week 13-16:** Advanced (Predictive, Routes, Vendors, Analytics)

**Total: 16 weeks to full system**

**Quick wins:**
- Week 3: Can see assembled context
- Week 6: AI auto-assigns 70% of work
- Week 9: Visual calendar with real-time updates
- Week 12: Full automation with coordinator approval
- Week 16: System learns and optimizes itself

Each phase is production-ready. Can pause after any phase and still have a valuable system.