# OneBuddy — React Native (Expo) + TypeScript

React Native conversion of `index__4_.html`, now in TypeScript. **No original code was changed.** Every line of
the markup, CSS and JavaScript from the upload is still here, byte for byte — just split into
the same folder layout as the JSX project and re-inlined at build time.

## Folder structure

```
onebuddy-rn/
├── App.tsx                         entry component
├── index.ts                        Expo root registration
├── tsconfig.json / expo-env.d.ts   TypeScript config
├── app.json / babel.config.js / metro.config.js / package.json
├── tools/
│   └── build-document.js           re-inlines the split files into documentSource.js
└── src/
    ├── components/
    │   └── OneBuddyMarkup.html     the original document, with the <style>/<script>
    │                               blocks lifted out and replaced by markers
    ├── styles/
    │   ├── base.css                original <style>            (verbatim)
    │   ├── sxSettings.css          original <style id="sxSettingsStyles">   (verbatim)
    │   └── hub.css                 original <style id="hubStyles">          (verbatim)
    ├── scripts/
    │   ├── main.js                 original <script>           (verbatim)
    │   ├── sxSettings.js           original <script id="sxSettingsScript">  (verbatim)
    │   └── hub.js                  original <script id="hubScript">         (verbatim)
    ├── webview/
    │   └── documentSource.ts       generated — the reassembled document as a string
    └── screens/
        └── OneBuddyScreen.tsx      the RN screen that renders it
```

The reassembled document was diffed against the upload: **identical, character for character.**

## Run it

```bash
cd onebuddy-rn
npm install
npx expo install --fix     # aligns versions with your installed Expo SDK
npx expo start
```

Then press `a` (Android), `i` (iOS), or scan the QR code with Expo Go.

## After you edit anything

Edit the real files — `src/components/OneBuddyMarkup.html`, `src/styles/*.css`,
`src/scripts/*.js` — then regenerate:

```bash
npm run build:document
```

Never edit `src/webview/documentSource.ts` by hand; it is overwritten every build.

`src/scripts/*.js` stay `.js` on purpose — that is your original browser code, shipped to the
WebView as text. It is never compiled by TypeScript (it is excluded in `tsconfig.json`), so
renaming it to `.ts` would only break the build tool without typing anything.
`babel.config.js`, `metro.config.js` and `tools/build-document.js` stay `.js` too: they are Node
config/tooling that runs before TypeScript exists.

Typecheck with:

```bash
npm run typecheck
```

## Why this shape

The upload is browser code: `document.querySelector`, CSS keyframes, `localStorage`, DOM
event listeners, inline SVG. React Native has no DOM, so keeping that code unchanged means
running it in a WebView (`react-native-webview`) inside a real RN app shell. The RN layer
handles the native parts:

- dark status bar and safe-area insets
- Android hardware back button routed to the page
- `localStorage` persistence enabled, so profile and settings survive restarts
- external links (`tel:`, `mailto:`, real `http(s)` URLs) opened in the OS instead of the page

If you later want the flows rewritten as true native `View`/`Text` components — no WebView,
no HTML — that is a rewrite, not a conversion, and it necessarily changes the code.

---

## App settings — replaced with the native screen

Dashboard → **Settings → Preferences → App settings** no longer opens the in-page HTML panel.
It now opens the native React Native screen from the `app-settings` project, over the WebView.

### What came in

Copied in verbatim from the second project (same paths, so its `@/...` imports still resolve):

```
src/screens/SettingsScreen.tsx      Appearance / Language / Location / Privacy
src/components/                     SettingsRow, CardGroup, SegmentedControl, SectionLabel,
                                    ToggleSwitch, SavedToast, LanguageModal, icons
src/context/SettingsContext.tsx     AsyncStorage persistence + expo-location
src/context/ToastContext.tsx        the "Saved" toast
src/theme/ThemeContext.tsx          light / dark / system resolution
src/theme/colors.ts                 palettes
src/i18n/                           en · hi · te translations
src/utils/responsive.ts             phone / tablet / rotation scaling
src/types/index.ts
```

### What changed

| File | Change |
| --- | --- |
| `src/components/OneBuddyMarkup.html` | The `data-screen="app"` panel is gone. The **App settings** row calls `sxOpenAppSettings()` instead of `sxGo('app')`. A hidden `#sxAppSettingsMirror` keeps the old `[data-setting]` controls so the original persistence layer still owns these values. |
| `src/scripts/nativeAppSettings.js` | **New.** The handoff: posts current values up to RN, applies values coming back. |
| `src/screens/AppSettingsHost.tsx` | **New.** Full-screen `Modal` wrapping `SettingsScreen` in its four providers, plus a reporter that pushes every change back into the document. |
| `src/screens/OneBuddyScreen.tsx` | Added `onMessage`, the modal, and Android back closing the modal first. |
| `src/context/SettingsContext.tsx` | Added an optional `seed` prop so the native screen opens showing what the WebView already had, instead of its own defaults. Nothing else touched. |
| `App.tsx` | Wrapped in `SafeAreaProvider` (required by `SettingsScreen`). |
| `babel.config.js` | Added `module-resolver` for the `@/` alias. |
| `package.json` / `app.json` | Added `async-storage`, `expo-location`, `safe-area-context`, `react-native-svg`, and the location permission strings. |

