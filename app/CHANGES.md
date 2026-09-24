# What changed in this build

## 1. Addresses & delivery -> native screen

The Settings "Addresses & delivery" page was dead: an earlier find/replace had
stripped the word "delivery" out of the markup, which left the row calling
`sxGo('')` and the panel declared as `data-screen=""`. Nothing could open it.

It is now the native React Native screen, wired the same way as App settings,
Security, Help, About, Payments and Orders:

| File | What it does |
| --- | --- |
| `src/native/screens/Address/AddressScreen.tsx` | the screen itself (saved addresses, add/edit sheet with validation, set default, delete, **Use current location**) |
| `src/native/screens/Address/index.ts` | re-export |
| `src/screens/AddressHost.tsx` | presents it full-screen over the WebView; supplies real GPS via `expo-location` |
| `src/scripts/nativeAddresses.js` | `sxOpenAddresses()` / `sxApplyAddresses()` bridge |
| `src/components/OneBuddyMarkup.html` | rows re-pointed, labels repaired, old panel replaced by `#sxAddressesMirror` |
| `src/screens/OneBuddyScreen.tsx` | handles `openAddresses`, renders `AddressHost`, Android back closes it |

Details worth knowing:

- **Three entry points** now open it: the "Address" quick tile, the
  "Addresses & delivery" row in Account, and the old "Manage saved addresses"
  row (which lived inside the removed panel).
- **The saved delivery address still persists.** `#globalLocation`
  (`[data-setting="address"]`) moved into the hidden `#sxAddressesMirror`, so
  `applySettingsToDom` / `readSettingsFromDom` / `persistSettings` are untouched.
  Choosing a default on the native screen posts back through
  `sxApplyAddresses()`, which writes that input and fires `input` + `change` so
  the existing layer saves it, and repaints the `#sxAddressValue` summary.
- **"Returns & refunds"** had no native equivalent, so it moved into the
  Account card next to "Orders & bookings" rather than disappearing with the
  panel.
- **It also works in a plain browser.** Unlike the other bridges, which only
  print "opens as a native screen on device", `nativeAddresses.js` draws the
  same screen in the page when `window.ReactNativeWebView` is missing — so the
  row is never dead in expo web or the preview file. On device the native
  screen is what opens.
- **Use current location**: `expo-location` on device (permission request,
  `getCurrentPositionAsync`, `reverseGeocodeAsync`), `navigator.geolocation` in
  a browser. It only fills fields that are still blank, never overwriting typed
  text, and pins `latitude` / `longitude` on the address.

## 2. "About OneBuddy" dropped you out of the app — fixed

`AboutHost.tsx` mounted a `@react-navigation/native-stack` navigator inside a
React Native `<Modal>`. A native stack renders `react-native-screens`
containers, and those inside a modal's separate view hierarchy tear the app
down on Android — which is exactly the symptom: tap About, app exits.

`AboutHost.tsx` no longer uses a navigation library at all. The four About
screens only ever call `navigation.navigate(name)` and `navigation.goBack()`,
so the host keeps a small array of route names and hands them a matching
`navigation` object. **The four screens in `src/about/screens/` are unchanged.**

Also fixed while in there:

- The modal now carries its own `SafeAreaProvider`. Modals render in a separate
  hierarchy, so `SafeAreaView` inside one otherwise reports zero insets and the
  header can sit under the status bar.
- Android hardware back and the modal's own dismiss now pop one page at a time
  (Terms -> About -> closed) instead of closing everything at once.
- Reopening always lands on About, never on a sub-page.

`@react-navigation/*` and `react-native-screens` are still in `package.json` —
nothing else imports them now, so they can be removed if you want a smaller
build.

## Verified

- `npx tsc --noEmit` — the only two errors are the pre-existing ones in
  `OneBuddyScreen.tsx` (a `react-native-webview` prop-type mismatch and
  `StyleSheet.absoluteFillObject`), untouched by this work.
- Headless Chromium run of the built document: settings rows read correctly,
  the Addresses row opens the screen, set-default writes back to the mirror and
  the summary row, validation fires on an empty form, geolocation pins
  coordinates, save adds the card. Zero page errors.
- `npm run build:document` regenerated `src/webview/documentSource.ts`.
