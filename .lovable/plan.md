

## Problem

When clicking "Sign in", the login button shows a spinner indefinitely. There are **two separate loading states**:

1. **`authLoading`** (from AuthContext) — has a 5-second timeout fallback, works fine
2. **`isLoading`** (local state in Auth.tsx, line 210) — set to `true` on form submit, only cleared when `signIn()` resolves or rejects. If the Supabase connection is slow or failing (as seen in the network logs — all requests returning "Failed to fetch"), `signInWithPassword` hangs without a timeout, leaving the spinner forever.

The network logs confirm all Supabase REST calls are failing with "Failed to fetch" — a transient sandbox connectivity issue. But even in production, a slow network would cause the same infinite spinner.

## Plan

1. **Add a timeout to login and signup operations in `Auth.tsx`** — wrap `signIn()` and `signUp()` calls with a `Promise.race` against a 15-second timeout. If the timeout fires, show a toast error ("Connection timed out, please try again") and reset `isLoading` to `false`.

2. **Add a timeout helper** — a small `withTimeout(promise, ms)` utility at the top of Auth.tsx that rejects after the specified duration.

### Technical detail

```typescript
// In Auth.tsx
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), ms)
    ),
  ]);
}

// In handleLogin:
const { error } = await withTimeout(signIn(email, password), 15000);

// In catch block, detect timeout:
if (err.message === 'TIMEOUT') {
  toast.error('Connection timed out. Please check your internet and try again.');
}
```

No database changes needed. Single file edit (`src/pages/Auth.tsx`).