### How the two sides stay in sync

| WebView (`settings`) | Native (`SettingsState`) |
| --- | --- |
| `theme` — `system` / `light` / `dark` | `theme` — same |
| `language` — `English` / `Hindi` / `Telugu` | `language` — `en` / `hi` / `te` |
| `locationAccess` | `locationAccess` |
| `shareData` | `shareUsageData` |

Opening the row sends the left column up; every toggle sends the right column back down through
`window.sxApplyAppSettings(...)`, which writes to the hidden mirror and fires a `change` event —
so `readSettingsFromDom` → `applySettingsToDom` → `persistSettings` runs exactly as it always did.

`voiceAssistant` and `adPersonalization` lived only in the old panel. They are kept in the hidden
mirror so their saved values survive; they have no UI now, since the native screen has no
equivalent rows. Add them to `SettingsScreen.tsx` if you want them back on screen.

### Run it

```bash
npm install
npm run build:document   # only if you edit the HTML/CSS/JS sources
npx expo start
```

The native screen needs a real device or simulator (AsyncStorage + location). On `expo start --web`
there is no `ReactNativeWebView` bridge, so the row shows a note instead of opening the screen.

---

## Security & privacy — replaced with the native screen

Dashboard → **Settings → Privacy & support → Security & privacy** now opens the native screen from
the `security` project, over the WebView — same pattern as App settings above.

### What came in

The security project's `src/` was copied in whole under `src/native/`, with its folder structure
preserved so its relative imports still resolve untouched:

```
src/native/screens/Security/     SecurityPrivacyScreen.tsx, styles.ts, index.ts
src/native/components/common/    Card, Divider, Row, SectionLabel, SheetHandle, Toast, YellowButton
src/native/components/modals/    VerifyProfileSheet, EmergencyContactSheet,
                                   FamilySharingSheet, DownloadDataSheet
src/native/constants/            colors.ts, mockData.ts
src/native/hooks/useToast.ts
src/native/types/index.ts
```

Its `App.tsx`, `index.js`, `app.json`, `tsconfig.json` and `src/navigation/` were not copied — this
project already has an entry point, and `AppNavigator` was only there to render the one screen
standalone. `SecurityPrivacyHost.tsx` does that job here.

### What changed

| File | Change |
| --- | --- |
| `src/components/OneBuddyMarkup.html` | The `data-screen="security"` panel is gone. The **Security & privacy** row calls `sxOpenSecurityPrivacy()` instead of `sxGo('security')`. A hidden `#sxSecurityMirror` keeps the old `[data-setting]` controls so the original persistence layer still owns these values. |
| `src/scripts/nativeSecurityPrivacy.js` | **New.** The handoff, mirroring `nativeAppSettings.js`. |
| `src/screens/SecurityPrivacyHost.tsx` | **New.** Full-screen `Modal` around `SecurityPrivacyScreen`. |
| `src/screens/OneBuddyScreen.tsx` | `handleMessage` now routes both `openAppSettings` and `openSecurityPrivacy`; Android back closes whichever modal is open. |
| `src/native/types/index.ts` | Added the `SecurityPrivacyValues` interface and two optional props on `SecurityPrivacyScreenProps`: `initialValues` and `onValuesChange`. |
| `src/native/screens/Security/SecurityPrivacyScreen.tsx` | Those two props are honoured — `useState` initialisers read from `initialValues`, and one `useEffect` reports changes out. Every other line is untouched: the toggles, alerts, sheets and toast behave exactly as in the standalone project. |

No new dependencies — the security screen uses only `react` and `react-native`.

### How the two sides stay in sync

| WebView (`settings`) | Native |
| --- | --- |
| `biometric` | `biometricEnabled` |
| `verifiedProfile` | `verifiedProfile` |
| `familySharing` | `familySharing` |
| `emergencyContact` (name) | `emergencyContact.name` |

The old panel's "Signed-in devices" row had no matching row in the security project, so it is gone;
the native screen's "Change password" row (which emails a reset link) takes its place. The contact
phone number and export format live in the native screen only — the WebView document has no field
for them, so they aren't persisted across app restarts yet. `MOCK_PHONE_CONTACTS` in
`src/native/constants/mockData.ts` is still the placeholder contact list from the original project;
swap it for a real contacts read when you're ready.

---

## Help & support — replaced with the native screen

