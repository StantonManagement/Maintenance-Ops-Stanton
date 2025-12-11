# PRP: Syntax Error Fix Protocol

## 🚨 STOP - READ THIS FIRST

Windsurf: Do NOT make any changes until you complete ALL diagnostic steps below. 
"Unterminated regexp literal" means there's a syntax error ABOVE the reported line.

---

## Step 1: READ THE ENTIRE FILE

Before ANY fix attempt, output the following:
```
I have read the entire file. Here is my analysis:
- Total lines: [X]
- JSX tags opened: [list]
- JSX tags closed: [list]
- Potential issues found at lines: [list]
```

If you cannot do this, say "I need to read the file first" and use @file to load it.

---

## Step 2: Common Causes Checklist

Check for these IN ORDER. Stop at the first issue found:

### A. Unclosed JSX Tags
```
Look for: <Component> without matching </Component>
Look for: <Component /> that should be <Component></Component> (if it has children)
Look for: Mismatched tag names (e.g., <Div> closed with </div>)
```

### B. Unclosed Brackets/Braces
```
Count: { and } - must be equal
Count: ( and ) - must be equal  
Count: [ and ] - must be equal
Look for: Ternary without proper closing: {condition ? <A> : <B>}
```

### C. String/Template Literal Issues
```
Look for: Unclosed " or '
Look for: Unclosed ` (backtick)
Look for: Unescaped quotes inside strings
```

### D. Stray Characters
```
Look for: Lone / that could start a regex
Look for: Copy-paste artifacts (weird unicode)
Look for: Extra > or < outside JSX
```

### E. Import Statement Issues
```
Look for: Missing closing } in destructured imports
Look for: Unclosed string in import path
```

---

## Step 3: Fix Protocol

### DO:
1. Identify the EXACT line with the issue
2. Show the problematic code snippet
3. Show the fixed code snippet
4. Explain what was wrong
5. Run `npm run build` to verify

### DO NOT:
- Make multiple changes at once
- "Clean up" other code while fixing
- Add new features while fixing
- Change import structure while fixing
- Assume the error line IS the problem (it's usually earlier)

---

## Step 4: Verification

After EVERY fix attempt:
```bash
npm run build
```

If still failing:
1. Read the NEW error message
2. Go back to Step 2
3. Do NOT repeat the same fix

If passing:
```bash
npm run dev
# Verify app loads in browser
```

---

## Specific Fix: AppRouter.tsx

For THIS specific error, check:

1. **Line 79-81 area**: Is there a `<Route>` or other tag not properly closed?

2. **Look for this pattern** (broken):
```tsx
<Route path="/something" element={<SomePage />}  // Missing />
```

3. **Should be**:
```tsx
<Route path="/something" element={<SomePage />} />
```

4. **Check QueryClientProvider opening tag** - does it have a matching close?

5. **Check for conditional rendering issues**:
```tsx
// BROKEN - missing closing brace
{someCondition && <Route path="..." element={...} />
  
// FIXED
{someCondition && <Route path="..." element={...} />}
```

---

## Template Response

When fixing, respond with:

```
## Diagnostic Results
- File read: Yes
- Lines checked: 1-84
- Issue found at line: [X]
- Issue type: [unclosed tag / missing bracket / etc]

## The Problem
Line [X]: `[problematic code]`

## The Fix  
Line [X]: `[fixed code]`

## Verification
Running npm run build...
[result]
```

---

## If Error Persists After 2 Attempts

Ask the user to paste the FULL file contents (or lines 1-100) into the chat.
Do not guess. Do not make changes without seeing the actual code.
