# PRP-21: Settings & Configuration

## Goal
Build centralized settings page for system configuration, user preferences, and operational parameters.

## Success Criteria
- [ ] User profile and preferences
- [ ] Notification settings
- [ ] System defaults (capacity limits, response times)
- [ ] Integration settings (Twilio, email)
- [ ] Team management (add/remove users)
- [ ] Audit log of setting changes

---

## Context

**User roles:**
- Coordinator (full settings access)
- Technician (personal settings only)
- Manager (full access + user management)

**Key configurable items:**
- Max work orders per tech per day (default: 6)
- Response time targets by priority
- Auto-send notification templates
- Working hours and holidays

---

## Tasks

### Task 1: Settings Page Layout
- Sidebar with sections
- Sections: Profile, Notifications, System, Integrations, Team
- Route: /settings, /settings/:section

### Task 2: Profile Settings
- Name, email, phone
- Avatar upload
- Password change
- Timezone selection
- Language preference

### Task 3: Notification Settings
- Toggle each notification type
- Channels: in-app, email, SMS
- Quiet hours (no notifications between X and Y)
- Urgent override (always notify for emergency)

### Task 4: System Settings (Coordinator+)
- Max daily work orders per tech
- Response time targets by priority
- Default work order settings
- Business hours configuration
- Holiday calendar

### Task 5: Integration Settings (Manager)
- Twilio: phone number, test connection
- Email: SMTP settings, test send
- AppFolio: API key, sync status
- Supabase: connection status

### Task 6: Team Management (Manager)
- List all users
- Add new user (invite by email)
- Assign roles
- Deactivate users
- View user activity

### Task 7: Audit Log
- All setting changes logged
- Who changed what, when
- Previous value, new value
- Filter by user, date, setting type
- Export capability

---

## Files to Create
- src/pages/SettingsPage.tsx
- src/components/settings/ProfileSettings.tsx
- src/components/settings/NotificationSettings.tsx
- src/components/settings/SystemSettings.tsx
- src/components/settings/IntegrationSettings.tsx
- src/components/settings/TeamManagement.tsx
- src/components/settings/AuditLog.tsx
- src/hooks/useSettings.ts

---

## Anti-Patterns
- ❌ Don't expose integration secrets in UI
- ❌ Don't allow self-role-elevation
- ❌ Don't skip audit logging for changes
- ❌ Don't forget to validate before save

---

## Phase: 2