Both entry points — the **Help** quick tile at the top of Settings, and
**Settings → Privacy & support → Help & support** — now open the native screen from the `help`
project, over the WebView.

### What came in

```
src/native/screens/HelpSupport/     HelpSupportScreen.tsx, styles.ts, types.ts,
                                    mockData.ts, index.ts
src/native/screens/HelpSupport/components/   Card, Divider, Row, SectionLabel,
                                             SheetHandle, Toast, YellowButton
src/native/screens/HelpSupport/modals/       FaqDetailSheet, ContactFormSheet
```

The help project shipped only its `HelpSupport` folder — it expects `constants/colors` and
`hooks/useToast` two levels up. Those already exist from the security project, and all ten `COLORS`
keys it uses are present, so dropping it in at `src/native/screens/HelpSupport/` made every relative
import resolve with **no edits to any of its files**.

> Note: the folder that was `src/security/` in the previous build is now `src/native/`, since two
> screens share it. Nothing inside it changed except that rename — `SecurityPrivacyHost.tsx` had its
> three import paths updated to match.

### What changed

| File | Change |
| --- | --- |
| `src/components/OneBuddyMarkup.html` | The `data-screen="support"` panel is gone. Both `sxGo('support')` call sites now call `sxOpenHelpSupport()`. A hidden `#sxSupportMirror` keeps `supportPriority`. |
| `src/scripts/nativeHelpSupport.js` | **New.** The handoff — open only, no values to relay. |
| `src/screens/HelpSupportHost.tsx` | **New.** Full-screen `Modal` around `HelpSupportScreen`. |
| `src/screens/OneBuddyScreen.tsx` | `handleMessage` now routes `openHelpSupport` too; Android back closes whichever of the three modals is open. |

No new dependencies, and no changes at all inside the help project's own files.

### What moved and what didn't

The native screen adds a help-topic search box, a real FAQ list with a detail sheet, tap-to-call and
tap-to-email rows, and separate report-a-problem / send-feedback forms. Against the old HTML panel:

| Old row | Now |
| --- | --- |
| Help center & FAQs | The searchable FAQ list, with a detail sheet per question |
| Chat with support | Quick action (currently an `Alert` placeholder — wire it to your chat provider) |
| Report an order issue | "Report a problem" form in More help |
| Send a query | "Send feedback" form in More help |
| Support level (Standard / Priority / VIP) | **No UI.** The saved value is preserved on the hidden mirror; add the rows to `HelpSupportScreen.tsx` if you want them back. |

`SUPPORT_PHONE` and `SUPPORT_EMAIL` at the top of `HelpSupportScreen.tsx`, and `MOCK_FAQS` in
`src/native/screens/HelpSupport/mockData.ts`, are the placeholders from the original project — swap
them for your real details.

---

## About OneBuddy — replaced with the native screens

**Settings → Privacy & support → About OneBuddy** now opens the native stack from the `about-onebuddy`
project: an About screen, plus its own pushed pages for App version, Terms of service and Privacy policy.

### What came in

The about project's `src/` was copied in whole under `src/about/`, structure preserved, so its
relative imports resolve untouched:

```
src/about/screens/       AboutScreen, AppVersionScreen,
                         TermsOfServiceScreen, PrivacyPolicyScreen
src/about/components/    SettingsRow, DetailScreenLayout
src/about/navigation/    types.tsx (RootStackParamList)
src/about/theme/         theme.tsx (its own near-black + gold token set)
```

It kept its own folder rather than joining `src/native/` because it ships a separate theme and a real
navigation stack — merging the two token sets would have meant editing its files.

Its `App.tsx`, `app.json`, `babel.config.js` and `tsconfig.json` were not copied. `AboutHost.tsx`
recreates the stack from `App.tsx` verbatim, including the dark navigation theme.

### What changed

| File | Change |
| --- | --- |
| `src/components/OneBuddyMarkup.html` | The `data-screen="about"` panel is gone. The **About OneBuddy** row calls `sxOpenAbout()`. Its two orphaned rows moved into Account actions — see below. |
| `src/scripts/nativeAbout.js` | **New.** The handoff — open only, nothing to relay. |
| `src/screens/AboutHost.tsx` | **New.** `Modal` → `NavigationContainer` → native stack with all four screens. |
| `src/screens/OneBuddyScreen.tsx` | `handleMessage` routes `openAbout`; Android back closes whichever of the four modals is open. |
| `package.json` | Added `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`. |

**No edits to any of the About project's own files.** `AboutScreen` closes itself with
`navigation.canGoBack() && navigation.goBack()`, which does nothing at the root of a stack — so
`AboutHost` wraps it in an `AboutRoot` that hands it a navigation object whose `goBack()` falls
through to closing the modal.

### Rows that moved

