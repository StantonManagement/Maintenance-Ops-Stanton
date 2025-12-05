# Maintenance Operations Center - AI Coordination System

An AI-powered maintenance coordination system that provides complete oversight and control for property maintenance operations. Built with Pydantic AI agents, this system enforces coordinator authority while automating routine tasks and providing comprehensive visibility.

## 🎯 Core Features

### **Coordinator-Controlled Operations**
- **Work Order Authority**: Only coordinator can assign work orders and mark them complete
- **Technician Restrictions**: Technicians cannot close work orders independently
- **Approval Queue**: All completed work requires coordinator review and approval
- **Emergency Override Tracking**: Monitor when technicians are pulled for urgent work

### **AI-Powered Processing**
- **Intelligent Classification**: Automatic priority assessment and time estimation
- **Photo Analysis**: AI verification of work completion and quality
- **Voice Integration**: Create work orders via phone/Telegram voice notes
- **Scheduling Optimization**: AI-suggested technician assignments with workload balancing

### **Comprehensive Communication**
- **Multi-Channel**: SMS, email, phone, and voice note integration
- **Tenant Coordination**: Automated scheduling with availability checking
- **Real-Time Updates**: Live status tracking across all components
- **Vendor Management**: Request-based vendor coordination (not assignments)

## 🏗️ System Architecture

```
maintenance-ops-system/
├── main.py                          # Main coordination agent and CLI
├── agents/
│   ├── __init__.py
│   ├── coordination_agent.py        # Primary maintenance coordinator
│   ├── voice_agent.py              # Voice processing and work order creation
│   ├── photo_analysis_agent.py     # Quality control and completion verification
│   └── vendor_agent.py             # Vendor request and management
├── foundation/
│   ├── __init__.py
│   ├── sms_agent.py                # SMS communication foundation agent
│   ├── calendar_agent.py           # Scheduling foundation agent
│   ├── rules_agent.py              # Business rules and compliance
│   └── documentation_agent.py      # File and photo management
├── models/
│   ├── __init__.py
│   ├── work_order.py               # Work order and status models
│   ├── technician.py               # Technician availability and skills
│   ├── vendor.py                   # Vendor request and response models
│   └── communication.py            # Communication and logging models
├── tools/
│   ├── __init__.py
│   ├── work_order_tools.py         # Work order management functions
│   ├── scheduling_tools.py         # Scheduling and assignment tools
│   ├── quality_control_tools.py   # Photo analysis and verification
│   └── vendor_tools.py             # Vendor request and selection tools
├── config/
│   ├── __init__.py
│   ├── settings.py                 # System configuration
│   └── rules.json                  # Maintenance coordination rules
├── cli.py                          # Command-line interface
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- OpenAI API key (for AI coordination and photo analysis)
- SMS service API key (Twilio recommended)
- Google Calendar API credentials (optional, for scheduling)
- Brave Search API key (for vendor research)

### Installation

1. **Clone and setup virtual environment**:
```bash
git clone <repository-url>
cd maintenance-ops-system
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

3. **Run the system**:
```bash
python cli.py
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# AI Model Configuration
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=openai:gpt-4
VISION_MODEL=openai:gpt-4-vision-preview

# Communication Services
SMS_API_KEY=your_twilio_api_key_here
SMS_API_SECRET=your_twilio_api_secret_here
SMS_PHONE_NUMBER=your_twilio_phone_number

# Calendar Integration (Optional)
GOOGLE_CALENDAR_CREDENTIALS_PATH=path/to/credentials.json
CALENDAR_ID=your_calendar_id

# Photo Storage
PHOTO_STORAGE_BUCKET=your_s3_bucket_name
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# System Configuration
MAX_DAILY_WORKLOAD_PER_TECH=6
EMERGENCY_RESPONSE_TIME_HOURS=2
STANDARD_RESPONSE_TIME_HOURS=72
COORDINATOR_APPROVAL_REQUIRED=true
```

### SMS Integration Setup

The system uses SMS for communication with technicians and tenants. Configure Twilio:

