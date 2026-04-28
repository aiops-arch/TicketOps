# TicketOps Flutter Mobile

The native Flutter app lives in:

```text
mobile_flutter
```

It is separate from the existing Capacitor app. The Flutter app is not a webview. It calls the Render API directly:

```text
https://ticketops-api.onrender.com
```

## Screens

- Sign in
- Dashboard
- Daily checklist
- Assigned tickets
- Account

## Build APK

Run from the project root:

```text
BUILD-FLUTTER-APK.bat
```

Output:

```text
TicketOps-Flutter-release.apk
```

## iOS Readiness

The Flutter project includes an `ios` folder and uses platform-neutral Dart code. Building an IPA still requires macOS and Xcode. The Windows machine can prepare the code and Android APK, but it cannot produce the final iOS archive.