The native About screen has three rows; the old HTML panel had five. **Rate OneBuddy** and
**Reset all settings** (which owns `sxConfirmReset`) had nowhere to go on the native screen, so
rather than lose a destructive action they moved up into the **Account actions** card on the
Settings home, above Log out. Move them onto `AboutScreen.tsx` instead if you'd rather they lived
there.

### Placeholder copy

`TermsOfServiceScreen.tsx` and `PrivacyPolicyScreen.tsx` carry the About project's placeholder legal
text, and both files say so at the top. `APP_VERSION`, `BUILD_NUMBER` and `RELEASE_DATE` in
`AppVersionScreen.tsx` are hardcoded — wire them to `expo-constants` if you want them to track real
builds.

### One note on `react-native-screens`

`@react-navigation/native-stack` depends on it, and it needs a real native build — it won't work in a
JS-only preview environment. `npx expo run:android` / `run:ios` or a dev build is fine; a mismatched
Expo Go client is where you'd hit "PlatformConstants could not be found".

---

## Browser preview of the whole app

```bash
npm run build:preview      # writes preview/onebuddy-full-preview.html
```

Open that file in any browser and you get the entire app end to end: splash, auth, dashboard, all
five verticals, checkout, orders, and Settings — **including the six screens that are native on
device**.

### How it works

`tools/build-preview.js` takes the exact document the WebView renders
(`src/webview/documentSource.ts`) and appends two preview-only files before `</body>`:

```
preview/nativeScreensPreview.css   tokens copied from each project's own theme
preview/nativeScreensPreview.js    HTML replicas of all six native screens
```

The six bridge scripts define `sxOpenAppSettings`, `sxOpenSecurityPrivacy`, `sxOpenHelpSupport`,
`sxOpenAbout`, `sxOpenPayments` and `sxOpenOrders`. In a browser there is no `ReactNativeWebView`,
so on their own they only write a line into the 11px settings status strip at the top of the sheet —
which reads as "the button does nothing". The shim loads after them and replaces all six with
replicas that actually open. Every replica carries a small **Browser preview of native screen**
badge so it's never mistaken for the real thing.

What each replica does:

| Row | Replica covers |
| --- | --- |
| App settings | Theme segmented control, language sheet (English / हिन्दी / తెలుగు, and the UI re-renders in the chosen language), location and usage toggles |
| Security & privacy | All three toggles, the verify-profile / family-sharing / emergency-contact / download-data sheets, including picking from the mock contact list |
| Help & support | Search filtering the FAQ list, accordion expand, contact rows, and the chat view with the same keyword routing as `utils/chatBot.ts` |
| About OneBuddy | The three rows drilling into App version / Terms of service / Privacy policy, full copy, with back navigation |
| Payments | Balance card, transaction history, add money (with quick-add chips), add/remove/set-default for UPI IDs and cards |
| Orders & bookings | Category tab filter, the Ongoing/Upcoming/Completed grouping, and card actions firing the real `sxOrdersAction` |

The replicas write back through the real `sxApplyAppSettings` / `sxApplySecurityPrivacy` bridge
functions, so flipping a toggle in the preview persists through the same
`readSettingsFromDom → persistSettings` path the device uses. Reload the page and your changes are
still there.

### What this is not

Nothing in `src/` is modified — the shim is appended to the built copy only, so what ships to the
device is untouched. The replicas match the native screens in copy, tokens, layout and behaviour,
but they are HTML: no `Alert` dialogs, no real biometric prompt, no OS location permission, no
`react-native-screens` transitions, and Payments/Orders state resets each time you open them (the
native hosts remount on open too). `Esc` closes the top-most sheet, then the panel. Use them to review flow and content; use a device build to
review the real thing.

Rebuild order after editing app sources:

```bash
npm run build:document     # HTML/CSS/JS  -> src/webview/documentSource.ts
npm run build:preview      # that document -> preview/onebuddy-full-preview.html
```

---

## Payments — replaced with the native screen

Dashboard -> **Settings -> Account -> Payments** no longer opens the in-page HTML panel.
It now opens the native React Native screen from the `payments` project, over the WebView --
same pattern as App settings, Security & privacy, Help & support and About above.

### What came in

The payments project was copied in whole under `src/native/screens/Payments/`, structure
preserved, so all of its relative imports resolve untouched:

```
src/native/screens/Payments/PaymentsScreen.tsx   balance / cashback / refunds, wallet, UPI, cards
src/native/screens/Payments/components/          Row, Toast, BottomSheet, WalletModal,
                                                 AddMoneyModal, UpiModal, CardModal
src/native/screens/Payments/data/mockData.ts     mock balance, cards, UPI handles, transactions
src/native/screens/Payments/icons/index.tsx      inline SVG icons (react-native-svg)
src/native/screens/Payments/theme/               colors.ts, styles.ts
src/native/screens/Payments/types.ts             SavedCard / UpiHandle / Transaction / ModalKind
src/native/screens/Payments/index.ts             export { PaymentsScreen }
```

