# Payments Screen — file structure

```
payments-screen/
├── PaymentsScreen.tsx        ← main screen, wires state + all modals together
├── index.ts                  ← export { PaymentsScreen }
├── types.ts                  ← shared TS types
├── theme/
│   ├── colors.ts              ← COLORS palette
│   └── styles.ts               ← all StyleSheet rules (screen + modals)
├── data/
│   └── mockData.ts            ← mock balance, cards, UPI, transactions, formatRupees()
├── icons/
│   └── index.tsx               ← all inline SVG icons
└── components/
    ├── Row.tsx                 ← Row / SectionLabel / Divider
    ├── Toast.tsx                ← toast banner
    ├── BottomSheet.tsx          ← shared slide-up modal shell
    ├── WalletModal.tsx          ← tap "Wallet" → balance + recent transactions
    ├── AddMoneyModal.tsx        ← tap "Add money" → quick chips / custom amount, updates balance
    ├── UpiModal.tsx              ← UpiDetailModal (view/set default/remove) + AddUpiModal
    └── CardModal.tsx             ← CardDetailModal (view/set default/remove) + AddCardModal
```

## What actually opens now

- **Wallet row** → opens a bottom sheet with the live balance and a recent-activity list, plus its own "Add money" button.
- **Add money row** → opens a bottom sheet with quick amount chips (₹100/250/500/1000) or a custom amount field. Confirming really adds it to `walletBalance` state — the number on the main screen updates immediately.
- **UPI row** → opens a detail sheet (VPA, default status, set-default / remove).
- **Add new UPI ID** → opens a form sheet that validates and appends to the UPI list.
- **Saved card row** → opens a detail sheet (masked number, expiry, default status, set-default / remove).
- **Add new card** → opens a form sheet (card number / expiry / name) and appends to the card list.

All of this is local component state — swap the mock data and the `on...` handlers in `PaymentsScreen.tsx` for real API calls when you wire it to your backend.

## Requirements
- `react-native-svg` (already used by the original file, for the icons)
- No navigation library needed — modals are self-contained `<Modal>` bottom sheets.
