# WebView removal — what changed

The app is pure React Native. `react-native-webview` is gone from
`package.json`, and nothing renders HTML any more.

## Deleted

| Path | Why |
| --- | --- |
| `src/webview/` | The generated document, its base URL, the message contracts and the `injectJavaScript` helpers. |
| `src/screens/OneBuddyScreen.tsx` | The WebView host and its ten-way `onMessage` switch. |
| `src/screens/AppSettingsHost.tsx` | Replaced by `src/screens/AppSettingsRoute.tsx`. |
| `src/components/OneBuddyMarkup.tsx` | Auto-generated and already syntactically invalid — it did not compile and nothing imported it. |
| `src/scripts/`, `src/styles/` | Source for the document. Only `tools/build-document.js` ever read them. |
| `tools/` | The document and preview builders. |
| `build:document`, `build:preview` scripts | Nothing left to build. |

## The shell

`App.tsx` mounts the providers once, then `RootNavigator`.

Provider order is load-bearing: `SettingsProvider` reads the Firebase session,
`ThemeProvider` reads settings. Both used to be re-created inside
`AppSettingsHost`, which is why a theme change there never reached the
dashboard. They are at the root now, so it does.

`src/navigation/types.ts` replaces `WebViewMessageType`. Every
`postMessage({ type: 'openX' })` is a typed route — same ten destinations,
checked by the compiler instead of at runtime on a device.

## The ten host screens

Not rewritten. Each is still its own full-screen `Modal` driven by
`visible` + `onClose`; `src/screens/hostRoutes.tsx` mounts each as a route
whose `onClose` pops the stack. They are registered inside a
`Stack.Group` with `animation: 'none'` so the Modal's own slide is the only
transition.

The `onChange` callbacks that pushed state back into the document are dropped.
Settings, addresses and security read and write the shared providers now, so
there is nothing to mirror.

## Screens built from scratch

**`SplashScreen.tsx`** — orbit, wordmark, tagline, CTA and the full launch
sequence (squash, thruster, blast-off, speed lines, shock ring) at the original
timings from `main.js`.

The orbit is the one piece that did not port line-for-line. Each `.ob-slot` was
a 0×0 anchor at the centre with the badge hanging outside it; Android clips
anything drawn beyond its parent's bounds, so every badge would have vanished.
Each slot is now a full-size centred layer that rotates, with the badge
translated outward inside it. The counter-rotation chain is unchanged —
layer(+t) → slot(+a) → counter(−t) → badge(−a) — so the icons stay upright.

**`HomeScreen.tsx`** — top bar, search, location chip, section header,
timeline with the 1.2s auto-advance, five cards, footer.

**`Sidebar.tsx`** — `translateX` with a `PanResponder`, so the panel follows
your finger. Note it was unreachable before: nothing in the top bar called
`toggleSidebar()`, only the drawer's own close button and overlay. There is a
menu button now.

**`ServiceTimeline.tsx`** — the progress fill animates on `scaleX` rather than
`width`, so it stays on the native driver.

**`CategoryCard.tsx`** — front face only. The flip is not carried over:
`backfaceVisibility: 'hidden'` is unreliable on Android and both faces bleed
through mid-turn. To add it later, render both faces, interpolate two rotations
(0→180 and 180→360) from one value, and swap `opacity`/`zIndex` at the 90°
midpoint instead of relying on `backfaceVisibility`.

## Auth

The old flow sent nothing. `main.js` showed six boxes, waited 800ms and called
`enterApp()` — any six digits got you in. There was no Fast2SMS call, no
generated code and no verification, so there was nothing to port.

`src/auth/otpProvider.ts` is the seam. `PhoneScreen`, `OtpScreen` and
`OtpAuthContext` only ever call `sendOtp` and `verifyOtp`.

- `DevOtpProvider` (active) generates a code and logs it to Metro, so the flow
  is walkable today. It throws in release builds, so it cannot ship by accident.
- `HttpOtpProvider` posts to `/auth/send-otp` and `/auth/verify-otp`. Point it
  at your backend and change the last line of the file.

Do not call an SMS gateway from the app. The key would ship inside the bundle,
where anyone can pull it out of the APK and spend your credits. Put the gateway
behind your own endpoint.

The session token is in AsyncStorage, matching how settings persist. Move it to
`expo-secure-store` before you ship — AsyncStorage is not encrypted.

## Assets

The eleven images that were inline base64 in the document are real files in
`assets/brand/` now: the mark, five orbit badges, five card photos.

## Tabs

Three, not four. Orders and Account have native screens; Explore only ever
existed as an in-document feed, so it is left out rather than shipped dead.

## Gone with the document

No native version exists for these, and they are not in this build: ride hub,
live ride tracking, care hub, explore/deals, doctor appointments, home services,
the profile customiser sheet, service preferences, and the global floating cart.
Food and Groceries survive — those are real native sub-apps, and the dashboard
cards navigate straight into them.

## Verification

- `npm run typecheck` passes clean under `strict: true`.
- Three pre-existing errors in `src/categories/food` were fixed to get there: a
  `bordercolor` typo in two stylesheets (that property did nothing at runtime)
  and five address literals missing `receiverName` / `receiverPhone`.
- The orbit transform chain was checked numerically across a full revolution:
  net icon rotation, orbit radius and bearing are all correct to ~1e-14.
- The OTP provider has 13 passing checks (validation, single-use codes, wrong
  code rejected, verify-before-send refused, release-build block).

Not verified: nothing has run on a device or simulator. First-launch bugs are
possible. You need an EAS dev build to see it properly.