**No edits to any of the payments project's own files** -- they are byte-for-byte the upload.
It keeps its own `theme/colors.ts` rather than joining `src/native/constants/colors.ts`, because
its palette differs (`bg: #261E31` vs `#12111A`) and merging the two would have meant editing it.

No new dependencies: the screen uses only `react` and `react-native`, plus `react-native-svg`
for its icons, which the project already had.

### What changed

| File | Change |
| --- | --- |
| `src/components/OneBuddyMarkup.html` | The `data-screen="payments"` panel is gone. The **Payments** row calls `sxOpenPayments()` instead of `sxGo('payments')`. A hidden `#sxPaymentsMirror` keeps the `paymentMethod` control so the original persistence layer still owns that value. |
| `src/scripts/nativePayments.js` | **New.** The handoff -- open only, no values to relay. |
| `src/screens/PaymentsHost.tsx` | **New.** Full-screen `Modal` around `PaymentsScreen`, with `onBack` wired to closing it. |
| `src/screens/OneBuddyScreen.tsx` | `handleMessage` routes `openPayments` too; Android back closes whichever of the five modals is open. |

### What moved and what didn't

The old panel had a **default payment method** picker (Wallet / UPI / Saved card) and a single
**Balance, cashback & refunds** row. The native screen has no global default-method picker, so
`paymentMethod` has **no UI now** -- its saved value is preserved on the hidden mirror, and the
summary on the right of the **Payments** row still paints from it. Everything else the old panel
had, the native screen does properly: live balance, add money, transaction history, UPI handles
with set-default / remove / add, and saved cards with set-default / remove / add.

`INITIAL_WALLET_BALANCE`, `INITIAL_SAVED_CARDS`, `INITIAL_UPI_HANDLES` and `MOCK_TRANSACTIONS` in
`src/native/screens/Payments/data/mockData.ts` are the placeholders from the original project, and
all state is local -- swap the mock data and the `handle...` callbacks in `PaymentsScreen.tsx` for
real API calls when you wire it to a backend.

The **Wallet** quick tile at the top of Settings still calls `handleAccountAction('wallet')` (it
writes a status line, as before) rather than opening the new screen. Point it at `sxOpenPayments()`
if you'd rather it opened Payments.

---

## Orders & bookings — replaced with the native screen

Dashboard -> **Settings -> Account -> Orders & bookings** used to call `handleAccountAction('orders')`,
which only wrote a line into the settings status strip — there was no orders screen behind it. It now
opens the native React Native screen from the `orders_deliveries` project, over the WebView — same
pattern as App settings, Security & privacy, Help & support, About and Payments above.

The **Orders** quick tile at the top of Settings pointed at the same dead handler, so it was rewired
to the same screen. The hub's own **Orders** tab on the bottom tab bar (`data-screen="orders"`) is
untouched — that's a separate in-page journey and the request was only about Settings.

### What came in

The orders project's folder was copied in whole under `src/native/screens/OrdersAndBookings/`,
structure preserved, so all of its relative imports resolve untouched:

```
src/native/screens/OrdersAndBookings/OrdersAndBookings.tsx   the screen: state + composition
src/native/screens/OrdersAndBookings/components/             ScreenHeader, CategoryTabs,
                                                             OrderSectionList, OrderRow
src/native/screens/OrdersAndBookings/hooks/                  useGroupedOrders, useHideWebScrollbars
src/native/screens/OrdersAndBookings/data.ts                 the 8 sample orders
src/native/screens/OrdersAndBookings/config.ts               TABS, GROUP_ORDER
src/native/screens/OrdersAndBookings/theme.ts                tab / tint / badge colour maps + COLORS
src/native/screens/OrdersAndBookings/styles.ts               the StyleSheet
src/native/screens/OrdersAndBookings/types.ts                Category, Filter, StatusKind, OrderCard
src/native/screens/OrdersAndBookings/index.ts                barrel — import from the folder
```

**No edits to any of the orders project's own files** — they are byte-for-byte the upload
(verified with `diff -r`). It keeps its own `theme.ts` rather than joining
`src/native/constants/colors.ts`, since its palette differs (`page: #0e0e10`) and merging the two
would have meant editing it.

No new dependencies: the screen uses only `react` and `react-native`.

### What changed

| File | Change |
| --- | --- |
| `src/components/OneBuddyMarkup.html` | The **Orders & bookings** row and the **Orders** quick tile call `sxOpenOrders()` instead of `handleAccountAction('orders')`. New `<!--@script:nativeOrders.js@...-->` marker alongside the other five bridges. |
| `src/scripts/nativeOrders.js` | **New.** The handoff, plus `window.sxOrdersAction(action, title)` for card actions coming back the other way. |
| `src/screens/OrdersHost.tsx` | **New.** Full-screen `Modal` around `OrdersAndBookings`, with `onClose` wired to closing it and `onAction` relayed to the document. |
| `src/screens/OneBuddyScreen.tsx` | `handleMessage` routes `openOrders`; `handleOrderAction` injects the action back into the page; Android back closes whichever of the six modals is open. |

