# =============================================================================
# Maintenance Operations Center - Environment Configuration
# =============================================================================

# AI Model Configuration
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=openai:gpt-4
VISION_MODEL=openai:gpt-4-vision-preview
AI_CONFIDENCE_THRESHOLD=0.90

# Communication Services
SMS_API_KEY=your_twilio_api_key_here
SMS_API_SECRET=your_twilio_api_secret_here
SMS_PHONE_NUMBER=+1234567890
SMS_WEBHOOK_URL=https://your-domain.com/webhooks/sms

# Email Configuration (Optional)
EMAIL_SMTP_SERVER=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=maintenance@yourcompany.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM_ADDRESS=maintenance@yourcompany.com

# Calendar Integration (Optional)
GOOGLE_CALENDAR_CREDENTIALS_PATH=credentials/google_calendar.json
CALENDAR_ID=primary
CALENDAR_TIMEZONE=America/New_York

# Photo Storage & Analysis
PHOTO_STORAGE_PROVIDER=aws_s3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
PHOTO_STORAGE_BUCKET=maintenance-photos-bucket
MAX_PHOTO_SIZE_MB=25

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/maintenance_ops
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30

# AppFolio Integration
APPFOLIO_API_KEY=your_appfolio_api_key
APPFOLIO_BASE_URL=https://api.appfolio.com
APPFOLIO_WEBHOOK_SECRET=your_webhook_secret

# Voice Processing
SPEECH_TO_TEXT_PROVIDER=openai_whisper
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
PHONE_RECORDING_WEBHOOK=https://your-domain.com/webhooks/phone

# Vendor Management
VENDOR_REQUEST_TIMEOUT_HOURS=24
EMERGENCY_VENDOR_TIMEOUT_HOURS=2
VENDOR_NOTIFICATION_EMAIL=vendors@yourcompany.com

# System Configuration
MAX_DAILY_WORKLOAD_PER_TECH=6
EMERGENCY_RESPONSE_TIME_HOURS=2
HIGH_PRIORITY_RESPONSE_TIME_HOURS=24
STANDARD_RESPONSE_TIME_HOURS=72
COSMETIC_RESPONSE_TIME_HOURS=168

# Coordinator Authority Settings
COORDINATOR_APPROVAL_REQUIRED=true
TECHNICIAN_CAN_CLOSE_ORDERS=false
LOCATION_VERIFICATION_REQUIRED=true
MANDATORY_PHOTOS_BEFORE_COMPLETION=true

# Performance & Monitoring
LOG_LEVEL=INFO
METRICS_EXPORT_INTERVAL=300
PERFORMANCE_MONITORING=true
ERROR_NOTIFICATION_EMAIL=admin@yourcompany.com

# Security & Compliance
SESSION_SECRET_KEY=your_session_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here
AUDIT_LOG_RETENTION_DAYS=2555  # 7 years

# Rate Limiting
API_RATE_LIMIT_PER_MINUTE=60
SMS_RATE_LIMIT_PER_HOUR=100
PHOTO_UPLOAD_RATE_LIMIT=10

# Emergency Contacts
EMERGENCY_COORDINATOR_PHONE=+1234567890
EMERGENCY_MANAGER_PHONE=+1234567890
AFTER_HOURS_SUPPORT_PHONE=+1234567890

# Webhook URLs
WEBHOOK_BASE_URL=https://your-domain.com
APPFOLIO_WEBHOOK_URL=${WEBHOOK_BASE_URL}/webhooks/appfolio
SMS_WEBHOOK_URL=${WEBHOOK_BASE_URL}/webhooks/sms
PHOTO_WEBHOOK_URL=${WEBHOOK_BASE_URL}/webhooks/photos

# Development & Testing
DEVELOPMENT_MODE=false
TEST_MODE=false
MOCK_SMS_SENDING=false
MOCK_PHOTO_ANALYSIS=false
DEBUG_LOGGING=false

# Scaling Configuration (150 → 550 units)
CURRENT_UNIT_COUNT=150
TARGET_UNIT_COUNT=550
AUTO_SCALING_ENABLED=true
PERFORMANCE_MONITORING_ENHANCED=true

# Business Hours
BUSINESS_HOURS_START=08:00
BUSINESS_HOURS_END=17:00
BUSINESS_DAYS=monday,tuesday,wednesday,thursday,friday
TIMEZONE=America/New_York

# Preventive Maintenance
BOILER_MAINTENANCE_SEASON_START=09-01  # September 1st
BOILER_MAINTENANCE_DEADLINE=10-31      # October 31st
HVAC_MAINTENANCE_FREQUENCY_MONTHS=6
APPLIANCE_WARRANTY_TRACKING=true

# Quality Control Thresholds
MIN_PHOTO_QUALITY_SCORE=0.80
MIN_COMPLETION_CONFIDENCE=0.85
REWORK_THRESHOLD_PERCENTAGE=15
TENANT_SATISFACTION_TARGET=0.88

# Vendor Performance Tracking
VENDOR_RESPONSE_TIME_TARGET_HOURS=4
VENDOR_COMPLETION_RATE_TARGET=0.90
VENDOR_QUALITY_SCORE_TARGET=0.85
VENDOR_REVIEW_FREQUENCY_MONTHS=3

# Data Retention Policies
ACTIVE_WORK_ORDER_RETENTION_INDEFINITE=true
COMPLETED_WORK_ORDER_RETENTION_YEARS=7
PHOTO_RETENTION_YEARS=5
COMMUNICATION_LOG_RETENTION_YEARS=3
PERFORMANCE_DATA_RETENTION_YEARS=2

# Backup & Recovery
BACKUP_FREQUENCY_HOURS=6
BACKUP_RETENTION_DAYS=90
BACKUP_STORAGE_LOCATION=s3://maintenance-ops-backups
DISASTER_RECOVERY_RTO_HOURS=4
DISASTER_RECOVERY_RPO_HOURS=1