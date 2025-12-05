# PRP-22: Rules Engine Configuration UI

## Goal
Enable operations team to modify business rules without code changes. Visual rule editor for routing, classification, and automation.

## Success Criteria
- [ ] List all active rules
- [ ] Visual rule editor (no code required)
- [ ] Test rule with sample data
- [ ] Version history with rollback
- [ ] A/B testing capability
- [ ] Rule analytics (how often fired)

---

## Context

**From Rules Agent doc:**
- Rules stored as data (JSON), not code
- Changes live immediately
- Operations team can edit without engineers
- Track which rules work, which don't

**Rule types:**
- Priority classification rules
- Assignment routing rules
- Capacity limit rules
- Notification trigger rules
- Financial categorization rules

---

## Tasks

### Task 1: Rules Library Page
- List all rules grouped by type
- Filter: active/inactive, type
- Search by name/keyword
- Usage stats (fires per week)
- Route: /rules

### Task 2: Rule Card Component
- Rule name and description
- Type badge
- Active/inactive toggle
- Last modified date
- Fire count
- Edit button

### Task 3: Visual Rule Editor
- Modal or full page
- Conditions builder (dropdown operators)
- If-then-else logic
- Multiple conditions with AND/OR
- Actions: classify, assign, notify, escalate
- Save as draft or publish

### Task 4: Condition Builder
- Field selector (work order fields)
- Operator selector (equals, contains, greater than, etc.)
- Value input (text, number, dropdown for enums)
- Add condition, remove condition
- Group conditions with AND/OR

### Task 5: Rule Test Panel
- Enter sample work order data
- "Test Rule" button
- Shows: would this rule match?
- Shows: what action would trigger?
- Useful before publishing

### Task 6: Version History
- Every save creates version
- List of versions with timestamps
- Compare versions side-by-side
- Rollback to previous version
- Note who made each change

### Task 7: Rule Analytics
- How often rule fires
- Success rate (if measurable)
- Override rate (humans changed decision)
- Trend over time
- Identify unused rules

### Task 8: A/B Testing
- Create variant of rule
- Split traffic (50/50 or custom)
- Track outcomes per variant
- Promote winner to production

---

## Files to Create
- src/pages/RulesPage.tsx
- src/components/rules/RulesLibrary.tsx
- src/components/rules/RuleCard.tsx
- src/components/rules/RuleEditor.tsx
- src/components/rules/ConditionBuilder.tsx
- src/components/rules/RuleTestPanel.tsx
- src/components/rules/VersionHistory.tsx
- src/components/rules/RuleAnalytics.tsx
- src/hooks/useRules.ts

---

## Anti-Patterns
- ❌ Don't require code knowledge to edit
- ❌ Don't deploy without test capability
- ❌ Don't lose version history
- ❌ Don't allow conflicting rules without warning

---

## Phase: 3