Nothing was removed: there was no in-page `data-screen="orders"` settings panel to delete, and no
persisted value to keep on a mirror, so `handleAccountAction` itself is left exactly as it was for
the other actions (`wallet`, `wishlist`, `addresses`, `refunds`, `help`).

### How the two sides talk

Opening is one-way — the screen owns its only piece of state (the selected category tab) and
persists nothing, so there's nothing to seed. What does come back is a **card action**: tapping
Track, Reorder, Reschedule, Invoice, Rebook or Book again fires `onAction(label, order)`, which
`OneBuddyScreen` injects into the page as `window.sxOrdersAction(label, title)`. That shows the
usual toast in the settings status strip and records the activity through the original
`persistence.save('activity', …)` path — the same record `handleAccountAction('orders')` used to
write. The screen stays open, so you can fire several actions in a row.

Card actions are **display only** for now — none of them navigates anywhere yet. Wire each label to
a real destination in `OrdersHost`'s `onAction`, or pass real orders in through the screen's optional
`orders` prop instead of the sample data in `data.ts`:

```tsx
<OrdersAndBookings orders={ordersFromApi} onClose={…} onAction={…} />
```

### In the browser preview

`preview/nativeScreensPreview.js` replaces `sxOpenOrders` with an HTML replica built from the same
`data.ts`, `config.ts` and `theme.ts` values, so the tabs filter and the actions fire the real
`sxOrdersAction`. It carries the usual **Browser preview of native screen** badge. The `preview/`
folder wasn't in the uploaded zip, so it was rebuilt from scratch — it now covers all six native
screens, not just this one. See "Browser preview of the whole app" above.

---

## Auth + splash bug fixes

Three reported faults, all in the document's own code (`src/scripts/main.js`,
`src/components/OneBuddyMarkup.html`). No UI or UX was redesigned — every fix restores behaviour
that the markup and styles already described. Same classes, same copy, same layout.

### 1. "Get started" didn't play its launch sequence

`launchApp()` read `document.getElementById('textEls')` — **there is no element with that id
anywhere in the document.** The very next line dereferenced it, so the function threw a `TypeError`
before any of the blast-off ran. The 2.2s `showAuth` failsafe had already been queued, so the app
still reached the auth screen — it just sat frozen on the splash until the timer fired, which is
what "does not work properly" looked like.

Fixed by collecting the splash copy that actually exists (`.service-line`, `.tagline`,
`.cta-section`) and fading those, and by null-guarding `ring`, `markWrap`, `thruster`, `speedLines`
and `shockRing` so one missing node can never abort the rest again. All five stages now run: text
fade → squish + thruster → blast-off → speed lines → shock ring.

### 2. "Send OTP" on Sign In did nothing

`wireFace()` looked up `document.getElementById('formError')`, but that paragraph is **commented out
in the markup**. `fail()` and `clearErr()` dereferenced the null unguarded, so:

- every keystroke in the mobile field threw, and
- clicking **Send OTP** threw before it could unhide the OTP row.

Both `fail()` and `clearErr()` now fall back to the `.otp-hint` line, which is always present, when
`form-error` is absent. `base.css` gained one rule — `#authFlow .otp-hint.otp-hint-error` — using the
same `#F0A0A0` as `.form-error`, so the message reads identically. No new element, no layout shift.

### 3. Sign Up had no OTP field or submit button at all

The entire OTP block and the submit button on the Sign Up face were commented out, and the comment
was **malformed** — a nested `-->` closed it early, leaving fragments of markup interleaved with
stray comment openers. `wireFace({ sfx: 'Su' })` bailed on its `if (!row) return` guard, so the face
had a phone input and nothing else.

Restored as clean markup, structurally identical to the Sign In face (`sendOtpSu`, `otpRowSu` with
six `.otp-box` inputs, `otpHintSu`, `submitBtnSu`) using the same classes, so it renders exactly like
the other side of the card. `formErrorSu` stays commented out, matching Sign In.

`wireFace` also now bails only when a genuinely required node is missing, and null-checks
`hint`, `boxes[0]` and the rest as it goes.

### 4. The OTP row stayed open when it shouldn't

Related, and the same requirement as "the OTP bar should only be visible after Send OTP is pressed":
flipping Login ↔ Sign Up, or stepping back to the welcome screen and returning, left the row open
with stale digits and a resend timer still counting down.

