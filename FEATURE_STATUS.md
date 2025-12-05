# Feature Status Guide

This document outlines which features are fully functional vs. UI-only placeholders.

---

## ✅ Fully Functional Features

These features work end-to-end with real data from Supabase or complete mock data flows:

### Core Work Order Management
- **Work Order List** - View, filter, search work orders (real Supabase data)
- **Work Order Detail** - View full details, status, messages
- **Real-time Updates** - Work orders update via Supabase realtime subscriptions
- **Priority Badges** - Color-coded priority display
- **Status Filtering** - Filter by status, priority, assignee

### Messaging
- **Message Thread** - View conversation history per work order
- **Send Messages** - Send coordinator messages (real Supabase)
- **Real-time Messages** - New messages appear instantly

### Technician Management
- **Technician List** - View all technicians with capacity
- **Capacity Display** - Current/max workload visualization
- **Skills Display** - Technician skill tags
- **Status Indicators** - Available/In-Transit/Unavailable

### Calendar & Scheduling
- **Calendar View** - Drag-and-drop scheduling interface
- **Technician Resources** - View by technician
- **Schedule Conflicts** - Capacity override warnings

### Dispatch
- **Dispatch Board** - Visual technician assignment
- **Quick Assign Panel** - Assign work orders to technicians
- **Override Flow** - Capacity override with reason/notes

---

## 🔶 Functional UI with Mock Data

These features have complete UIs but use mock/simulated data instead of real backend:

### Voice Queue (PRP-16)
- ✅ View voice submissions with transcriptions
- ✅ See AI-extracted data with confidence scores
- ✅ Multi-language display (English, Spanish, Chinese)
- ⚠️ "Create Work Order" - Creates mock WO, doesn't add to main list
- ⚠️ "Discard" - Removes from queue but no backend persistence

### Vendor Management (PRP-17)
- ✅ View vendor directory with ratings
- ✅ Filter by category, search vendors
- ✅ View active vendor requests
- ⚠️ "Add Vendor" button → Shows "coming soon" toast
- ⚠️ Vendor request responses are mock data

### GPS Location Tracking (PRP-19)
- ✅ Live map with technician positions
- ✅ Location history timeline view
- ✅ Battery level indicators
- ⚠️ Positions are simulated (Hartford, CT area)
- ⚠️ No real GPS integration

### Preventive Maintenance (PRP-20)
- ✅ View maintenance schedules
- ✅ Toggle schedules active/inactive
- ✅ View compliance deadlines
- ✅ "Generate Work Order" updates next due date
- ⚠️ "New Schedule" button → Shows "coming soon" toast
- ⚠️ Generated WOs don't appear in main work order list

### Rules Engine (PRP-22)
- ✅ View rules with conditions and actions
- ✅ Toggle rules active/inactive
- ✅ Test rules with sample data
- ✅ View version history
- ⚠️ "New Rule" button → Shows "coming soon" toast
- ⚠️ "Edit" button → Shows "coming soon" toast
- ⚠️ Rules don't actually fire on work orders

### Portfolio Dashboard (PRP-23)
- ✅ View portfolio/region/property hierarchy
- ✅ Portfolio selector filtering
- ✅ Property performance rankings
- ✅ Stats cards (units, WOs, costs)
- ⚠️ Data is mock, not connected to real properties
- ⚠️ "View" buttons navigate but filter doesn't work on WO page

### Tenant Portal (PRP-24)
- ✅ Phone verification flow (use code: 123456)
- ✅ Submit new maintenance request form
- ✅ View request status and history
- ✅ Category selection, photo upload UI
- ⚠️ Requests don't create real work orders
- ⚠️ Messages don't persist
- ⚠️ No real OTP/SMS integration

### IoT Sensors (PRP-25)
- ✅ Sensor dashboard with status cards
- ✅ Filter by sensor type
- ✅ View sensor details and readings
- ✅ Alert list with acknowledge button
- ⚠️ "Configure Thresholds" → Shows "coming soon" toast
- ⚠️ Sensor data is mock, no real IoT integration
- ⚠️ Alerts don't create work orders

---

## 🔴 UI Placeholders Only

These buttons/features show "coming soon" messages:

| Location | Button/Feature | Status |
|----------|----------------|--------|
| Rules Page | "New Rule" | Coming soon toast |
| Rules Page | Edit button (per rule) | Coming soon toast |
| Vendors Page | "Add Vendor" | Coming soon toast |
| Preventive Maintenance | "New Schedule" | Coming soon toast |
| Sensor Dashboard | "Configure Thresholds" | Coming soon toast |

---

## 🔗 Data Flow Gaps

These are known disconnections between features:

| Source | Should Create | Currently |
|--------|---------------|-----------|
| Voice Queue → Work Orders | Real WO in main list | Mock only |
| Sensor Alerts → Work Orders | Emergency WO | Mock only |
| Preventive Schedule → Work Orders | Scheduled WO | Mock only |
| Tenant Portal → Work Orders | New request WO | Mock only |

---

## 📱 Tenant Portal Access

The Tenant Portal is a separate public-facing page:
- **URL**: `/tenant-portal`
- **Demo Login**: Any phone number, code `123456`
- **Note**: Completely separate from main app, no sidebar

---

## 🔧 What's Needed for Full Functionality

### To make Voice Queue fully functional:
1. Integrate Whisper API for real transcription
2. Connect to Supabase to create actual work orders
3. Add Twilio/Telegram webhook endpoints

### To make Sensors fully functional:
1. Add sensor tables to Supabase
2. Create webhook endpoint for sensor data ingestion
3. Implement threshold checking and auto-WO creation

### To make Tenant Portal fully functional:
1. Add Twilio for real OTP verification
2. Connect to Supabase for request creation
3. Link tenant records to units

### To make Rules Engine fully functional:
1. Add rules evaluation on work order create/update
2. Implement action execution (set priority, assign, notify)
3. Add rule editor modal

---

*Last Updated: December 5, 2024*