1. **Create Twilio Account**: Sign up at [twilio.com](https://twilio.com)
2. **Get API Credentials**: Account SID, Auth Token, and Phone Number
3. **Configure Webhooks**: Set up webhook URLs for incoming SMS processing
4. **Test Integration**: Use the CLI to send test messages

### Google Calendar Setup (Optional)

For advanced scheduling features:

1. **Enable Google Calendar API**: In Google Cloud Console
2. **Create Service Account**: Download credentials JSON file
3. **Share Calendar**: Give service account access to your maintenance calendar
4. **Configure Environment**: Set `GOOGLE_CALENDAR_CREDENTIALS_PATH`

## 🔧 Core Operations

### Work Order Lifecycle

```
1. Creation (Voice/SMS/AppFolio) → AI Classification → Priority Assignment
2. Coordinator Assignment → Technician Notification → Scheduling
3. Work Execution → Photo Documentation → "Ready for Review"
4. Coordinator Approval → Final Completion → Quality Metrics
```

### Key Principles

- **Coordinator Authority**: Only coordinator can assign work orders and mark complete
- **Technician Restrictions**: Cannot mark "Done" or "Complete" - only "Ready for Review"
- **Mandatory Documentation**: Before/after photos required with location verification
- **Workload Protection**: System prevents technician overload (max 6 orders/day)
- **Emergency Override**: Dean can pull technicians but system notifies coordinator

## 📱 CLI Commands

### Work Order Management
```bash
# Create work order from description
python cli.py create-work-order "Leaky faucet in Building A Unit 205"

# Assign technician (coordinator only)
python cli.py assign-technician WO20240820123456 TECH001

# Update status (role-based restrictions apply)
python cli.py update-status WO20240820123456 ready_review --role technician

# Coordinator approval
python cli.py approve-work-order WO20240820123456
```

### Voice Integration
```bash
# Process voice note for work order creation
python cli.py process-voice "There's water leaking in building A unit 205"

# Batch process voicemails
python cli.py process-voicemails /path/to/voicemail/folder
```

### Coordination Dashboard
```bash
# View coordinator approval queue
python cli.py approval-queue

# Check all technician activities
python cli.py technician-status

# Generate daily performance report
python cli.py daily-report
```

### Vendor Management
```bash
# Create vendor request for specialized work
python cli.py request-vendor WO20240820123456 --category specialized --skills "hvac,refrigeration"

# View vendor responses
python cli.py vendor-responses VR20240820123456
```

## 🎯 Agent Architecture

### Primary Coordination Agent
- **Role**: Main orchestrator for all maintenance operations
- **Authority**: Enforces coordinator control and business rules
- **Capabilities**: Work order processing, technician assignment, quality control
- **Tools**: Access to all foundation agents and business logic

### Voice Processing Agent
- **Role**: Convert voice input to structured work orders
- **Input**: Phone calls, Telegram voice notes, voicemails
- **Processing**: Speech-to-text, entity extraction, priority classification
- **Output**: Structured work order data with confidence scores

### Photo Analysis Agent
- **Role**: Quality control and completion verification
- **Analysis**: Before/after comparison, cleanup verification, work quality
- **Location**: GPS verification that photos taken at correct building
- **Decision**: Completion confidence, rework requirements, coordinator review

### Foundation Agents

#### SMS Agent
- **Communication**: Text messaging with technicians and tenants
- **Scheduling**: Automated appointment coordination
- **Status**: Delivery confirmation and response tracking
- **Integration**: Two-way SMS processing with work order context

#### Calendar Agent
- **Availability**: Real-time technician schedule checking
- **Optimization**: Route and time optimization for assignments
- **Conflicts**: Detection and resolution of scheduling overlaps
- **Integration**: Google Calendar, Outlook, or custom calendar systems

#### Rules Agent
- **Compliance**: Business rule enforcement and validation
- **Classification**: Priority and urgency assessment
- **Authority**: Role-based permission validation
- **Decisions**: Rule-based automated decision making

## 🔐 Security & Permissions

### Role-Based Access Control

#### Coordinator (Kristine)
- ✅ Create and assign work orders
- ✅ Mark work orders as complete
- ✅ Override AI recommendations
- ✅ Approve vendor selections
- ✅ Access all system functions

#### Technician (Ramon, Kishan)
- ✅ View assigned work orders
- ✅ Upload photos and notes
- ✅ Mark work as "ready for review"
- ❌ Cannot mark work as "complete"
- ❌ Cannot accept new work orders directly
- ❌ Cannot override coordinator decisions

#### Manager (Dean)
- ✅ Emergency technician assignment override
- ✅ View all technician activities
- ✅ Access performance analytics
- ⚠️ System notifies coordinator of overrides

### Data Protection
- **Encryption**: All communication and storage encrypted
- **Access Logs**: Comprehensive audit trail of all actions
- **Privacy**: Tenant data protection with GDPR compliance
- **Backup**: Automated backup of all work orders and communications

## 📊 Performance Metrics

### Operational Metrics
- **First-Time Completion**: >85% target (work completed without return visits)
- **Quality Pass Rate**: >90% coordinator approval without rework
- **Schedule Adherence**: >92% on-time technician arrivals
- **Tenant Satisfaction**: >88% positive feedback scores
- **Response Time**: Meet priority-based response requirements

### Technical Performance
- **AI Photo Analysis**: <45 seconds processing time
- **Work Order Creation**: <2 minutes from request to assignment
- **System Response**: <3 seconds for all user actions
- **Status Synchronization**: <10 seconds across all components

### Scaling Metrics (150 → 550 Units)
- **Technician Capacity**: Track workload distribution and optimization
- **System Performance**: Monitor response times under increased load
- **Quality Maintenance**: Ensure standards maintained during growth
- **Coordinator Workload**: Balance automation with human oversight

## 🔄 Integration Points

### AppFolio Property Management
- **Webhook**: Receive maintenance requests automatically
- **Sync**: Two-way synchronization of work order status
- **Tenant**: Access tenant contact and unit information
- **Billing**: Integration for additional work charges

### Communication Platforms
- **SMS/Twilio**: Primary technician and tenant communication
- **Email**: Formal notifications and documentation
- **Telegram**: Voice note processing for work order creation
- **Phone**: Call recording and voicemail processing

### Calendar Systems
- **Google Calendar**: Technician scheduling and availability
- **Outlook**: Integration with corporate calendar systems
- **Custom**: API integration with any calendar system

### Photo Storage
- **AWS S3**: Scalable photo storage with metadata
- **Google Cloud**: Alternative cloud storage option
- **Local**: On-premise storage for security requirements

## 🚀 Deployment Options

### Local Development
```bash
# Run locally for development and testing
python cli.py
```

### Production Deployment
```bash
# Docker container deployment
docker build -t maintenance-ops .
docker run -d --env-file .env maintenance-ops

# Or direct server deployment
pip install -r requirements.txt
python -m maintenance_ops --server --port 8080
```

### Cloud Deployment
- **AWS**: Lambda functions for serverless operation
- **Google Cloud**: App Engine for scalable deployment
- **Azure**: Container instances for cloud hosting

## 🔧 Customization

### Adding New Work Order Types
1. Update `config/rules.json` with new classification rules
2. Modify priority assessment in `agents/coordination_agent.py`
3. Add specialized handling in relevant agent tools
4. Test classification accuracy with sample descriptions

### Extending Foundation Agents
1. Create new agent in `foundation/` directory
2. Implement required interface methods
3. Add agent to main coordinator dependencies
4. Create corresponding tools in `tools/` directory

### Custom Business Rules
1. Edit `config/rules.json` for rule-based decisions
2. Modify `foundation/rules_agent.py` for complex logic
3. Update status transitions in work order models
4. Test rule enforcement across all workflows

## 📚 Documentation

### API Documentation
- **Agents**: Detailed documentation for each agent's capabilities
- **Tools**: Function reference for all available tools
- **Models**: Data model specifications and validation rules
- **Integration**: Third-party service integration guides

### Operations Manual
- **Daily Operations**: Step-by-step coordinator workflows
- **Emergency Procedures**: Crisis response and escalation procedures
- **Quality Control**: Photo standards and review processes
- **Vendor Management**: Request creation and vendor selection

### Training Materials
- **Coordinator Training**: System operation and best practices
- **Technician Training**: Mobile app usage and photo requirements
- **Manager Training**: Dashboard usage and performance analytics

## 🐛 Troubleshooting

### Common Issues

#### Work Orders Not Closing
- **Cause**: Technician trying to mark "complete" instead of "ready for review"
- **Solution**: Update status to "ready_review", coordinator approves

#### Photo Upload Failures
- **Cause**: Poor network connection or file size limits
- **Solution**: Retry upload, compress images, check connection

#### SMS Not Sending
- **Cause**: Twilio configuration or API limits
- **Solution**: Check API credentials, verify phone numbers, check usage limits

#### Calendar Sync Issues
- **Cause**: Calendar API permissions or authentication
- **Solution**: Refresh credentials, verify calendar sharing permissions

### Getting Help
- **Documentation**: Check `/docs` folder for detailed guides
- **Support**: Contact system administrator for technical issues
- **Training**: Request additional training for new features

## 🔄 System Updates

### Update Process
1. **Backup**: Export all active work orders and configurations
2. **Test**: Deploy to staging environment for validation
3. **Deploy**: Update production system during maintenance window
4. **Verify**: Confirm all integrations and workflows operational

### Version Control
- **Git**: Track all code changes with detailed commit messages
- **Releases**: Tagged releases with migration guides
- **Rollback**: Ability to revert to previous stable version

## 📈 Roadmap

### Phase 1 (Completed)
- ✅ Core work order management with coordinator control
- ✅ Voice integration for work order creation
- ✅ Photo analysis and quality control
- ✅ Basic vendor request system

### Phase 2 (In Development)
- 🔄 Advanced scheduling optimization
- 🔄 Predictive maintenance automation
- 🔄 Enhanced mobile technician interface
- 🔄 Advanced analytics and reporting

### Phase 3 (Planned)
- 📋 IoT sensor integration for predictive maintenance
- 📋 Vendor portal for direct communication
- 📋 Tenant self-service portal
- 📋 Advanced AI for maintenance predictions

## 📞 Support

### Technical Support
- **Email**: [support@maintenance-ops.com](mailto:support@maintenance-ops.com)
- **Phone**: 1-800-MAINTENANCE
- **Documentation**: [docs.maintenance-ops.com](https://docs.maintenance-ops.com)

### Emergency Contacts
- **System Admin**: 24/7 support for critical system issues
- **Coordinator**: Primary contact for operational questions
- **Manager**: Escalation for policy and procedure questions

---

*This system enforces coordinator authority while automating routine tasks. All technicians are restricted from closing work orders directly - only coordinator approval completes work orders.*