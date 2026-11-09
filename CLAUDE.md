# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arsema Mobile is a cross-platform money transfer app (MoneyGram-powered) built with React Native 0.83 + Expo SDK 55 + TypeScript. Hosted on GitLab at `gitlab.com/arsema2/arsema-mg-apps/arsema-mg-react-native`.

## Commands

```bash
npm install --legacy-peer-deps   # Install dependencies (--legacy-peer-deps required)
npx expo start                   # Start dev server
npx expo run:android             # Build & run on Android device/emulator
npx expo run:ios                 # Build & run on iOS simulator
npx prettier --write .           # Format code
npx tsc --noEmit                 # Type-check without building
```

**ADB setup (macOS)** — add to `~/.zshrc` if `adb` not found:
```bash
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH
```

**Troubleshooting:**
```bash
# Metro port conflict
lsof -ti:8081 | xargs kill -9 && npx expo start --clear

# Android device not detected
~/Library/Android/sdk/platform-tools/adb kill-server && ~/Library/Android/sdk/platform-tools/adb start-server

# Gradle .DS_Store error
find android/ -name ".DS_Store" -delete && cd android && ./gradlew clean
```

## Architecture

### Route Groups (`app/`)

| Group | Purpose | Key Screens |
|-------|---------|-------------|
| `(auth)/` | Authentication flow | sign-in, sign-up, verify-email, set-pin, confirm-pin |
| `(tabs)/` | Bottom tab navigator | index (Home), transaction, support, profile |
| `(send-money)/` | Local transfer flow | receiver-details → amount → review → enter-pin → success |
| `(receive-money)/` | Receive money + QR | details → qr-code → success |
| `(moneygram)/` | International transfers | See MoneyGram pipeline below |
| `(kyc)/` | KYC verification (multi-step) | personal-details → identity → id-card → face → liveness → bank → terms |
| `(profile)/` | Profile management | edit-profile, personal-information |
| `notifications.tsx` | Notifications list | (root-level screen) |

### MoneyGram Transfer Pipeline

Data flows via route params through each screen in order:

```
transfer (country + amount)
  → service-options (quote cards — select service)
    → beneficiary-details (receiver info + dynamic API fields)
      → sending-details (purpose, source of funds)
        → review-send (confirm all details)
          → payment-method (PUT /transactions/{id}/update)
            → review-pin (POST /pin/verify)
              → virtual-account (create VA, poll payment)
                → transaction-success
```

### Directory Structure

```
app/              # Screens (expo-router file-based routing)
components/       # Shared UI: Button, FormInput, OtpInput, PinPad, ScreenLayout, ServiceGrid, PromoCard
constants/        # colors.ts, typography.ts, api.ts
contexts/         # auth-context.tsx (useReducer), kyc-context.tsx
hooks/            # use-push-notifications.ts
interfaces/       # user.ts (IUser), transaction.ts (ITransaction)
assets/           # Images, icons (logo-arsema.png is app icon + splash)
```

## Code Style & TypeScript

- Strict TypeScript (`tsconfig.json`)
- Functional components only — no classes
- Prefer `interface` over `type`; avoid `enum` (use plain const maps)
- Named exports for components; `function` keyword for pure functions
- Boolean vars: `isLoading`, `hasError`, `canSubmit`
- File order: exported component → subcomponents → helpers → static content → types
- `StyleSheet.create()` always at bottom of file; use `Colors`/`FontSize` constants, never hardcoded values

## Key Patterns & Gotchas

### MoneyGram Proxy Token
All MoneyGram API calls require a short-lived proxy token. It is fetched from `/v1/moneygram/proxy-token` and cached in state. Pass `forceRefresh=true` to bypass cache (e.g. after a 404 response). Countries endpoint intermittently returns 404 — retry up to 3 times with fresh token.

```typescript
// Always check response.ok BEFORE parsing JSON
const text = await response.text();
if (!response.ok) throw { status: response.status, message: text };
const data = JSON.parse(text);
```

### Screen-to-Screen Data (Params Pipeline)
Transaction data flows through the entire MoneyGram pipeline via `useLocalSearchParams`. Each screen spreads `...params` when pushing to the next screen:

```typescript
router.push({ pathname: '/(moneygram)/next', params: { ...params, newField: value } });
```
Complex objects are serialized with `JSON.stringify` / `JSON.parse`.

### Dynamic Receiver Fields
`GET /v1/moneygram/transaction-fields-send` returns `fieldInfo[]` — fields with `field` starting with `receiver.` or `targetAccount.` and `required: true` must be rendered as dynamic form inputs. Apply `regEx` by stripping disallowed characters on each keystroke (not full-string validation).

### "Already Committed" Transactions
Committing an already-committed transaction returns an error. Detect with:
```typescript
message.toLowerCase().includes('already been committed')
```
Then fetch reference number from `/v1/moneygram/completed-transactions/mg/{id}` as fallback.

### Virtual Account Flow
VA is created via a separate API (`TRANSFER_VA_CREATE_URL` — Permata Bank). If `totalAmount` is 0 or `quoteData` is null, VA creation fails. Debug: check console logs for `=== CREATE VA REQUEST ===`.

### Push Notifications
- Uses native FCM token via `getDevicePushTokenAsync()` (not Expo Push Token)
- Token sent to backend at `POST /v1/devices/push-token`
- `google-services.json` must be present in project root for Android FCM
- Navigation on tap: unauthenticated → sign-in; `transaction_id` in data → transaction-detail; else → /notifications
- Cold-start handled via `getLastNotificationResponseAsync()`

## API Configuration (`constants/api.ts`)

| Constant | Description |
|----------|-------------|
| `API_BASE_URL` | `https://api-apps.arsema.co.id/api` |
| `TRANSFER_VA_CREATE_URL` | `https://apisnpdev.arsema.co.id/api/transfer-va-create` |
| `AUTH_KEY` / `AUTH_SECRET` | Basic auth for VA API |

**Required headers:**
- All API calls: `Authorization: Bearer <token>` (from `useAuth()`)
- MoneyGram calls: `+ X-Proxy-Token: <proxy_token>`
- Countries + enumerations: `+ Content-Type: application/json` (required — 404 without it)

## State Management

- `AuthContext` (`contexts/auth-context.tsx`) — `useReducer`, provides `token`, `user`, auth actions
- `KycContext` (`contexts/kyc-context.tsx`) — `useState`, holds multi-step KYC form state
- Screen-local state: `useState` / `useMemo` / `useCallback`
- Cross-screen data: route params via `useLocalSearchParams`
- No react-query, Redux, or Zustand — plain fetch + useState

## UI

- `ScreenLayout` component wraps all screens (red header + white rounded card body)
- Styling: `StyleSheet.create()` only — no styled-components or Tailwind
- Colors: `#E31E24` primary red, defined in `constants/colors.ts`
- Safe area: `SafeAreaProvider` at root, never hardcode padding for safe areas

## Transaction Status Flow

```
QUOTED → PAID → UNFUNDED → COMMITTED → AVAILABLE
```

- `PAID`: VA payment received → show "Check Payment Status" button
- `UNFUNDED`: backend processed payment → commit transaction
- `COMMITTED`: committed to MoneyGram → fetch sub-status from `/transactions/{id}/status`
- `AVAILABLE`: funds ready for pickup

## Security

- HTTPS for all API communication (`https://` in `API_BASE_URL`)
- Sensitive data: `react-native-encrypted-storage`
- Sanitize inputs; `regEx` from API drives input filtering on dynamic fields

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->