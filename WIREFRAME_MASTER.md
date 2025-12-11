# Master Application Wireframe & Layout Specification
**Version:** 1.0  
**Date:** Dec 10, 2025

This document defines the layout structure, component hierarchy, and whitespace specifications for the Maintenance Ops Center application.

---

## 1. Global Layout Architecture

The application uses a **Sidebar-Left / Content-Right** pattern. The root container must fill the entire viewport (`100vw`, `100vh`) and use `display: flex`.

### 1.1 Root Container
-   **Dimensions:** `100vw` x `100vh`
-   **Display:** `flex`
-   **Background:** `var(--bg-primary)` (Base application background)
-   **Overflow:** `hidden` (Scroll handling is delegated to sub-containers)

### 1.2 Navigation Sidebar (`NavigationSidebar.tsx`)
-   **Position:** Fixed Left
-   **Width:** `240px` (Fixed)
-   **Height:** `100vh`
-   **Border:** Right border `1px solid var(--border-default)`
-   **Background:** `var(--bg-card)`
-   **Padding:**
    -   **Header:** `h-12` (48px) | `px-6`
    -   **User Info:** `py-6` | `px-6`
    -   **Nav Items:** `py-4` | `px-3`
-   **Whitespace Intent:**
    -   Distinct separation between "System Navigation" (Work Orders, etc.) and "Global Actions" (Active Alerts).

### 1.3 Main Content Area (`Outlet` / Page Component)
-   **Position:** Relative (Right of Sidebar)
-   **Width:** `flex-1` (Takes remaining horizontal space)
-   **Height:** `100%`
-   **Behavior:** Must contain its own scrolling logic (`overflow-y-auto`).
-   **Critical Requirement:** The root element of *every* page component must have `flex-1` and `h-full` to prevent layout collapse.

---

## 2. Page-Specific Wireframes

### 2.1 Dispatch Center (`DispatchPage.tsx`)

**Layout Mode:** Grid View (Standard)

*   **Container:** `flex flex-col h-full w-full`
*   **Header Bar:**
    -   **Height:** `h-14` (56px)
    -   **Padding:** `px-6`
    -   **Border:** Bottom
    -   **Content:** Title ("Dispatch Center") left, View Toggles right.
*   **Scrollable Area:** `flex-1 overflow-y-auto relative`
    -   **Padding:** `pt-6` (Top padding for widgets)
*   **Widgets:**
    -   **OverloadedTechsWidget:** `px-6` horizontal margin.
    -   **TechnicianGrid:** `p-6` (24px) padding all around.
        -   **Grid Gap:** `gap-6` (24px)
        -   **Columns:** `grid-cols-1` (Mobile) -> `md:grid-cols-2` -> `lg:grid-cols-3`
*   **Floating Elements:**
    -   **Minimap:** `fixed bottom-24 right-6`
    -   **Dimensions:** `w-64 h-48`
    -   **Z-Index:** 20 (Above grid content)

**Layout Mode:** Map View

*   **Container:** `h-full p-4`
*   **Map Canvas:** `h-full w-full rounded-lg`
*   **Whitespace:** 16px (`p-4`) margin around the map canvas to frame it within the application shell.

### 2.2 Technicians Management (`TechniciansView.tsx`)

**Layout Pattern:** Split Panel (Sidebar + Grid)

*   **Container:** `flex-1 flex flex-col h-full`
*   **Header:** `h-16` | `px-6`
*   **Content Split:** `flex-1 flex overflow-hidden`
    *   **Left Panel (Stats & Filters):**
        -   **Width:** `w-[280px]` (Fixed)
        -   **Border:** Right
        -   **Padding:** `p-6`
        -   **Whitespace:** Vertical stack with `space-y-6` between sections.
    *   **Right Panel (Technician Cards):**
        -   **Width:** `flex-1`
        -   **Overflow:** `overflow-y-auto`
        -   **Padding:** `p-6`
        -   **Grid:** `grid-cols-2` (Standard Desktop)
        -   **Gap:** `gap-6`

### 2.3 Property Operations (`PropertyOperationsDashboard.tsx`)

**Layout Pattern:** Dashboard / Widget Grid

*   **Container:** `p-6 space-y-6 h-full flex flex-col flex-1 overflow-y-auto`
*   **Header:** Simple text header with date.
*   **Summary Stats Grid:**
    -   **Layout:** `grid-cols-4`
    -   **Gap:** `gap-4`
    -   **Card Padding:** `p-4`
*   **Stuck Work Orders Widget:** Full width container.
*   **Property Health List:**
    -   **Spacing:** `space-y-4` (16px vertical gap between cards)
    -   **Card Height:** Dynamic based on content.

### 2.4 Work Orders List (`WorkOrdersPage.tsx` + `WorkOrderList.tsx`)

**Layout Pattern:** Three-Column (Sidebar | List | Detail)

1.  **List Column (Center)**
    -   **Width:** `flex-1`
    -   **Header:** `h-16 px-6`
    -   **Filter Bar:** `h-10 px-6` (Sub-header)
    -   **Content:**
        -   **Table Mode:** Full width table.
        -   **Card Mode:** `px-6` padding for card container.
2.  **Detail Column (Right Preview)**
    -   **Width:** `w-[480px]` (Fixed)
    -   **Animation:** Slide-in from right.
    -   **Border:** Left
    -   **Background:** `bg-card`
    -   **Padding:** `p-6` internal content padding.

---

## 3. Whitespace & Spacing System

The application uses a 4-point grid system, implemented via Tailwind utility classes.

| Concept | Tailwind Class | Pixel Value | Usage |
| :--- | :--- | :--- | :--- |
| **Container Padding** | `p-6` | `24px` | Standard page wrapper padding. |
| **Section Gap** | `gap-6` / `space-y-6` | `24px` | Distance between major widgets (e.g., Grid vs Stats). |
| **Component Gap** | `gap-4` | `16px` | Distance between cards in a grid or items in a list. |
| **Header Height** | `h-16` | `64px` | Primary view headers. |
| **Sub-Header Height** | `h-14` | `56px` | Secondary headers (e.g., Dispatch toolbar). |
| **Filter Bar Height** | `h-10` | `40px` | Dense filter rows. |
| **Element Radius** | `rounded-lg` | `0.5rem` | Standard card border radius. |

## 4. Z-Index Layering

1.  **Base Content:** `z-0`
2.  **Sticky Headers:** `z-10`
3.  **Floating Widgets (Minimap):** `z-20`
4.  **Modals / Dialogs:** `z-50`
5.  **Toasts / Notifications:** `z-[100]`

---

## 5. Mobile Responsiveness (Breakpoint < 768px)

*   **Sidebar:** Hidden (Hamburger menu toggle).
*   **Dispatch Grid:** Collapses to `grid-cols-1`.
*   **Detail Panels:** Full screen overlay instead of split column.
*   **Padding:** Reduced from `p-6` to `p-4`.
