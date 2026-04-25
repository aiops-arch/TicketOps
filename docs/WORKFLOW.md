# TicketOps Workflow Documentation

## 1. How the Maintenance Problem Starts

In the current restaurant operation, maintenance issues usually start informally.

A manager notices a problem during live operations:

- AC is not cooling during lunch or dinner service.
- Freezer temperature is rising.
- Gas burner is not working.
- Drainage is blocked.
- Exhaust fan is noisy or stopped.
- POS printer is not printing.
- Water leakage appears near prep or wash area.
- Light, door, shelf, or kitchen equipment is damaged.

The manager usually sends a WhatsApp message, photo, or voice note to the admin, technician, or maintenance group.

This feels fast, but it creates operational problems.

## 2. Why WhatsApp Breaks the Maintenance Process

WhatsApp is useful for communication, but weak as an operations system.

Common failures:

- No official ticket ID.
- No clear owner.
- No priority classification.
- No confirmation that technician accepted the work.
- No SLA timer.
- No proof that work was completed properly.
- No manager verification.
- No reliable history.
- No report by outlet, asset, technician, or category.
- Old issues get buried under new messages.
- Managers keep asking for updates manually.
- Technicians receive work through calls and messages, then forget status updates.

The result is maintenance chaos:

```text
Issue happens
  -> WhatsApp message sent
  -> Admin or technician may miss it
  -> Follow-up calls begin
  -> Work may happen without proof
  -> Manager may still be unhappy
  -> No clean data for future decisions
```

## 3. New System Objective

TicketOps changes the process from chat-based communication to a controlled operating workflow.

The system must answer these questions for every issue:

- What is the issue?
- Which outlet reported it?
- When was it reported?
- How urgent is it?
- Who owns it?
- Is the technician present?
- Has work started?
- Is the work blocked?
- Was the issue resolved?
- Did the manager verify it?
- Did the issue return?

## 4. End-to-End Maintenance Workflow

```text
Manager sees issue
  -> Manager creates ticket
  -> System creates ticket ID
  -> System records outlet, category, impact and timestamp
  -> System calculates priority
  -> System checks technician attendance
  -> System suggests best technician
  -> Admin confirms or overrides assignment
  -> Technician acknowledges ticket
  -> Technician starts work
  -> Technician adds update or marks blocked
  -> Technician resolves with proof
  -> Manager verifies
  -> Ticket closes or reopens
```

## 5. Manager Workflow

The manager workflow must be fast because managers are usually busy during service.

### Ticket Creation

Manager enters:

- Outlet
- Category
- Impact
- Short note
- Photo later when upload is added

System creates:

- Ticket ID
- Timestamp
- Priority
- Initial status: `New`

### Manager Verification

When technician marks a ticket resolved, manager must verify:

- Approve if fixed.
- Reject/reopen if not fixed.

Rejection should require:

- Reason
- Photo or voice/text note later

## 6. Admin Workflow

Admin is the operational controller.

Admin sees:

- New unassigned tickets
- Critical tickets
- Technician attendance
- Technician workload
- Blocked tickets
- Reopened tickets
- Tickets waiting for verification

Admin actions:

- Assign technician
- Reassign technician
- Override assignment with reason
- Mark ticket blocked
- Escalate critical delay
- Review reopened issues

## 7. Technician Workflow

Technician must not manage a complex system. The technician screen should be action-based.

Technician actions:

- Check in
- View assigned tickets
- Acknowledge
- Start
- Mark blocked
- Resolve

Blocked reasons:

- Spare part required
- Vendor required
- Outlet access issue
- Approval required
- Safety issue
- More diagnosis required

Resolution requires:

- Resolution type
- After photo later
- Optional note

## 8. Attendance-Linked Assignment Workflow

Attendance is a core part of assignment.

