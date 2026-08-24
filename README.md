# Aureli — corrected build

## What was actually wrong, and what's fixed

The earlier "corrected" file circulating for this project was a stripped-down
4-screen stand-in — it didn't match your real 1,284-line prototype (splash →
onboarding → home → coach → voice → goals → progress → profile → paywall,
with the neural-field canvas, chat, confetti bursts, etc.). I fixed the
**actual** file, `src/AureliApp.jsx`, in place. Four things changed:

1. **Dead purchase button.** "Start 7-day free trial" had no `onClick` at
   all. It now calls `purchaseWithAmazonIAP(sku)`, tracks pending/error
   state, and shows a real error if the purchase can't complete. Plan cards
   (Plus/Pro) are now selectable so the right SKU is sent.

2. **Hardcoded date.** `"Wednesday · 19 August"` is now
   `formatTodayLabel()`, which reads the device's actual date every render.

3. **Battery/frame drops from the canvas.** `NeuralField`'s animation loop
   now pauses on `visibilitychange` (backgrounded app, locked screen, tab
   switch) instead of running full-tilt forever — relevant for Fire Tablet /
   Fire TV hardware. It already had `cancelAnimationFrame` cleanup on
   unmount; that was fine.

4. **Lost state on exit / phone call.** Screen, name, goals, style, time,
   and daily tasks now persist to `localStorage` (wrapped in try/catch, with
   type-checked fallbacks in case the stored data is malformed). "Restart
   demo" now clears storage instead of only resetting in-memory state.

I also added `goals?.[0]` optional chaining as a defensive backstop, though
the original code already guarded that lookup.

## One honest caveat: Amazon In-App Purchasing

**There's no such thing as a browser-JS Amazon IAP SDK** — Amazon's IAP API
is native Android (Java/Kotlin) only. Any version of this app — including
the one shown to you earlier — that calls something like
`window.AmazonAppstoreSDK.purchase(...)` from React is not actually wired to
Amazon; that global doesn't exist in a real WebView.

What I did instead: `purchaseWithAmazonIAP()` calls
`window.AureliIAP.purchase({ sku })` — a bridge you provide via a small
native Capacitor plugin that wraps Amazon's `PurchasingService`. Until that
plugin exists, the button correctly shows an error rather than pretending to
succeed. This is genuinely the smallest amount of native code you can't
avoid writing; nothing in JS alone can complete a real Amazon purchase.

## What's actually needed to publish (can't be done from a .jsx file)

A single `.jsx` file was never going to be uploadable to Amazon — they take
an `.apk`/`.aab` (native) or a hosted web app URL, not raw source. This repo
is a real, buildable Vite project around your fixed component, but reaching
the Appstore still requires steps outside this sandbox:

1. **Build the web bundle** (already verified working here):
   ```bash
   npm install
   npm run build      # outputs dist/
   ```
2. **Wrap it as Android with Capacitor**, on your machine:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init Aureli <your.package.id>
   npx cap add android
   ```
3. **Write the `AureliIAP` native plugin** so `window.AureliIAP.purchase`
   actually calls Amazon's `PurchasingService`. Amazon's own IAP sample app
   and docs (developer.amazon.com/docs/in-app-purchasing) are the reference;
   there's no shortcut that avoids this Java code.
4. **Register your SKUs in Amazon Developer Console** exactly matching
   `IAP_SKUS` in the code: `aureli_plus_monthly`, `aureli_plus_yearly`,
   `aureli_pro_monthly`, `aureli_pro_yearly`.
5. **Build and sign the release `.aab`/`.apk`** in Android Studio with your
   own keystore — I can't generate or hold a signing key for you.
6. **Test with Amazon's App Tester** (side-loaded on a Fire tablet or the
   Android emulator) before submitting — it lets you simulate purchases
   against your registered SKUs without real money.
7. **Submit** the signed binary in the Developer Console under
   *Add New App → Android*.

None of steps 2–7 can be completed inside this chat — they need Android
Studio, a physical/emulated device, and your own Amazon developer
credentials and signing key. What you have now is a source tree that
actually builds and no longer has the four bugs above.
