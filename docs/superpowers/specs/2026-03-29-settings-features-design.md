# Settings Features Design
**Date:** 2026-03-29
**Scope:** Notification Settings, Language Settings, Request Delete Account

---

## Overview

Three new features replacing "Coming Soon" placeholders in the Profile screen:
1. **Notification Settings** — per-category toggle preferences stored locally
2. **Language Settings** — EN/ID toggle applied across all screens
3. **Delete Account** — request flow with reason + backend submission

All preferences stored via AsyncStorage (no new backend endpoints for settings). Delete account submits to existing backend API.

---

## Architecture

### New Files

```
app/(profile)/
  notification-settings.tsx   # 3 toggles: Transactions, Promotions, System Alerts
  language.tsx                 # EN / ID radio selector
  delete-account.tsx           # Reason + confirm + submit request

contexts/
  language-context.tsx         # currentLanguage state + AsyncStorage persist

constants/
  translations.ts              # All UI strings in EN + ID
```

### Modified Files

```
app/_layout.tsx                # Wrap with LanguageProvider
app/(tabs)/profile.tsx         # Wire up navigation for 3 menu items
hooks/use-push-notifications.ts  # Check notif preferences before showing banner
```

### LanguageContext Integration

`LanguageProvider` wraps the app in `_layout.tsx` alongside `AuthProvider`:

```typescript
<AuthProvider>
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
</AuthProvider>
```

`useLanguage()` hook exposes:
```typescript
{
  language: 'en' | 'id',
  setLanguage: (lang: 'en' | 'id') => void,
  t: (key: string) => string,
}
```

---

## Feature 1: Notification Settings

### Screen: `notification-settings.tsx`

Three toggle rows using React Native `Switch`:

| Toggle Label | AsyncStorage Key | Default |
|---|---|---|
| Transaction Updates | `notif_transactions` | true |
| Promotions | `notif_promotions` | true |
| System Alerts | `notif_system` | true |

- Loads all toggle states from AsyncStorage on mount
- Each toggle updates AsyncStorage immediately on change
- Uses `ScreenLayout` component with title "Notification Settings"

### Foreground Notification Filtering

In `hooks/use-push-notifications.ts`, inside `addNotificationReceivedListener`:

```typescript
// Before showing foreground notification, check user preferences
const notifType = notification.request.content.data?.type; // 'transaction' | 'promotion' | 'system'
const key = typeToStorageKey(notifType); // e.g. 'notif_transactions'
const enabled = await AsyncStorage.getItem(key);
if (enabled === 'false') return; // suppress
setNotification(notification);
```

Notification `data.type` from backend maps to storage keys:
- `transaction` → `notif_transactions`
- `promotion` → `notif_promotions`
- `system` → `notif_system`

---

## Feature 2: Language Settings

### Context: `language-context.tsx`

```typescript
interface LanguageContextValue {
  language: 'en' | 'id';
  setLanguage: (lang: 'en' | 'id') => void;
  t: (key: string) => string;
}
```

- AsyncStorage key: `app_language`
- Default: `'en'` (English) on first launch
- Selecting a language: saves to AsyncStorage + updates state immediately
- `t(key)` looks up `translations[language][key]`, falls back to key if missing

### Screen: `language.tsx`

- Uses `ScreenLayout` with title "Language"
- Two tappable rows with checkmark icon on selected item:
  - 🇬🇧 English
  - 🇮🇩 Bahasa Indonesia
- Tapping a row calls `setLanguage()` — no Save button needed

### Translations: `constants/translations.ts`

Covers all UI strings across all screens:

```typescript
export const translations = {
  en: {
    // Auth
    'auth.signIn.title': 'Sign In',
    'auth.signIn.email': 'Email',
    // ... all screens
  },
  id: {
    'auth.signIn.title': 'Masuk',
    'auth.signIn.email': 'Email',
    // ... all screens
  }
}
```

Key naming convention: `<group>.<screen>.<element>` (e.g. `profile.menu.language`, `moneygram.transfer.title`)

All hardcoded strings in every screen replaced with `t('...')` calls via `useLanguage()`.

---

## Feature 3: Delete Account

### Screen: `delete-account.tsx`

**UI Elements (top to bottom):**
1. Warning banner: "This action cannot be undone. Your account and all data will be permanently deleted."
2. Dropdown: "Reason for deleting account" (required)
3. Text input: "Please describe your reason" (visible only when "Other" selected)
4. Checkbox: "I understand my account and all data will be permanently deleted"
5. Button: "Submit Request" (disabled until reason selected + checkbox checked)

**Reason options:**
- "I no longer use this service"
- "Privacy concerns"
- "Too complicated to use"
- "Switching to another service"
- "Other"

### API Call

```
POST /v1/account/delete-request
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Privacy concerns",
  "detail": "optional free-text if Other selected"
}
```

### Post-Submit Flow

**Success:**
1. Call `signOut()` from AuthContext
2. `router.replace('/(auth)/sign-in')`
3. Show Alert: "Your delete request has been submitted. We will process it within 3-5 business days."

**Error — pending transactions:**
- Detect via response status/message from backend
- Show Alert: "You have pending transactions. Please wait until they are completed before deleting your account."

**Other errors:**
- Show Alert with error message from backend

---

## Profile Screen Updates

Wire up 3 existing placeholder menu items in `app/(tabs)/profile.tsx`:

```typescript
// Before (Coming Soon):
Alert.alert('Coming Soon', ...)

// After:
case 'notification-settings': router.push('/(profile)/notification-settings'); break;
case 'language':              router.push('/(profile)/language'); break;
case 'delete-account':        router.push('/(profile)/delete-account'); break;
```

Add "Delete Account" as a new menu item with destructive red color (like Logout).

---

## State Management Summary

| Concern | Storage | Scope |
|---|---|---|
| Language preference | AsyncStorage `app_language` | Global (LanguageContext) |
| Notification toggles | AsyncStorage `notif_*` | Per-screen read + hook filter |
| Delete request | Backend API | One-time action |

---

## Out of Scope

- Push notification channel management on Android (FCM channels remain always active; filtering is UI-only)
- Backend sync of notification preferences across devices
- Account deletion confirmation via email (backend responsibility)
- Translation of dynamic API content (country names, error messages from backend)
