

# Unified Messaging Implementation

## Current State (after audit)

Most of the unification is **already in place**:
- **OnboardingModal** ✅ — already uses "Everything abroad, in one place" / "Всё для жизни за рубежом — в одном месте"
- **DiscoverHero** ✅ — already uses "Всё для жизни за рубежом" / "One place for everything abroad"
- **PWAWelcomeScreen** — file exists as dead code (not imported anywhere), needs deletion
- **HeroBlock** — subtitle says "Надёжная инфраструктура для жизни за рубежом" — slightly off from unified message
- **Brand book** — still has old positioning text, needs update

## Changes

### 1. Delete `src/components/pwa/PWAWelcomeScreen.tsx`
Dead code — not imported in App.tsx or anywhere else. Remove entirely.

### 2. Update `src/components/home/HeroBlock.tsx`
Align the guest subtitle (line 175) to the unified message:
- EN: "One place for everything abroad" (was "Your trusted infrastructure abroad")
- RU: "Всё для жизни за рубежом — в одном месте" (was "Надёжная инфраструктура для жизни за рубежом")
- Desktop tagline (line 225): same alignment

### 3. Update `.lovable/brand-book.md`
Update the positioning line to: "One place for everything abroad" / "Всё для жизни за рубежом — в одном месте"

### Files
- **Delete**: `src/components/pwa/PWAWelcomeScreen.tsx`
- **Edit**: `src/components/home/HeroBlock.tsx` (2 text strings)
- **Edit**: `.lovable/brand-book.md` (positioning section)

