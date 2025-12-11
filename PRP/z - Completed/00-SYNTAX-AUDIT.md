# PRP 00: Full Project Syntax Audit

## 🚨 MANDATORY - RUN BEFORE ANY OTHER PRP

---

## Phase 0: Inventory

```bash
# Get all source files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l
# Output: [X] files to audit

find src -type f \( -name "*.ts" -o -name "*.tsx" \) | sort
# List all files - Windsurf must check EACH ONE
```

---

## Phase 1: Bulk Error Detection

```bash
# Run TypeScript on entire project
npx tsc --noEmit 2>&1 | tee /tmp/tsc_errors.txt

# Count errors
grep -c "error TS" /tmp/tsc_errors.txt || echo "0 errors"

# Show first 10 unique files with errors
grep "error TS" /tmp/tsc_errors.txt | cut -d'(' -f1 | sort -u | head -10
```

**Fix files in this order:**
1. Entry points: `main.tsx`, `App.tsx`, `AppRouter.tsx`
2. Type definitions: `types/*.ts`, `services/supabase.ts`
3. Hooks: `hooks/*.ts`
4. Components: `components/**/*.tsx`
5. Pages: `pages/*.tsx`

---

## Phase 2: File-by-File Audit

For EACH file, verify:

### Quick Check
```bash
npx tsc --noEmit src/path/to/file.tsx 2>&1
```

### Deep Check (if errors OR for critical files)
Read entire file and output:

```
FILE: src/path/to/file.tsx
LINES: [total]
BRACKETS: { [X] } [X] | ( [X] ) [X] | [ [X] ] [X]
STATUS: [OK / FIX NEEDED]
```

---

## Phase 3: JSX Checks (all .tsx files)

For every `.tsx` file:

```
[ ] All component tags have matching close or self-close
[ ] All ternaries {x ? <A/> : <B/>} balanced
[ ] All .map() returns wrapped correctly
[ ] No orphan closing tags </Thing> without opening
[ ] No duplicate openings
```

---

## Phase 4: Import Checks

```bash
# Find potentially broken imports (unclosed braces)
grep -rn "import {" src/ | while read line; do
  if ! echo "$line" | grep -q "} from"; then
    echo "SUSPECT: $line"
  fi
done
```

---

## Phase 5: Critical Files (MUST manually verify)

### src/AppRouter.tsx ⚠️ KNOWN ISSUE
```
[ ] <Routes> ... </Routes> matched
[ ] Every <Route> self-closes OR has </Route>
[ ] <QueryClientProvider> ... </QueryClientProvider> matched
[ ] No stray / or > characters
[ ] All element={<Component />} properly closed
```

### src/App.tsx
```
[ ] Provider nesting correct
[ ] All wrappers closed
```

### src/main.tsx
```
[ ] createRoot and render correct
[ ] StrictMode wrapped if used
```

---

## Phase 6: Final Verification

```bash
# ALL must pass:
npx tsc --noEmit && echo "✓ TSC"
npm run build && echo "✓ BUILD"
timeout 10 npm run dev &>/dev/null && echo "✓ DEV SERVER"
```

---

## Fix Protocol

1. Read ENTIRE file before any changes
2. Fix issues TOP-TO-BOTTOM
3. Run `npx tsc --noEmit [file]` after each fix
4. Only move to next file when current passes

**DO NOT:**
- Fix multiple files at once
- Add new code while fixing
- Repeat same fix if it didn't work
- Guess - read the actual code first

---

## Audit Report Template

```
# SYNTAX AUDIT REPORT

Files scanned: [X]
Errors found: [X]
Errors fixed: [X]

| File | Status |
|------|--------|
| src/main.tsx | ✓ |
| src/App.tsx | ✓ |
| src/AppRouter.tsx | FIXED - unclosed Route |
| ... | ... |

Verification:
- tsc: PASS
- build: PASS
- dev: PASS

READY FOR PRP 01: YES
```

---

## Success Gate

```bash
npx tsc --noEmit && npm run build && echo "READY FOR PRP 01"
```

**DO NOT proceed until this outputs "READY FOR PRP 01"**
