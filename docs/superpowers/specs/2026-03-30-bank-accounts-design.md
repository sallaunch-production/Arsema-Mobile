# Bank Account Management — Design Spec

**Date:** 2026-03-30
**Feature:** Manage Bank Accounts (list, add, edit, delete, set primary)
**Location:** Profile settings

---

## 1. Overview

Users can manage multiple bank accounts from the profile settings. Operations supported: list all accounts, add a new account, edit an existing account, delete an account, and toggle which account is primary.

---

## 2. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/bank-accounts` | Fetch all bank accounts for authenticated user |
| POST | `/api/v1/bank-accounts` | Create a new bank account |
| PUT | `/api/v1/bank-accounts/{id}` | Update an existing bank account |
| DELETE | `/api/v1/bank-accounts/{id}` | Delete a bank account |
| GET | `/v1/banks` | Fetch available banks (name + code) for dropdown |

**Request body (POST / PUT):**
```json
{
  "bank_name": "Bank of America",
  "bank_code": "BOA",
  "account_name": "John Doe",
  "account_number": "1234567890",
  "account_type": "CHECKING",
  "is_primary": true
}
```

All requests use `Authorization: Bearer <token>` from `useAuth()`.

---

## 3. Architecture

**Approach:** Separate screens per action (matches existing profile navigation pattern).

**New files:**
- `app/(profile)/bank-accounts.tsx` — list screen
- `app/(profile)/bank-account-form.tsx` — shared add/edit form screen

**No new context** — plain `fetch` + `useState` per screen, consistent with all other profile screens.

**Navigation flow:**
```
Profile menu → "Bank Accounts"
  → /(profile)/bank-accounts (list)
      → [+ Add Account] → /(profile)/bank-account-form (add mode, no id)
      → [Edit card] → /(profile)/bank-account-form?id=...&prefilled fields (edit mode)
      → [Delete card] → Alert confirm → DELETE API → refresh list
      → [Set as Primary] → PUT API inline → update list state
```

---

## 4. List Screen (`bank-accounts.tsx`)

- `ScreenLayout` with title "Bank Accounts", back button
- Fetches `GET /api/v1/bank-accounts` on mount with loading spinner
- Each account rendered as a card:
  - Bank name (bold) + masked account number (`•••• XXXX`) + account holder name
  - "Primary" badge (red) when `is_primary: true`
  - Action row: **Set as Primary** (hidden if already primary) | **Edit** | **Delete**
- **Set as Primary**: calls `PUT /api/v1/bank-accounts/{id}` with `{ ...account, is_primary: true }`, re-fetches list on success
- **Delete**: `Alert.alert` confirmation → `DELETE /api/v1/bank-accounts/{id}` → re-fetches list
- **Empty state**: icon + "No bank accounts added yet" + "Add Account" button
- **Add button**: header right OR prominent button at bottom of list
- Full i18n via `useLanguage()` / `t()` keys

---

## 5. Add/Edit Form Screen (`bank-account-form.tsx`)

- Receives params: `id?`, `bank_name?`, `bank_code?`, `account_name?`, `account_number?`, `account_type?`, `is_primary?`
- `ScreenLayout` title: "Add Bank Account" (no id) or "Edit Bank Account" (has id)
- **Fields:**
  | Field | Input Type | Source |
  |-------|-----------|--------|
  | Bank | Dropdown picker | `GET /v1/banks` → `{ name, code }` |
  | Account Holder Name | Text input | Free text |
  | Account Number | Text input (numeric) | Free text |
  | Account Type | Dropdown | Static: `SAVINGS`, `CHECKING` |
  | Set as Primary | Switch toggle | Boolean |
- **Validation**: all fields except `is_primary` required; Submit button disabled until valid
- **Submit (add mode)**: `POST /api/v1/bank-accounts` → navigate back to list
- **Submit (edit mode)**: `PUT /api/v1/bank-accounts/{id}` → navigate back to list
- **Error handling**: inline error text below form on API failure
- Full i18n via `t()` keys

---

## 6. Profile Menu Integration

Add new menu item to `app/(tabs)/profile.tsx`:

```typescript
{ id: 'bank-accounts', icon: 'wallet-outline', label: t('profile.bankAccounts') }
```

Positioned between "Personal Information" and "Security". Navigate to `/(profile)/bank-accounts`.

---

## 7. Translations

Add to `constants/translations.ts` (both `en` and `id`):

| Key | EN | ID |
|-----|----|----|
| `profile.bankAccounts` | Bank Accounts | Rekening Bank |
| `bankAccount.title` | Bank Accounts | Rekening Bank |
| `bankAccount.addTitle` | Add Bank Account | Tambah Rekening Bank |
| `bankAccount.editTitle` | Edit Bank Account | Edit Rekening Bank |
| `bankAccount.empty` | No bank accounts added yet | Belum ada rekening bank |
| `bankAccount.addBtn` | Add Account | Tambah Rekening |
| `bankAccount.bank` | Bank | Bank |
| `bankAccount.accountName` | Account Holder Name | Nama Pemilik Rekening |
| `bankAccount.accountNumber` | Account Number | Nomor Rekening |
| `bankAccount.accountType` | Account Type | Jenis Rekening |
| `bankAccount.isPrimary` | Set as Primary | Jadikan Utama |
| `bankAccount.primaryBadge` | Primary | Utama |
| `bankAccount.setPrimary` | Set as Primary | Jadikan Utama |
| `bankAccount.edit` | Edit | Edit |
| `bankAccount.delete` | Delete | Hapus |
| `bankAccount.deleteConfirmTitle` | Delete Account | Hapus Rekening |
| `bankAccount.deleteConfirmMessage` | Are you sure you want to delete this bank account? | Yakin ingin menghapus rekening bank ini? |
| `bankAccount.deleteConfirmOk` | Delete | Hapus |
| `bankAccount.deleteConfirmCancel` | Cancel | Batal |
| `bankAccount.savingsType` | Savings | Tabungan |
| `bankAccount.checkingType` | Checking | Giro |
| `bankAccount.submit` | Save | Simpan |
| `bankAccount.errorLoad` | Failed to load bank accounts | Gagal memuat rekening bank |
| `bankAccount.errorSave` | Failed to save bank account | Gagal menyimpan rekening bank |
| `bankAccount.errorDelete` | Failed to delete bank account | Gagal menghapus rekening bank |

---

## 8. Error Handling

- API errors: show inline `Text` with red error message below the form or list
- Network failure: show alert or inline message with retry option
- `response.ok` checked before parsing JSON (existing pattern from CLAUDE.md)

---

## 9. Implementation Tasks

1. Add translation keys to `constants/translations.ts`
2. Add "Bank Accounts" menu item to `app/(tabs)/profile.tsx`
3. Create `app/(profile)/bank-accounts.tsx` (list screen)
4. Create `app/(profile)/bank-account-form.tsx` (add/edit form)
