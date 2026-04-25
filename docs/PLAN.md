# Maintenance Ticket Management System Plan

## 1. Business Target

Build a simple, mobile-first system for restaurant maintenance operations across:

- 4 outlets
- 4 outlet managers
- 4 technicians
- 1 admin

The system replaces WhatsApp maintenance messages with a controlled workflow that creates accountability, improves response time, connects technician attendance to assignment, and gives management useful reports.

## 2. Core Operating Rules

- No ticket ID means no official maintenance work.
- Every ticket must have a status history.
- Every assignment must show who assigned it and when.
- Every technician must have an availability status.
- Normal assignment should only use technicians who are present and available.
- Admin can override attendance or assignment with a reason.
- Resolution requires proof: after photo plus resolution type.
- Manager rejection must include reason and proof.
- Reopened tickets must be highlighted for admin review.
- WhatsApp may be used for emergency communication, but it is not the official record.

## 3. Roles

### Outlet Manager

- Create tickets quickly from mobile.
- Upload issue photo.
- Select category and impact.
- Track ticket status.
- Approve or reject resolution.
- Reopen if the issue returns.

### Technician

- Check in and update availability.
- View assigned tickets.
- Acknowledge assigned work.
- Start work.
- Add updates, notes, and photos.
- Mark ticket blocked with reason.
- Resolve ticket with proof.
- Request break or leave.

### Admin

- View all tickets.
- View live technician attendance.
- Assign and reassign technicians.
- Override assignment or attendance with reason.
- Monitor critical, overdue, blocked, and reopened tickets.
- Review reports.

## 4. Ticket Lifecycle

```text
Manager reports issue
  -> System creates ticket ID
  -> System records outlet, category, photo, impact, timestamp
  -> System suggests priority
  -> System checks technician attendance and workload
  -> Admin confirms or overrides assignment
  -> Technician acknowledges
  -> Technician starts work
  -> Technician updates progress or marks blocked
  -> Technician resolves with proof
  -> Manager verifies
  -> Closed or Reopened
```

## 5. Ticket States

| State | Meaning | Owner |
| --- | --- | --- |
| New | Ticket created and waiting for assignment | Admin |
| Assigned | Technician assigned but not accepted | Technician |
| Acknowledged | Technician accepted ownership | Technician |
| In Progress | Work started | Technician |
| Blocked | Cannot proceed due to part, vendor, access, approval, or safety | Admin |
| Resolved | Technician submitted resolution proof | Manager |
| Verification Pending | Waiting for manager approval | Manager |
| Closed | Ticket approved or auto-closed | System/Admin |
| Reopened | Rejected or issue returned | Admin |
| Cancelled | Invalid, duplicate, or no longer needed | Admin |

## 6. Priority Rules

| Priority | Condition | Target |
| --- | --- | --- |
| P1 Critical | Safety risk, food safety risk, or service stopped | Immediate |
| P2 High | Customer impact or major equipment degradation | Same day |
| P3 Normal | Repair needed with workaround available | 24-48 hours |
| P4 Low | Cosmetic or planned maintenance | Scheduled |

Managers can suggest urgency, but the system/admin should confirm final priority.

## 7. Technician Attendance

Attendance is part of the product from the beginning, even if external attendance integration happens later.

### Attendance Sources

- Technician app check-in.
- Admin manual marking.
- Future biometric or external attendance sync.

All sources update one operational field: technician availability.

### Availability Statuses

| Status | Assignment Behavior |
| --- | --- |
| Present | Eligible for normal assignment |
| Busy | Can receive work only if admin confirms |
| Break | Skipped by smart assignment |
| On Leave | Skipped by smart assignment |
| Absent | Skipped by smart assignment |
| Off Duty | Skipped by smart assignment |
| Emergency Available | Used only for critical work |
| Admin Override | Allowed with visible reason |

## 8. Smart Assignment

Assignment should be simple and explainable.

