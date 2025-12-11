# PRP-IWO-02: Morning Gate UI

## Goal
Create blocking modal that requires technicians to address all incomplete work orders before viewing their daily schedule.

## Dependencies
- PRP-IWO-01 (database schema)
- PRP-IWO-03 (auto-reschedule logic)

## Success Criteria
- [ ] Modal appears on app load if pending accountability exists
- [ ] Cannot dismiss or navigate away until all items addressed
- [ ] Each WO shows reason selection + optional notes
- [ ] Voice note recording option available
- [ ] Parts-needed shows date picker
- [ ] After submission, shows reschedule suggestion
- [ ] Tech confirms or adjusts date for auto-schedule items

---

## User Flow

```
Tech opens app
    ↓
Check: Any pending accountability?
    ↓ Yes                      ↓ No
Show Morning Gate Modal    → Show normal schedule
    ↓
For each incomplete WO:
    - Select reason
    - Add notes (optional)
    - Record voice note (optional)
    - If parts_needed: enter expected date
    ↓
Submit reason
    ↓
If can_auto_schedule:
    - Show suggested date
    - Tech confirms or picks different date
    - Execute reschedule
    ↓
If requires_coordinator:
    - Show "Sent to Kristine for review"
    - No date selection needed
    ↓
Next incomplete WO (or done)
    ↓
All addressed → Close modal → Show schedule
```

---

## Components

### `MorningGateModal`
- Full-screen blocking modal
- Cannot close via X or clicking outside
- Progress indicator: "2 of 3 items remaining"

### `IncompleteWOCard`
- Shows WO summary (ID, title, property, original date)
- Reason selector (radio buttons or dropdown)
- Conditional fields based on reason
- Notes textarea
- Voice note button

### `RescheduleSuggestionCard`
- Shows after reason submitted
- Displays: "Suggested: Wednesday Dec 11, 2pm"
- "Confirm" button (primary)
- "Choose different date" link → date picker
- For coordinator-routed: "Sent to Kristine ✓"

### `VoiceNoteRecorder`
- Record button with timer
- Playback before submit
- Uploads to storage, returns URL

---

## New Hook: `useMorningGate`

```typescript
interface MorningGateState {
  pendingItems: IncompleteAssignment[];
  currentIndex: number;
  isComplete: boolean;
  loading: boolean;
}

// Returns
{
  state: MorningGateState;
  submitReason: (data: ReasonSubmission) => Promise<void>;
  confirmReschedule: (date: Date) => Promise<void>;
  skipToCoordinator: () => Promise<void>;
  moveToNext: () => void;
}
```

---

## Gate Check Logic

On app initialization (likely in `MainLayout` or route guard):

```typescript
// Pseudocode
const { pendingItems } = usePendingAccountability(techId);

if (pendingItems.length > 0) {
  return <MorningGateModal items={pendingItems} />;
}

return <NormalAppContent />;
```

---

## Implementation Tasks

### Task 1: Create pending accountability hook
- `usePendingAccountability(techId)`
- Calls `get_tech_pending_accountability` RPC
- Returns array of assignments needing reasons

### Task 2: Create MorningGateModal
- Full-screen, non-dismissible
- Manages current item index
- Shows progress

### Task 3: Create IncompleteWOCard
- Reason selection UI
- Conditional date picker for parts
- Notes field
- Voice recording integration

### Task 4: Create RescheduleSuggestionCard
- Display suggestion from auto-reschedule
- Confirm/adjust flow
- Handle coordinator-routed display

### Task 5: Integrate gate check
- Add to MainLayout or create route guard
- Only affects technician role users
- Check on initial load and route changes

### Task 6: Voice note recording (can be Phase 2)
- MediaRecorder API integration
- Upload to Supabase storage
- Transcription can be async/later

---

## UI States

| State | Display |
|-------|---------|
| Loading pending items | Spinner |
| Has pending items | Morning Gate Modal |
| Submitting reason | Loading indicator on card |
| Showing suggestion | RescheduleSuggestionCard |
| All complete | Close modal, show schedule |
| Error | Toast + retry option |

---

## Validation
- [ ] Modal cannot be closed without addressing all items
- [ ] Reason required before submit enabled
- [ ] Parts date required when parts_needed selected
- [ ] Confirmation required before reschedule executes
- [ ] Progress indicator accurate