`wireFace` now registers a `resetFace()` on a new `onebuddy:auth-reset` event — it re-hides and
disables the row, clears the boxes and hint, stops the timer, and puts both buttons back to
"Send OTP". `setFace()` and the `data-go="welcome"` handler dispatch that event. The phone number is
deliberately kept, so returning doesn't mean retyping it.

### 5. Send OTP was permanently disabled once the entry ran long

Still reported as "Send OTP button not working" after the fixes above, and it was a separate,
second bug — this time the button really was dead, not the handler.

The mobile-number `input` handler did this:

```js
if (digits.length > 10) {
  ident.value = digits.slice(0, 10);
  sendBtn.disabled = true;      // <- never switched back on
}
```

`sendBtn.disabled` was only cleared in the `else` branch. Typing anything that reduced to more than
ten digits — **`+91 98765 43210` is twelve** — disabled the button, and because every further
keystroke re-entered the same branch it stayed disabled for good. The only escape was deleting
characters, which nobody would think to do.

It also corrupted the number: `"919876543210".slice(0, 10)` is `9198765432`, a different number
than the one typed.

Fixed with a `normalise()` helper used by both the input handler and `sendOtp()`:

- strips to digits, then drops a leading `91` country code or a leading `0` when the result runs
  over ten digits, so `+91 98765 43210` and `09876543210` both land on `9876543210`
- caps at ten and shows the message, as before
- **only the resend countdown ever disables the button** — the "too long" path no longer touches it

Verified on a touch-emulated phone profile, both faces, with `+91 98765 43210`, `09876543210`,
`9876543210` and an over-long entry: every one normalises to `9876543210`, the button stays enabled,
and the tap opens the OTP row.

### 6. Email addresses are now accepted

The placeholder always said *"Enter your email or phone number"*, but only a 10-digit mobile was ever
valid. Two things blocked an email:

1. **`inputmode="numeric"` on the field.** On a real phone that raises the number-only keypad —
   there is no `@` key, so an email literally cannot be typed. Changed to `inputmode="text"` on both
   faces.
2. **The input handler stripped every non-digit as you typed**, so `ravi@gmail.com` collapsed to an
   empty field and both Send OTP buttons could only answer with an error.

`isEmailEntry()` now decides which set of rules applies: the moment a character appears that isn't a
digit or ordinary phone punctuation, the entry is treated as an email and left exactly as typed —
including the caret, which used to jump to the end on every keystroke because the value was being
rewritten. `looksValid()` accepts `^\d{10}$` **or** an email pattern, and `sendOtp()` no longer
applies the 10-digit length guard to a non-phone entry.

The field label changed from **Mobile Number** to **Mobile Number or Email** on both faces, so it
matches the placeholder and the behaviour. That is the only copy change in this round — easy to
revert if you want the old wording.

### Both Send OTP controls

There are two: the small text link in the field header (`#sendOtp`) and the large primary bar at the
bottom of the card (`#submitBtn`). They were tested separately, on both faces, and now behave
identically — the bar submits the form, which calls the same `sendOtp()` when no code has been sent
yet.

| Entry | Field keeps | Result |
| --- | --- | --- |
| `9876543210` | `9876543210` | OTP bar opens |
| `+91 98765 43210` | `9876543210` | OTP bar opens |
| `ravi@gmail.com` | `ravi@gmail.com` | OTP bar opens |
| `ravi.kumar@onebuddy.co.in` | unchanged | OTP bar opens |
| `ravi@@bad` / `abc` | unchanged | stays shut, message shown |

Same result from the text link and from the bar, on Sign In and Sign Up. An email carried all the
way through to the dashboard: enter email → Send OTP → six digits → verify.

### 7. "Verify & Sign In" — hardened for real devices

The verify step already worked when six digits were typed by hand, and it still does. What it did
**not** survive was how a phone actually delivers a code:

- **SMS autofill / keyboard suggestion drops the whole code into one box.** A programmatic value set
  ignores `maxlength="1"`, and the old handler did `box.value.replace(/\D/g,'').slice(-1)` — it kept
  only the **last** character and left five boxes empty. Tapping Verify then answered "Enter all 6
  digits" and read as a dead button.
- **The validation message could be off-screen.** With the soft keyboard up, the hint line sits
  behind it, so the tap looked like it did nothing at all.

Fixes, all behavioural — no markup or styling touched:

