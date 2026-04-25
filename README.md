# TicketOps

Mobile-first maintenance ticket management system for a restaurant business with 4 outlets, 4 outlet managers, 4 technicians, and 1 admin.

The product replaces WhatsApp-based maintenance communication with a structured workflow for ticket creation, technician attendance, smart assignment, updates, verification, escalation, and reporting.

## Current Status

- `docs/PLAN.md` contains the business and developer-ready plan.
- `index.html`, `styles.css`, and `app.js` contain the first clickable prototype.
- The prototype uses browser local storage and can be opened directly without a server.

## Open Prototype

Open `index.html` in a browser.

## Core Workflow

Manager creates ticket -> System logs ticket -> Admin assigns technician -> Technician acknowledges and works -> Technician resolves with proof -> Manager verifies -> Ticket closes or reopens.

## Attendance Rule

Technicians must be present and available for normal assignment. Admin can override with reason.
