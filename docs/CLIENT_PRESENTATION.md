# TicketOps Client Presentation

This is the source outline for the client-facing PDF:

```text
TicketOps_Client_Presentation.pdf
```

The PDF is designed for business/client presentation, not developer-only handoff.

## Sections Included

- Executive summary
- Problem being solved
- TicketOps solution
- End-to-end workflow
- Role responsibilities
- Attendance-aware assignment
- System modules
- Technical architecture
- Mobile and APK status
- Current build progress
- Recommended roadmap
- Client decisions needed
- Go-ahead summary

## Generate PDF

From project root:

```bash
node scripts/generate-client-presentation.js
```

The generated PDF is ignored by Git because PDF files are local deliverables.
