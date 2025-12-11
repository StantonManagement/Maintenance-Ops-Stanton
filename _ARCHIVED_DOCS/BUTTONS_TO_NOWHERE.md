# 🚫 Buttons to Nowhere & Placeholders

This document lists UI elements that are currently placeholders, disabled, or lead to incomplete features ("buttons to nowhere").

## 🏗️ Placeholder Pages
These buttons navigate to pages that exist but are just showcases or placeholders for future development.

*   **"🔮 Future Features"** (Bottom left toggle) -> `/future`
*   **"📐 Design System"** (Bottom left toggle) -> `/design`
*   **"Phase 2: Dispatch →"** (Bottom left toggle) -> `/dispatch` (Phase 2 feature)

## 🔒 Locked / Phase-Gated Navigation
These sidebar items are implemented but represent Phase 2/3 features. They are currently unlocked for demo purposes (`unlockAllFeatures = true`) but may lead to empty or incomplete pages.

*   **Calendar** (Phase 2)
*   **Technicians** (Phase 2)
*   **Dispatch** (Phase 2)
*   **Voice Queue** (Phase 2)
*   **Vendors** (Phase 2)
*   **Preventive Maint.** (Phase 3)
*   **Rules Engine** (Phase 3)
*   **Portfolio** (Phase 3)
*   **IoT Sensors** (Phase 3)
*   **Analytics** (Phase 3)
*   **Financials** (Phase 3)
*   **Override Log** (Phase 3)
*   **AI Settings** (Phase 3)
*   **Settings** (Phase 3)

## 🛠️ Incomplete Actions (Console Log Only)
These buttons trigger a modal or action that currently only logs to the browser console.

*   **"Bulk Assign"** (Work Order List) -> `console.log`
*   **"Bulk Message"** (Work Order List) -> `console.log`

## 🛑 Visual-Only / Disabled Elements
These buttons exist in the UI but have no attached functionality or are explicitly disabled.

*   **"View Roadmap"** (Sidebar "Coming Soon" card) -> No `onClick` handler.
*   **"Location Alerts"** (Work Order List filter) -> Visually disabled/locked.
*   **"Emergency"** (Work Order List filter chip) -> No logic implemented.
*   **"Today's Schedule"** (Work Order List filter chip) -> No logic implemented.
*   **"Oldest First"** (Approval Queue filter) -> No sorting logic.
*   **"Over 12h"** (Approval Queue filter) -> No filtering logic.
