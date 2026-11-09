# Arsema Mobile

A cross-platform mobile money transfer application powered by MoneyGram, built with React Native 0.83, Expo SDK 55, and TypeScript.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [State Management](#state-management)
- [API Reference](#api-reference)
- [Environment Configuration](#environment-configuration)
- [Push Notifications](#push-notifications)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)

---

## Overview

Arsema Mobile enables users to send and receive money domestically and internationally via MoneyGram. Key features:

- **International Transfers** — Send to 200+ countries through MoneyGram
- **Local Transfers** — Domestic peer-to-peer with QR code support
- **KYC Verification** — Multi-step identity verification with ID scanning and liveness detection
- **Virtual Account Payments** — Permata Bank VA for funding transactions
- **Push Notifications** — FCM-based real-time transaction status alerts
- **Notification Center** — In-app notification list with read/unread state
- **Multi-currency Quotes** — Live exchange rates with fee breakdowns and promo code support

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.83 + Expo SDK 55 |
| Language | TypeScript (strict mode) |
| Navigation | expo-router (file-based routing) |
| State | React Context + useReducer |
| Validation | Zod |
| Push Notifications | expo-notifications + Firebase FCM |
| Camera | react-native-vision-camera |
| Graphics | @shopify/react-native-skia |
| Animations | react-native-reanimated 4.x |

---

## Prerequisites

- **Node.js** >= 18.x
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli`
- **Android Studio** with SDK 26+ (for Android)
- **Xcode 15+** (for iOS, macOS only)

**macOS — add ADB to PATH** (`~/.zshrc`):
```bash
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH
```

---

## Getting Started

```bash
# 1. Clone
git clone git@gitlab.com:arsema2/arsema-mg-apps/arsema-mg-react-native.git
cd arsema-mg-react-native

# 2. Install (--legacy-peer-deps required)
npm install --legacy-peer-deps

# 3. Start dev server
npx expo start

# 4. Run on device
npx expo run:android   # Android
npx expo run:ios       # iOS

# 5. Format
npx prettier --write .

# 6. Type-check
npx tsc --noEmit
```

---

## Project Structure

```
arsema-mg-react-native/
├── app/                          # Screens — expo-router file-based routing
│   ├── _layout.tsx               # Root layout (SafeAreaProvider + AuthProvider + Push Notifications)
│   ├── index.tsx                 # Splash screen (2s redirect)
│   ├── notifications.tsx         # Notification center
│   ├── (auth)/                   # Auth flow
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── verify-email.tsx
│   │   ├── forgot-password.tsx
│   │   ├── set-pin.tsx
│   │   └── confirm-pin.tsx
│   ├── (tabs)/                   # Bottom tab navigator
│   │   ├── index.tsx             # Home — services grid, promo, unread badge
│   │   ├── transaction.tsx       # Transaction history
│   │   ├── support.tsx
│   │   └── profile.tsx
│   ├── (send-money)/             # Local transfer flow
│   ├── (receive-money)/          # Receive + QR code flow
│   ├── (moneygram)/              # International MoneyGram transfer
│   │   ├── transfer.tsx          # Country + amount + promo code
│   │   ├── destination-country.tsx
│   │   ├── send-quote.tsx
│   │   ├── service-options.tsx   # Quote cards (fee, rate, delivery)
│   │   ├── beneficiary-details.tsx  # Receiver + dynamic API fields
│   │   ├── sending-details.tsx
│   │   ├── review-send.tsx
│   │   ├── payment-method.tsx    # PUT update transaction
│   │   ├── review-pin.tsx
│   │   ├── virtual-account.tsx   # VA generation + payment polling
│   │   ├── transaction-success.tsx
│   │   └── transaction-detail.tsx
│   ├── (kyc)/                    # KYC multi-step verification
│   │   ├── personal-details.tsx
│   │   ├── identity-information.tsx
│   │   ├── verify-id-card.tsx
│   │   ├── verify-face.tsx
│   │   ├── liveness-detection.tsx
│   │   ├── bank-account.tsx
│   │   ├── terms-and-conditions.tsx
│   │   └── success.tsx
│   └── (profile)/
│       ├── edit-profile.tsx
│       └── personal-information.tsx
├── components/                   # Shared UI components
│   ├── screen-layout.tsx         # Red header + white card body (used by all screens)
│   ├── button.tsx
│   ├── form-input.tsx
│   ├── otp-input.tsx
│   ├── pin-pad.tsx
│   ├── promo-card.tsx
│   └── service-grid.tsx
├── constants/
│   ├── api.ts                    # API URLs, auth keys
│   ├── colors.ts                 # Theme: primary #E31E24
│   └── typography.ts             # Font sizes and weights
├── contexts/
│   ├── auth-context.tsx          # Auth state (token, user, signIn/Out/Up)
│   └── kyc-context.tsx           # KYC multi-step form state
├── hooks/
│   └── use-push-notifications.ts # FCM registration, listeners, navigation
├── interfaces/
│   ├── user.ts                   # IUser interface
│   └── transaction.ts            # ITransaction interface
├── assets/                       # logo-arsema.png (app icon + splash + notifications)
├── google-services.json          # Firebase config for Android FCM
├── app.json                      # Expo config
└── package.json
```

---

## Architecture

### MoneyGram Transfer Pipeline

The international transfer is a multi-step pipeline. Data passes between screens via route params (`...params` spread):

```
transfer → service-options → beneficiary-details → sending-details
  → review-send → payment-method → review-pin → virtual-account → transaction-success
```

### Transaction Lifecycle

| Status | Description | UI Action |
|--------|-------------|-----------|
| `QUOTED` | Quote created | Select service option |
| `PAID` | VA payment received | Show "Check Payment Status" button |
| `UNFUNDED` | Payment processing | Auto-commit transaction |
| `COMMITTED` | Sent to MoneyGram | Fetch & display sub-status |
| `AVAILABLE` | Ready for pickup | — |

### Key Patterns

**Proxy Token** — All MoneyGram API calls require `X-Proxy-Token` header. Token is fetched from `/v1/moneygram/proxy-token`, cached in state, and refreshed on 404.

**Dynamic Fields** — `GET /v1/moneygram/transaction-fields-send` returns `fieldInfo[]`. Fields with `field` starting with `receiver.` or `targetAccount.` and `required: true` are rendered as dynamic form inputs with `regEx`-based input filtering.

**Already Committed** — Committing an already-committed transaction is handled by detecting the error message and fetching the reference number from `/completed-transactions/mg/{id}`.

---

## State Management

| Concern | Solution |
|---------|----------|
| Auth (token, user) | `AuthContext` + `useReducer` |
| KYC form steps | `KycContext` + `useState` |
| Cross-screen data | Route params via `useLocalSearchParams` |
| Component state | `useState` / `useMemo` / `useCallback` |

No react-query, Redux, or Zustand — plain `fetch` + `useState`.

---

## API Reference

### Primary API (`https://api-apps.arsema.co.id/api`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/auth/register` | POST | Sign up |
| `/v1/auth/login` | POST | Sign in |
| `/v1/auth/verify-otp` | POST | Email verification |
| `/v1/pin/verify` | POST | PIN verification |
| `/v1/pin/setup` | POST | PIN setup |
| `/v1/moneygram/proxy-token` | GET | MoneyGram proxy token |
| `/v1/moneygram/countries` | GET | Destination countries list |
| `/v1/moneygram/enumerations` | GET | Dropdown options |
| `/v1/moneygram/transaction-fields-send` | GET | Dynamic receiver fields |
| `/v1/moneygram/transactions/quote` | POST | Create quote |
| `/v1/moneygram/transactions/{id}/update` | PUT | Update transaction |
| `/v1/moneygram/transactions/{id}/commit` | PUT | Commit transaction |
| `/v1/moneygram/transactions/{id}/status` | GET | Transaction status + sub-status |
| `/v1/moneygram/transactions/{id}/check-va-status` | POST | Check VA payment |
| `/v1/moneygram/completed-transactions/mg/{id}` | GET | Completed transaction detail |
| `/v1/moneygram/transactions` | GET | Transaction history |
| `/v1/notifications` | GET | Notification list |
| `/v1/notifications/unread-count` | GET | Unread count |
| `/v1/notifications/{id}/read` | PUT | Mark as read |
| `/v1/devices/push-token` | POST | Register FCM push token |

### Virtual Account API (`https://apisnpdev.arsema.co.id`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transfer-va-create` | POST | Create Permata Bank VA |

### Required Headers

```
# All primary API calls
Authorization: Bearer <user_token>

# MoneyGram endpoints (additional)
X-Proxy-Token: <proxy_token>
Content-Type: application/json    # Required for countries + enumerations

# VA API
Authorization: Basic <base64(AUTH_KEY:AUTH_SECRET)>
```

---

## Environment Configuration

All config in `constants/api.ts`:

| Variable | Value | Description |
|----------|-------|-------------|
| `API_BASE_URL` | `https://api-apps.arsema.co.id/api` | Primary backend |
| `TRANSFER_VA_CREATE_URL` | `https://apisnpdev.arsema.co.id/api/transfer-va-create` | VA creation |
| `AUTH_KEY` | *(see api.ts)* | VA API key |
| `AUTH_SECRET` | *(see api.ts)* | VA API secret |

### App Config (`app.json`)

| Key | Value |
|-----|-------|
| Bundle ID (iOS) | `com.arsema.mg` |
| Package (Android) | `com.arsema.mg` |
| Min SDK | 26 |
| Deep link scheme | `arsema-mobile` |
| EAS Project ID | `cbb38c58-a4be-4f04-ae66-e681528c27fc` |

---

## Push Notifications

Uses **native FCM device token** (not Expo Push Token) via `expo-notifications`.

### Setup

1. `google-services.json` must be in project root (Firebase Android config)
2. Registered in `app.json` under `android.googleServicesFile`
3. Hook: `hooks/use-push-notifications.ts` — registered in `app/_layout.tsx`

### Flow

```
App launches
  → registerForPushNotifications() → getDevicePushTokenAsync()
    → POST /v1/devices/push-token { push_token, platform, device_name }
      → FCM token stored in backend DB (multiple per user supported)
```

### Notification Tap Navigation

| Condition | Destination |
|-----------|-------------|
| Not logged in | `/(auth)/sign-in` |
| `data.transaction_id` present | `/(moneygram)/transaction-detail` |
| Any other | `/notifications` |

### Backend Requirements

Store FCM tokens per user (multiple devices supported). Send via FCM V1 API:

```
POST https://fcm.googleapis.com/v1/projects/arsema-mg-apps/messages:send
Authorization: Bearer <oauth2_token>

{
  "message": {
    "token": "<fcm_device_token>",
    "notification": { "title": "...", "body": "..." },
    "data": { "transaction_id": "mg-12345" },
    "android": { "notification": { "channel_id": "transactions" } }
  }
}
```

---

## Building for Production

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios

# EAS Build (cloud)
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `npm install` fails | Use `npm install --legacy-peer-deps` |
| Metro port conflict | `lsof -ti:8081 \| xargs kill -9` then `npx expo start --clear` |
| Android device not detected | Enable USB Debugging; restart ADB: `adb kill-server && adb start-server` |
| Countries API 404 | App retries 3x with fresh proxy token. Check `Content-Type: application/json` header. |
| VA creation fails | Check `=== CREATE VA REQUEST ===` log. `totalAmount` must be > 0. |
| Push notifications not working | Ensure `google-services.json` exists, rebuild with `npx expo run:android`. Check `FCM device token:` log. |
| Gradle `.DS_Store` error | `find android/ -name ".DS_Store" -delete && cd android && ./gradlew clean` |
| Icon still shows blue "A" | Uninstall app from device first, then rebuild |

---

## Repository

GitLab: `gitlab.com/arsema2/arsema-mg-apps/arsema-mg-react-native`
EAS Owner: `saalll.arsema`

## License

Private — All rights reserved.
