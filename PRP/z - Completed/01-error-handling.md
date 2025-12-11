# PRP 01: Error Handling Foundation

## Goal
Add global error boundary and toast system to prevent white-screen crashes.

## Install
```bash
npm install sonner
```

## Create Files

### 1. `src/components/ui/ErrorBoundary.tsx`
- React class component with `componentDidCatch`
- Shows friendly error UI with "Try Again" and "Go Home" buttons
- Shows error details only in development mode

### 2. `src/components/ui/Toaster.tsx`
- Wrapper around `<Toaster>` from sonner
- Position: top-right
- Use project colors: bg `#FAFAF8`, text `#1A1A1A`

### 3. `src/lib/toast.ts`
- Export `toast.success()`, `toast.error()`, `toast.warning()`, `toast.loading()`
- Export `handleApiError(error)` that returns user-friendly strings
- Handle common Supabase errors: JWT expired, duplicate key, permission denied

## Modify Files

### `src/App.tsx`
- Wrap entire app in `<ErrorBoundary>`
- Add `<Toaster />` component inside the app

## Validation
```bash
npm run build  # Must pass
# Manual: Throw error in a component, verify ErrorBoundary catches it
# Manual: Call toast.success('Test'), verify toast appears
```

## Patterns to Follow
- Look at existing UI components in `src/components/ui/` for styling patterns
- Match existing import structure
