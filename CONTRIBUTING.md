# Contributing to Arsema Mobile

Guidelines for contributing to this codebase.

## Development Setup

```bash
git clone git@gitlab.com:arsema2/arsema-mg-apps/arsema-mg-react-native.git
cd arsema-mg-react-native
npm install --legacy-peer-deps
npx expo start
```

## Code Style Rules

### TypeScript

- **Strict mode** is enabled (`tsconfig.json`)
- All code must be in TypeScript (`.tsx` for components, `.ts` for utilities)
- Prefer `interface` over `type` for object shapes
- Avoid `enum` -- use plain objects/maps instead:
  ```typescript
  // Bad
  enum Status { Active, Inactive }

  // Good
  const Status = { Active: 'active', Inactive: 'inactive' } as const;
  ```
- Use `function` keyword for pure utility functions
- Use arrow functions for callbacks and inline handlers

### Components

- **Functional components only** -- no class components
- **Named exports** for all components
- Use descriptive boolean variable names with auxiliary verbs:
  ```typescript
  const isLoading = true;
  const hasError = false;
  const canSubmit = true;
  ```

### File Organization

Each file should follow this ordering:
1. Imports
2. Constants / types
3. Exported component
4. Sub-components (unexported)
5. Helper functions
6. Static content
7. `StyleSheet.create()` at the bottom

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Directories | lowercase-with-dashes | `components/pin-pad/` |
| Component files | lowercase-with-dashes | `form-input.tsx` |
| Components | PascalCase | `FormInput` |
| Functions | camelCase | `handleSubmit` |
| Constants | PascalCase or UPPER_SNAKE | `Colors`, `API_BASE_URL` |
| State variables | camelCase with prefix | `isLoading`, `hasError` |

### Formatting

- **Prettier** is the formatter. Run before committing:
  ```bash
  npx prettier --write .
  ```
- Single quotes for strings
- Trailing commas
- 2-space indentation

## Architecture Guidelines

### Adding a New Screen

1. Create a `.tsx` file in the appropriate route group under `app/`
2. Register it in the group's `_layout.tsx` if using a Stack navigator
3. Export a default function component
4. Use `ScreenLayout` from `components/screen-layout.tsx` for consistent headers

### Adding a New API Endpoint

1. Use `API_BASE_URL` from `constants/api.ts` as the base
2. Include `Authorization: Bearer ${token}` from `useAuth()`
3. For MoneyGram endpoints, include `X-Proxy-Token` header
4. Always check `response.ok` before parsing JSON
5. Handle errors with user-facing alerts, not silent catches

### Passing Data Between Screens

Data flows via expo-router params:

```typescript
// Sending screen
router.push({
  pathname: '/(moneygram)/next-screen',
  params: { ...params, newField: value },
});

// Receiving screen
const params = useLocalSearchParams<Record<string, string>>();
const value = params.newField;
```

For complex objects, serialize with `JSON.stringify` and parse with `JSON.parse` on the receiving end.

### State Management

| Scope | Approach |
|-------|----------|
| App-wide auth | `AuthContext` via `useAuth()` |
| Screen-local | `useState` |
| Derived values | `useMemo` |
| Callbacks | `useCallback` |
| Cross-screen data | Route params via `useLocalSearchParams` |

Do **not** introduce new global state managers without discussion.

## UI Guidelines

### Theme Colors

Defined in `constants/colors.ts`:

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#E31E24` | Headers, CTAs, active states |
| `primaryDark` | `#C41A20` | Pressed state |
| `white` | `#FFFFFF` | Card backgrounds |
| `black` | `#1A1A1A` | Primary text |
| `gray` | `#F5F5F5` | Section backgrounds |
| `grayText` | `#999999` | Secondary/placeholder text |
| `grayBorder` | `#E0E0E0` | Dividers, input borders |
| `success` | `#4CAF50` | Success states |
| `error` | `#E31E24` | Error states |

### Typography

Defined in `constants/typography.ts`:

| Token | Size |
|-------|------|
| `xs` | 12 |
| `sm` | 14 |
| `md` | 16 |
| `lg` | 18 |
| `xl` | 20 |
| `xxl` | 24 |
| `xxxl` | 28 |
| `heading` | 32 |

### Layout Pattern

All screens use the shared `ScreenLayout` component which provides:
- Red header bar with title and optional back button
- White rounded card body
- Safe area handling

```typescript
<ScreenLayout title="Screen Title">
  <ScrollView>{/* content */}</ScrollView>
</ScreenLayout>
```

### StyleSheet

- Always use `StyleSheet.create()` at the bottom of the file
- Never use inline styles for anything beyond one-off overrides
- Use `Colors` and `FontSize` constants, not hardcoded values

## Git Workflow

### Branch Naming

```
feature/short-description
fix/bug-description
```

### Commit Messages

Use conventional commit format:
```
feat: add promo code support to quote API
fix: handle already-committed transaction error
```

### Before Pushing

1. Run the formatter: `npx prettier --write .`
2. Run tests: `npx jest`
3. Test on a physical device when touching navigation or native features

## Security

- Never commit secrets or API keys (check `constants/api.ts` changes carefully)
- Use `react-native-encrypted-storage` for sensitive data on device
- Sanitize all user inputs
- All API communication must use HTTPS in production
