# Mobile Build Plan

## Android

Android apps use APK or AAB packages.

Current target:

- Capacitor Android project in `android/`.
- Debug APK command: `npm run android:build`.
- Native build requires JDK 17 and Android SDK.
- Current generated debug APK:
  - `TicketOps-debug.apk`
  - `android/app/build/outputs/apk/debug/app-debug.apk`

## iOS

iOS cannot use APK files.

Apple app target:

- Use Capacitor iOS.
- iOS project is generated in `ios/`.
- Generate iOS project with `npx cap add ios`.
- Build IPA on macOS with Xcode.
- The iOS app should call the same REST API as Android and web.
- Windows can prepare and sync the iOS project, but final Apple signing and IPA export require macOS, Xcode, CocoaPods, and an Apple Developer account.

## Shared App Rule

Web, Android, and iOS must all use the same backend REST API.

Frontend clients must not contain Supabase service keys.
