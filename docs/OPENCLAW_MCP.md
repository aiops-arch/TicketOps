# TicketOps Flow OpenClaw MCP

TicketOps Flow is the project-level OpenClaw setup for operational replies and coordination.

It has two MCP layers:

1. `openclaw`
   - Runs the official OpenClaw MCP bridge with `openclaw.cmd mcp serve` on this Windows project.
   - Connects OpenClaw channel conversations to an MCP client through an OpenClaw Gateway.

2. `ticketops-flow`
   - Runs the local TicketOps MCP server at `mcp/openclaw-ticketops-mcp.js`.
   - Provides TicketOps-specific tools for reply drafting, coordination planning, and decision briefs.

## Tools

`ticketops_reply`

Creates a clean, professional reply for technicians, managers, admins, outlet owners, or customers.

Use it when someone asks for status, needs an assignment, needs escalation, or needs a clear closure message.

`ticketops_coordinate`

Builds a systematic operating plan with owner, executor, proof, timing, constraints, and closure steps.

Use it when an issue needs multiple people coordinated without vague back-and-forth.

`ticketops_decision_brief`

Creates a short manager/admin decision brief with situation, known facts, decision needed, owner, and proof required before closure.

## MCP Client Config

Use `openclaw.mcp.json` as the project config template.

Before enabling the OpenClaw bridge, update:

- `wss://your-openclaw-gateway:18789`
- `.secrets/openclaw-gateway.token`

Keep the token file out of git.

## Local Test

From the project root:

```powershell
node mcp/openclaw-ticketops-mcp.js
```

Then send JSON-RPC messages over stdin from an MCP client.

For a direct smoke test:

```powershell
node scripts/test-ticketops-flow-mcp.js
```

## Windows Note

PowerShell may block the generated `openclaw.ps1` shim. Use `openclaw.cmd` instead:

```powershell
openclaw.cmd --version
openclaw.cmd mcp serve --help
```

## Operating Standard

TicketOps Flow should reply in this order:

1. Acknowledge the message.
2. State the ticket/outlet reference.
3. State priority and operational risk.
4. Assign one clear next action.
5. Ask for proof or status evidence.
6. Close with the expected TicketOps update.

This keeps all communication business-ready, traceable, and closure-focused.
