# Phase 1: System Architecture & Components
*Foundation & Core Control Implementation*

## Core System Philosophy - Phase 1

**Coordinator Control First**: Every design decision prioritizes coordinator authority
- Technicians cannot close work orders independently
- All assignments flow through coordinator
- Quality control requires coordinator approval
- Emergency overrides notify coordinator immediately

## Essential Components Only

### 1. Entry Points (Minimal Viable)
- **AppFolio Webhook**: Basic work order creation from property management
- **Voice Input**: Phone/Telegram voice note processing for work order creation
- **SMS Webhook**: Simple technician status updates and confirmations
- **Manual Entry**: Coordinator direct work order creation

### 2. Core Coordination Agent
Simple workflow orchestrator that:
- Processes incoming requests with basic AI classification
- Enforces coordinator-only assignment rules
- Manages status transitions with role restrictions
- Maintains audit trail for all decisions

### 3. Foundation Agents (Basic Implementation)

#### SMS Agent (Essential)
- Send assignment notifications to technicians
- Receive status confirmations
- Basic tenant scheduling messages
- Coordinator alert notifications

#### Rules Agent (Minimal)
- Enforce coordinator authority rules
- Basic priority classification (Emergency/Standard/Low)
- Status transition validation
- Role-based permission checking

#### Documentation Agent (Core)
- Photo upload and basic storage
- Location verification (GPS check)
- Before/after photo requirements
- Basic metadata tracking

### 4. Data Models (Simplified)

#### Work Order (Core Fields Only)
```python
class WorkOrder:
    id: str
    title: str
    description: str
    building: str
    unit: Optional[str]
    priority: Literal["emergency", "standard", "low"]
    status: Literal["new", "assigned", "in_progress", "ready_review", "completed"]
    assigned_technician: Optional[str]
    created_at: datetime
    photos: List[Photo]
    coordinator_notes: str
    technician_notes: str
```

#### Technician (Basic)
```python
class Technician:
    id: str
    name: str
    skills: List[str]
    current_workload: int
    max_daily_workload: int = 6
    current_location: Optional[str]
```

#### Photo (Essential)
```python
class Photo:
    filename: str
    timestamp: datetime
    gps_coordinates: Optional[str]
    photo_type: Literal["before", "after", "progress"]
    verified_location: bool
```

## Phase 1 Workflow

### Work Order Creation Flow
1. **Input Received** (AppFolio, Voice, Manual)
2. **AI Basic Classification** (Emergency/Standard/Low)
3. **Coordinator Assignment Required** (No auto-assignment)
4. **Technician Notification** (SMS with work order details)
5. **Status Tracking** (In Progress → Ready for Review only)
6. **Coordinator Approval** (Required for completion)

### Status Update Flow
1. **Technician Updates Status** (Limited to "Ready for Review")
2. **Photo Verification** (Required before status change)
3. **Location Check** (GPS verification)
4. **Coordinator Review** (Manual approval/rejection)
5. **Final Completion** (Coordinator only)

### Emergency Override Flow
1. **Dean Assigns Urgent Work** (System allows override)
2. **Coordinator Notification** (Immediate SMS/email)
3. **Workload Adjustment** (Update technician capacity)
4. **Standard Process Resumes** (After emergency handled)

## Technology Stack - Phase 1

### Backend (Minimal)
- **Python 3.9+** with Pydantic AI framework
- **SQLite** (simple, file-based database for start)
- **FastAPI** (lightweight REST API)
- **Basic SMS integration** (Twilio)

### Frontend (Essential UI Only)
- **React 18** with essential components
- **Tailwind CSS** for quick styling
- **Basic routing** (React Router)
- **Simple state management** (React Context)

### Storage (Basic)
- **Local file storage** for photos (Phase 1 only)
- **SQLite database** for work orders and technicians
- **Basic backup** (daily file copy)

### Integration (Minimal)
- **Twilio SMS** for communication
- **Basic webhook endpoints** for AppFolio
- **Simple voice processing** (OpenAI Whisper)

## Phase 1 UI Components

### Core Components Only
1. **Work Order Card** - Display work order with status and photos
2. **Coordinator Dashboard** - Approval queue and technician status
3. **Simple List View** - All work orders with filtering
4. **Status Update Form** - Basic status changes with photo upload
5. **Voice Input Interface** - Record and process voice notes

### Navigation (Minimal)
- Dashboard (default view)
- Work Orders List
- Approval Queue
- Technician Status
- Voice Input

## Success Metrics - Phase 1

### Operational Compliance
- **100% Coordinator Approval**: No work orders completed without coordinator review
- **Photo Compliance**: 95% of work orders have required before/after photos
- **Voice Processing**: 80% accuracy in work order creation from voice input
- **Response Time**: Coordinator approval within 2 hours of "Ready for Review"

### Technical Performance
- **System Uptime**: 99% availability during business hours
- **Response Time**: <5 seconds for all user actions
- **Data Integrity**: Zero work orders lost or corrupted
- **Permission Enforcement**: 100% compliance with technician restrictions

## Phase 1 Limitations (By Design)

### Intentionally Excluded (For Later Phases)
- Advanced scheduling optimization
- Vendor management
- Complex analytics and reporting
- Mobile app (web-responsive only)
- Advanced AI features
- Multi-building optimization
- Preventive maintenance automation

### Known Technical Debt
- SQLite will need migration to PostgreSQL in Phase 2
- Local photo storage will move to cloud in Phase 2
- Basic UI will need enhancement in Phase 2
- Simple SMS integration will expand in Phase 2

## Security & Permissions - Phase 1

### Role-Based Access (Simple)
- **Coordinator**: Full access to all functions
- **Technician**: View assigned work, upload photos, mark "ready for review"
- **Manager (Dean)**: Emergency override with coordinator notification

### Data Protection (Basic)
- **Local encryption** for sensitive data
- **Basic audit logging** for all actions
- **Simple backup procedures**
- **Basic access controls**

## Deployment - Phase 1

### Simple Deployment Strategy
- **Single server deployment** (small VPS)
- **File-based configuration**
- **Basic monitoring** (uptime and error logging)
- **Manual backup procedures**
- **Simple rollback** (file restoration)

This Phase 1 architecture focuses exclusively on establishing coordinator control and basic workflow management. Everything else is deliberately deferred to later phases to ensure rapid, stable deployment of core functionality.