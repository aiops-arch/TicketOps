# TicketOps User Guide

This guide explains how to use the current TicketOps build.

## 1. What Is Available Now

The project currently includes:

- Web app frontend.
- REST API backend.
- Local JSON demo storage.
- Supabase production schema.
- Android APK build.
- iOS project prepared for Apple builds.
- Workflow, API, Supabase, and mobile documentation.

## 2. Start the Web App

From the project folder:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

On Windows, you can also double-click:

```text
START-WEB.bat
```

## 3. Use the Web App

The app has four tabs:

- Manager
- Admin
- Technician
- Reports

### Manager Flow

1. Open the `Manager` tab.
2. Select outlet.
3. Select category.
4. Select impact.
5. Add a short note.
6. Click `Create Ticket`.

The system creates a ticket with:

- Ticket ID
- Priority
- Status
- Outlet
- Category
- Impact

### Admin Flow

1. Open the `Admin` tab.
2. Check dashboard counts:
   - Critical
   - Unassigned
   - Blocked
   - Present technicians
3. Check technician attendance.
4. Assign tickets.
5. Change technician attendance if needed.

Assignment logic:

- Present technicians are preferred.
- Unavailable technicians need admin override.
- If a technician becomes unavailable, unstarted tickets return to the queue.

### Technician Flow

1. Open the `Technician` tab.
2. Select technician.
3. Acknowledge assigned ticket.
4. Start work.
5. Mark blocked if part/vendor/access is needed.
6. Resolve with a resolution note.

Blocked and resolved actions require a reason.

### Manager Verification

When a ticket is resolved:

1. Manager opens the `Manager` tab.
2. Approves if fixed.
3. Rejects/reopens if not fixed.

Reopened tickets require a rejection reason.

### Reports Flow

Open the `Reports` tab to see:

- Open tickets
- Critical tickets
- Blocked tickets
- Reopened tickets
- Attendance coverage
- Operational alerts

## 4. Use the Android APK

Current APK:

```text
TicketOps-debug.apk
```

Install it on Android by copying the APK to the phone and opening it.

Important:

- The APK needs the REST API server running somewhere reachable.
- Android emulator default API is `http://10.0.2.2:3000`.
- Physical phone should use the PC LAN IP, for example `http://192.168.1.20:3000`.
- If the app cannot connect, it shows an API URL field.

## 5. Rebuild the APK

From the project folder:

```bash
BUILD-APK.bat
```

The output will be copied to:

```text
TicketOps-debug.apk
```

## 6. Supabase Setup

For production storage:

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run:

```text
supabase/schema.sql
```

4. Copy `.env.example` to `.env`.
5. Fill:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

6. Start the API:

```bash
npm start
```

Do not put Supabase service keys in frontend or mobile app code.

## 7. iOS / Apple App

iOS cannot use an APK.

The iOS project exists in:

```text
ios/
```

Final Apple build requires:

- macOS
- Xcode
- CocoaPods
- Apple Developer account

The iOS app uses the same REST API as web and Android.

## 8. Current Demo Login Model

There is no real login yet. The tabs simulate role access:

- Manager tab acts as outlet manager.
- Admin tab acts as admin.
- Technician tab acts as technician.

Real authentication should be added next before production use.

## 9. Next Build Priorities

Recommended next features:

1. Supabase Auth and real role login.
2. Photo upload for issue and resolution proof.
3. Asset list per outlet.
4. SLA timer jobs.
5. Push notifications.
6. Production deployment of the REST API.
7. Signed Android release build.
8. iOS signing and IPA build on macOS.