```text
New ticket
  -> Check priority
  -> Check available technicians
  -> Filter by attendance
  -> Match skill/category
  -> Compare workload
  -> Compare outlet/location
  -> Suggest best technician
  -> Admin confirms or overrides
```

### Assignment Defaults

- Skip absent, off-duty, break, and leave statuses.
- Prefer skill match first.
- Prefer lower active workload second.
- Prefer nearest or outlet-assigned technician third.
- Critical tickets should go to the fastest present qualified technician.
- If no technician is present, admin receives an immediate alert.
- Admin can assign an unavailable technician only with override reason.

## 9. Mid-Shift Reassignment

Real operations require smooth handling when technician availability changes.

| Scenario | System Behavior |
| --- | --- |
| Technician assigned but not started, then becomes unavailable | Return ticket to admin queue |
| Technician in progress, then becomes unavailable | Admin chooses pause, wait, or reassign |
| Critical ticket loses technician | Immediate escalation |
| Replacement technician assigned | Full ticket history, photos, and notes are visible |
| Technician checks in late | Added to available assignment pool immediately |
| Technician overloaded | Admin warning before assigning more work |

## 10. Blocked Tickets

Technicians must not leave tickets silently stuck. A blocked ticket requires one of these reasons:

- Spare part required
- Vendor required
- Outlet access issue
- Approval required
- Safety shutdown required
- More diagnosis required

Blocked tickets appear in a separate admin queue.

## 11. Verification and Reopen

Manager receives the resolution proof and chooses:

- Approve
- Reject

Reject requires:

- Reason
- Photo or voice/text note

Reopen reasons:

- Issue not fixed
- Issue returned
- Work incomplete
- Wrong issue fixed
- Area left unsafe or dirty
- Technician did not visit

## 12. Alerts and SLA Rules

| Trigger | Alert To |
| --- | --- |
| New ticket unassigned after 5 minutes | Admin |
| Assigned but not acknowledged after 10 minutes | Technician + Admin |
| Technician not checked in | Admin |
| Technician unavailable with active ticket | Admin |
| Critical ticket overdue | Admin + Owner |
| Blocked ticket unchanged for 24 hours | Admin |
| Verification pending after 24 hours | Manager + Admin |
| Ticket reopened | Admin + Technician |

## 13. Reports

### Daily Admin Report

- Critical open tickets
- New unassigned tickets
- Not acknowledged tickets
- Blocked tickets
- Verification pending
- Technician attendance today

### Weekly Operations Report

- Tickets by outlet
- Tickets by category
- SLA breaches
- Reopened tickets
- Technician workload
- Repeat assets
- Reassignments due to attendance

### Monthly Management Report

- Maintenance cost by outlet
- Downtime by asset
- Technician attendance vs completed work
- Replacement candidates
- Vendor/spare part dependency
- WhatsApp fallback count

## 14. MVP Build Scope

### Phase 1: Core Ticketing

- Role-based screens for manager, technician, and admin.
- Ticket creation with category, photo placeholder, impact, and outlet.
- Admin assignment and reassignment.
- Technician acknowledge, start, update, block, resolve.
- Manager approve, reject, reopen.
- Ticket status history.

### Phase 2: Attendance and Smart Assignment

- Technician check-in.
- Admin attendance marking.
- Availability statuses.
- Attendance-based assignment suggestions.
- Mid-shift reassignment handling.
- SLA alerts.

### Phase 3: Reporting and Controls

- Daily, weekly, and monthly reports.
- Repeat issue detection.
- Blocked part/vendor tracking.
- WhatsApp fallback tracking.
- Basic cost tracking.

### Phase 4: Later Enhancements

- Biometric attendance integration.
- QR asset tagging.
- Preventive maintenance calendar.
- Vendor portal.
- Spare parts inventory.

## 15. First Prototype Target

The first prototype should prove:

- A manager can create a ticket quickly.
- Admin can see tickets and technician attendance.
- Admin can assign only present technicians by default.
- Technician can check in, acknowledge, start, block, and resolve.
- Manager can approve or reject.
- The dashboard shows stuck work clearly.