| Change | Why |
| --- | --- |
| `distribute(digits, from)` spreads a multi-digit value across the boxes from the one that received it | a whole code, or the tail of one, now fills correctly wherever it lands |
| The `paste` handler reuses `distribute()` | paste and autofill can't disagree |
| The last digit blurs the field | the keyboard drops so the button is actually reachable |
| `Enter` (the keyboard's Go key) submits | matches what people expect after the sixth digit |
| `fail()` calls `scrollIntoView({ block: 'nearest' })` | the message can never hide behind the keyboard |

Tested on a touch-emulated phone, **both faces × five entry methods** — one digit per box,
auto-advance from box 1, SMS autofill of all six into box 1, a partial autofill landing in box 3, and
the Enter key instead of a tap. All ten reach the dashboard with no page errors.

### Verified

Driven end to end in a headless browser against the built preview, both faces:

| Check | Result |
| --- | --- |
| Get started → all five animation stages | fire in sequence, no errors |
| OTP row hidden until Send OTP | yes, on both faces |
| Short number / >10 digits | message shown, row stays hidden, input capped at 10 |
| Valid number → Send OTP | row opens, boxes enabled, "Resend in 30s", submit relabels |
| Submit with empty OTP | "Enter all 6 digits of the OTP." |
| Type 6 digits → verify | auto-advance works, lands on the dashboard |
| `+91 …`, `0…`, over-long entries | normalise to 10 digits, button stays enabled |
| Flip faces / return from welcome | row resets, number kept |
| All 8 Settings native rows | still open correctly |

Zero page errors across every run.

### Rebuild

```bash
npm run build:document     # HTML/CSS/JS  -> src/webview/documentSource.ts
npm run build:preview      # that document -> preview/onebuddy-full-preview.html
```

Both were run; the checked-in `documentSource.ts` matches the sources.

---

## Backend — Firebase

This build adds a full Firebase backend: **Authentication**, **Firestore**, **Cloud Storage**
and **Cloud Functions**. It's additive — with no `.env` configured, the app runs exactly as
before (local-only, `AsyncStorage`); once configured, every screen syncs to the cloud for the
signed-in user.

### Layout

```
src/firebase/
├── config.ts                 Firebase app/auth/firestore/storage/functions init
├── types.ts                  Firestore document shapes
├── context/AuthContext.tsx   sign up / sign in / sign out / reset password
└── services/
    ├── userService.ts        profile + security (users/{uid}, meta/security)
    ├── settingsService.ts    settings sync (meta/settings)
    ├── addressService.ts     address book (addresses/*)
    ├── paymentsService.ts    wallet, cards, UPI, transactions
    ├── ordersService.ts      orders (orders/*)
    └── storageService.ts     profile photo upload

src/screens/auth/              LoginScreen, SignupScreen, AuthGate (mounted in App.tsx)

functions/src/
├── index.ts
├── users.ts                  onUserCreate / onUserDelete triggers
├── payments.ts                addMoney / chargeWallet — server-authoritative wallet math
└── orders.ts                  runOrderAction / createOrder

firestore.rules, storage.rules, firebase.json, .firebaserc, firestore.indexes.json
```

### Data model

Everything lives under `users/{uid}`, isolated per-user by `firestore.rules`:

| Path | Written by |
| --- | --- |
| `users/{uid}` | client (profile), Cloud Function (bootstrap) |
| `users/{uid}/meta/settings` | client — mirrors `SettingsContext`'s `AsyncStorage` state |
| `users/{uid}/meta/security` | client — mirrors `SecurityPrivacyScreen`'s values |
| `users/{uid}/meta/wallet` | **Cloud Functions only** — balance is server-authoritative |
| `users/{uid}/addresses/*` | client |
| `users/{uid}/cards/*`, `upiHandles/*` | client |
| `users/{uid}/transactions/*` | **Cloud Functions only** — written alongside a wallet mutation |
| `users/{uid}/orders/*` | **Cloud Functions only** — via `runOrderAction` / `createOrder` |

The wallet balance and order status are never trusted from the client directly: `PaymentsHost`
and `OrdersHost` call `addMoney` / `chargeWallet` / `runOrderAction`, which run as Cloud
Functions and write the result, so the balance and the transaction log — or an order's status —
can't drift out of sync with what a bad or buggy client sent.

### Setup

1. Create a Firebase project, enable **Email/Password** auth, **Firestore** (production mode)
   and **Storage**.
2. `cp .env.example .env` and fill in the web app config from
   *Project settings → Your apps*.
3. `npm install` (adds `firebase` and `expo-constants`).
4. `npm install -g firebase-tools && firebase login`, then set your project id in `.firebaserc`.
5. Deploy rules and functions:
   ```bash
   cd functions && npm install && cd ..
   firebase deploy --only firestore:rules,storage:rules,functions
   ```
6. `npx expo start` — sign up from the app; the `onUserCreate` function (and the client's own
   `ensureUserDocument` call) provisions the new user's profile, security doc and wallet.

### Local development

`firebase emulators:start` runs Auth, Firestore, Storage and Functions locally. Point the app at
the emulators the usual way (`connectAuthEmulator` / `connectFirestoreEmulator` etc. — not wired
in by default here to keep `config.ts` simple; add the `connect*Emulator` calls guarded by
`__DEV__` if you want that).
#   o n e b u d d y - n e w  
 