```text
Technician checks in
  -> Status becomes Present
  -> Technician becomes eligible for normal assignment

Technician goes on break/leave/absent
  -> Status changes
  -> System removes technician from normal assignment pool
  -> Unstarted assigned tickets return to admin queue
  -> In-progress tickets require admin decision
```

Assignment rules:

- Present technicians are eligible.
- Busy technicians need admin confirmation.
- Break, leave, absent, and off-duty technicians are skipped.
- Emergency available technicians can receive critical tickets.
- Admin can override, but reason must be recorded.

## 9. Smart Assignment Logic

Smart assignment should remain simple and explainable.

```text
New ticket
  -> Check priority
  -> Filter technicians by attendance
  -> Match category with skill
  -> Compare active workload
  -> Suggest best technician
  -> Admin confirms or overrides
```

Example:

```text
Ticket: Freezer not cooling
Category: Refrigeration
Priority: P1

System checks:
Technician 2 is present and skilled in Refrigeration.
Technician 1 is present but AC skilled.
Technician 3 is on break.
Technician 4 is absent.

Suggested technician: Technician 2
```

## 10. Mid-Shift Change Workflow

Real restaurant operations change during the day.

Technicians may:

- Check in late.
- Go on break.
- Leave for emergency.
- Become overloaded.
- Need vendor help.
- Need spare parts.

System behavior:

| Situation | System Response |
| --- | --- |
| Assigned but not started technician becomes unavailable | Ticket returns to admin queue |
| In-progress technician becomes unavailable | Admin chooses pause, wait, or reassign |
| Critical ticket loses technician | Immediate escalation |
| Technician checks in late | Added to available pool |
| Technician overloaded | Admin sees warning |

## 11. Ticket Status Lifecycle

```text
New
  -> Assigned
  -> Acknowledged
  -> In Progress
  -> Blocked
  -> In Progress
  -> Resolved
  -> Verification Pending
  -> Closed
```

Alternate paths:

```text
Resolved
  -> Reopened
  -> Assigned
```

```text
New / Assigned
  -> Cancelled
```

## 12. SLA and Escalation Workflow

The system should reduce manual follow-up.

SLA alerts:

- New ticket unassigned after 5 minutes.
- Assigned ticket not acknowledged after 10 minutes.
- Critical ticket overdue.
- Technician unavailable with active ticket.
- Blocked ticket unchanged for 24 hours.
- Manager verification pending after 24 hours.
- Ticket reopened.

Escalation path:

```text
Reminder
  -> Admin alert
  -> Owner alert for critical/overdue cases
```

## 13. Reporting Workflow

Reports convert daily maintenance activity into business intelligence.

Daily:

- Critical open tickets.
- Unassigned tickets.
- Blocked tickets.
- Verification pending.
- Technician attendance.

Weekly:

- Tickets by outlet.
- Tickets by category.
- SLA breaches.
- Reopened tickets.
- Technician workload.
- Repeat assets.

Monthly:

- Maintenance cost later.
- Downtime later.
- Attendance vs completed work.
- Replacement candidates.
- Vendor dependency.

## 14. Data Flow

```text
Frontend app
  -> REST API
  -> Supabase Postgres
  -> REST API
  -> Frontend dashboards
```

Rules:

- Frontend never stores business truth permanently.
- REST API enforces workflow rules.
- Supabase stores tickets, attendance, history, and reports data.
- Mobile apps and web app use the same API.

## 15. Build Direction

The product should be built in this order:

1. REST API and Supabase schema.
2. Mobile-first web frontend.
3. Android APK using Capacitor.
4. iOS Capacitor project for Apple app.
5. SLA jobs and notifications.
6. Photo upload and storage.
7. Reports and management dashboard.

## 16. Final Operating Model

TicketOps should become the official maintenance record.

The business rule is:

```text
No ticket ID = no official maintenance work.
```

WhatsApp can still exist for emergency coordination, but every issue must eventually become a ticket with:

- Owner
- Status
- Attendance-aware assignment
- Timeline
- Proof
- Verification
- Reportable data
