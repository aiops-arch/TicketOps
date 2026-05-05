#!/usr/bin/env node
"use strict";

const readline = require("readline");

const serverInfo = {
  name: "ticketops-flow-openclaw",
  version: "0.1.0"
};

const tools = [
  {
    name: "ticketops_reply",
    description: "Create a clear, professional TicketOps reply for managers, technicians, admins, or customers.",
    inputSchema: {
      type: "object",
      properties: {
        audience: {
          type: "string",
          description: "Who will receive the reply. Example: technician, manager, admin, outlet owner, customer."
        },
        message: {
          type: "string",
          description: "The incoming message or situation that needs a reply."
        },
        intent: {
          type: "string",
          description: "The business intent. Example: assign work, request update, escalate, close loop, explain delay."
        },
        urgency: {
          type: "string",
          enum: ["low", "normal", "high", "critical"],
          default: "normal"
        },
        ticketId: {
          type: "string",
          description: "Optional TicketOps ticket ID."
        },
        outlet: {
          type: "string",
          description: "Optional outlet name."
        },
        nextAction: {
          type: "string",
          description: "Optional required next action."
        }
      },
      required: ["audience", "message"]
    }
  },
  {
    name: "ticketops_coordinate",
    description: "Build a systematic coordination plan for a TicketOps issue, task, rollout, or escalation.",
    inputSchema: {
      type: "object",
      properties: {
        objective: {
          type: "string",
          description: "The outcome that must be achieved."
        },
        people: {
          type: "array",
          items: { type: "string" },
          description: "People or roles involved."
        },
        constraints: {
          type: "array",
          items: { type: "string" },
          description: "Constraints such as time windows, outlet access, missing photos, SLA risk."
        },
        dueBy: {
          type: "string",
          description: "Deadline or timing expectation."
        },
        riskLevel: {
          type: "string",
          enum: ["low", "normal", "high", "critical"],
          default: "normal"
        }
      },
      required: ["objective"]
    }
  },
  {
    name: "ticketops_decision_brief",
    description: "Produce a manager/admin decision brief with problem, impact, decision, owner, and proof needed.",
    inputSchema: {
      type: "object",
      properties: {
        situation: { type: "string" },
        knownFacts: {
          type: "array",
          items: { type: "string" }
        },
        decisionNeeded: { type: "string" },
        recommendedOwner: { type: "string" },
        proofNeeded: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["situation"]
    }
  }
];

function levelCopy(level = "normal") {
  const key = String(level || "normal").toLowerCase();
  return {
    low: { label: "Low", tone: "Keep it simple and close when convenient." },
    normal: { label: "Normal", tone: "Track clearly and close the loop." },
    high: { label: "High", tone: "Move with priority and keep stakeholders updated." },
    critical: { label: "Critical", tone: "Treat as operational risk. Escalate until ownership and timing are clear." }
  }[key] || { label: "Normal", tone: "Track clearly and close the loop." };
}

function cleanText(value, fallback = "") {
  return String(value || fallback).trim();
}

function textResult(text) {
  return {
    content: [
      {
        type: "text",
        text
      }
    ]
  };
}

function ticketopsReply(args = {}) {
  const urgency = levelCopy(args.urgency);
  const audience = cleanText(args.audience, "team");
  const ticketLine = args.ticketId || args.outlet
    ? `Reference: ${[args.ticketId, args.outlet].filter(Boolean).join(" / ")}`
    : "Reference: TicketOps";
  const intent = cleanText(args.intent, "coordinate the next action");
  const nextAction = cleanText(args.nextAction, "confirm ownership, timing, and proof in TicketOps");

  return [
    `Hi ${audience},`,
    "",
    `Received. ${ticketLine}.`,
    "",
    `Current intent: ${intent}.`,
    `Priority: ${urgency.label}. ${urgency.tone}`,
    "",
    `Action required: ${nextAction}.`,
    "",
    "Please update TicketOps with the latest status, expected completion time, and photo/proof where applicable so the loop can be closed cleanly.",
    "",
    `Context captured: ${cleanText(args.message, "No extra message provided.")}`
  ].join("\n");
}

function ticketopsCoordinate(args = {}) {
  const risk = levelCopy(args.riskLevel);
  const people = Array.isArray(args.people) && args.people.length ? args.people : ["Admin", "Manager", "Technician"];
  const constraints = Array.isArray(args.constraints) && args.constraints.length ? args.constraints : ["Use TicketOps as the single source of truth"];

  return [
    `Objective: ${cleanText(args.objective, "Coordinate the issue to closure.")}`,
    `Risk level: ${risk.label}`,
    args.dueBy ? `Due by: ${args.dueBy}` : "Due by: define before assignment",
    "",
    "Operating plan:",
    "1. Confirm owner: one accountable admin/manager owns the decision.",
    "2. Confirm executor: one technician owns the field action.",
    "3. Confirm proof: require photo, note, or completion evidence before closure.",
    "4. Confirm timing: record start, stop/block reason, and target completion.",
    "5. Close loop: manager/admin verifies and marks the work closed or reopened.",
    "",
    "People map:",
    ...people.map((person, index) => `${index + 1}. ${person}`),
    "",
    "Constraints:",
    ...constraints.map((constraint, index) => `${index + 1}. ${constraint}`),
    "",
    "Reply standard: acknowledge clearly, assign one owner, state deadline, ask for proof, and avoid vague status updates."
  ].join("\n");
}

function ticketopsDecisionBrief(args = {}) {
  const facts = Array.isArray(args.knownFacts) && args.knownFacts.length ? args.knownFacts : ["Facts need confirmation in TicketOps"];
  const proof = Array.isArray(args.proofNeeded) && args.proofNeeded.length ? args.proofNeeded : ["Latest status note", "Completion or issue photo", "Owner confirmation"];

  return [
    `Situation: ${cleanText(args.situation, "No situation provided.")}`,
    "",
    "Known facts:",
    ...facts.map((fact, index) => `${index + 1}. ${fact}`),
    "",
    `Decision needed: ${cleanText(args.decisionNeeded, "Assign, escalate, reopen, or close.")}`,
    `Recommended owner: ${cleanText(args.recommendedOwner, "Admin / Manager")}`,
    "",
    "Proof needed before closure:",
    ...proof.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Decision rule: do not close the loop until ownership, timing, and proof are visible in TicketOps."
  ].join("\n");
}

function callTool(name, args) {
  if (name === "ticketops_reply") return textResult(ticketopsReply(args));
  if (name === "ticketops_coordinate") return textResult(ticketopsCoordinate(args));
  if (name === "ticketops_decision_brief") return textResult(ticketopsDecisionBrief(args));
  throw new Error(`Unknown tool: ${name}`);
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handle(message) {
  const { id, method, params = {} } = message;

  try {
    if (method === "initialize") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo
        }
      });
      return;
    }

    if (method === "notifications/initialized") return;

    if (method === "tools/list") {
      send({
        jsonrpc: "2.0",
        id,
        result: { tools }
      });
      return;
    }

    if (method === "tools/call") {
      send({
        jsonrpc: "2.0",
        id,
        result: callTool(params.name, params.arguments || {})
      });
      return;
    }

    send({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    });
  } catch (error) {
    send({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: error.message
      }
    });
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity
});

rl.on("line", (line) => {
  if (!line.trim()) return;
  try {
    handle(JSON.parse(line));
  } catch (error) {
    send({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: `Parse error: ${error.message}`
      }
    });
  }
});
