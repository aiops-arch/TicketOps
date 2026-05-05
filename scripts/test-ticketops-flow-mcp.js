"use strict";

const { spawn } = require("child_process");
const path = require("path");

const serverPath = path.join(__dirname, "..", "mcp", "openclaw-ticketops-mcp.js");
const child = spawn(process.execPath, [serverPath], {
  stdio: ["pipe", "pipe", "inherit"]
});

const messages = [
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "ticketops-flow-smoke",
        version: "0.1.0"
      }
    }
  },
  {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  },
  {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "ticketops_reply",
      arguments: {
        audience: "technician",
        message: "Freezer is still not fixed and manager is asking for update.",
        intent: "request urgent field update",
        urgency: "high",
        ticketId: "TK-TEST",
        outlet: "Capiche",
        nextAction: "send current status, ETA, and photo proof"
      }
    }
  }
];

let output = "";

child.stdout.on("data", (chunk) => {
  output += chunk.toString("utf8");
});

child.on("close", (code) => {
  if (code !== 0) {
    console.error(`MCP smoke failed with exit code ${code}`);
    process.exit(code || 1);
  }

  const lines = output.trim().split(/\r?\n/).filter(Boolean);
  const parsed = lines.map((line) => JSON.parse(line));
  const toolList = parsed.find((item) => item.id === 2);
  const call = parsed.find((item) => item.id === 3);

  if (!toolList?.result?.tools?.some((tool) => tool.name === "ticketops_reply")) {
    console.error("ticketops_reply was not listed.");
    process.exit(1);
  }

  if (!call?.result?.content?.[0]?.text?.includes("Action required")) {
    console.error("ticketops_reply did not return the expected structured reply.");
    process.exit(1);
  }

  console.log("TicketOps Flow MCP smoke passed.");
});

for (const message of messages) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

child.stdin.end();
