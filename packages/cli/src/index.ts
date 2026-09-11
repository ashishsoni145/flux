#!/usr/bin/env node
/**
 * FluxIDE CLI — flux command
 *
 * First-class terminal interface for the FluxIDE platform.
 * Connects to fluxd via WebSocket and provides interactive
 * agent control, planning, and task management.
 *
 * Usage:
 *   flux                   — interactive agent mode
 *   flux .                 — open FluxIDE Desktop IDE
 *   flux agent <prompt>    — run an autonomous agent task
 *   flux chat [prompt]     — interactive AI chat
 *   flux plan <prompt>     — generate a spec-first plan
 *   flux ask <prompt>      — ask a read-only question
 *   flux review <prompt>   — code review mode
 *   flux fix <prompt>      — debug and self-healing fix mode
 *   flux status            — show running tasks and agents
 *   flux tools             — list registered tools
 *   flux version           — show version
 */

import { WebSocket } from "ws";
import { createInterface } from "node:readline";
import { generateId } from "@fluxide/protocol";
import type {
  ServerMessage,
  StartSessionPayload,
  UserPromptPayload,
  StreamChunk,
} from "@fluxide/protocol";

// ─── Configuration ──────────────────────────────────────────
const DAEMON_URL =
  process.env["FLUX_DAEMON_URL"] ?? "ws://127.0.0.1:48100";

// ─── ANSI Colors ────────────────────────────────────────────
const color = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

function printBanner(): void {
  console.log(`
${color.cyan}${color.bold}  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║       ⚡ F L U X I D E   CLI ⚡       ║
  ║                                       ║
  ║   AI Software Engineering Platform    ║
  ║   v0.1.0                              ║
  ║                                       ║
  ╚═══════════════════════════════════════╝${color.reset}
`);
}

// ─── WebSocket Client ───────────────────────────────────────

class FluxClient {
  private ws: WebSocket | null = null;
  private connected = false;

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      this.ws = new WebSocket(DAEMON_URL);

      const timeout = setTimeout(() => {
        console.log(
          `${color.yellow}⚠️  Could not connect to fluxd at ${DAEMON_URL}${color.reset}`
        );
        console.log(
          `${color.dim}   Start the daemon: pnpm fluxd${color.reset}\n`
        );
        resolve(false);
      }, 3000);

      this.ws.on("open", () => {
        clearTimeout(timeout);
        this.connected = true;
        resolve(true);
      });

      this.ws.on("error", () => {
        clearTimeout(timeout);
        resolve(false);
      });

      this.ws.on("close", () => {
        this.connected = false;
      });
    });
  }

  onMessage(callback: (message: ServerMessage) => void): void {
    this.ws?.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString()) as ServerMessage;
        callback(message);
      } catch {
        // Skip unparseable messages
      }
    });
  }

  send(type: string, payload: unknown): void {
    if (this.ws && this.connected) {
      this.ws.send(
        JSON.stringify({
          id: generateId("msg"),
          type,
          payload,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  startSession(mode: string, workspacePath: string): void {
    this.send("session:start", {
      mode: mode as StartSessionPayload["mode"],
      workspacePath,
    } satisfies StartSessionPayload);
  }

  sendPrompt(content: string): void {
    this.send("user:prompt", {
      content,
    } satisfies UserPromptPayload);
  }

  disconnect(): void {
    this.ws?.close();
  }

  get isConnected(): boolean {
    return this.connected;
  }
}

// ─── Interactive REPL ───────────────────────────────────────

async function startInteractive(
  client: FluxClient,
  mode: string
): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
  console.log(
    `${color.green}✓ Connected to fluxd${color.reset} — Mode: ${color.bold}${modeLabel}${color.reset}`
  );
  console.log(
    `${color.dim}  Type your prompt and press Enter. Type "exit" to quit.${color.reset}\n`
  );

  // Start session
  client.startSession(mode, process.cwd());

  // Handle server messages
  client.onMessage((message) => {
    switch (message.type) {
      case "stream:chunk": {
        const chunk = message.payload as StreamChunk;
        if (chunk.type === "text_delta") {
          process.stdout.write(chunk.text);
        } else if (chunk.type === "thinking_delta") {
          process.stdout.write(
            `${color.dim}${chunk.text}${color.reset}`
          );
        } else if (chunk.type === "done") {
          process.stdout.write("\n\n");
          rl.prompt();
        } else if (chunk.type === "error") {
          console.error(
            `\n${color.red}❌ ${chunk.message}${color.reset}\n`
          );
          rl.prompt();
        }
        break;
      }
      case "agent:action": {
        const action = message.payload as unknown as Record<string, unknown>;
        if (action["action"] === "tool_call") {
          const tool = action["tool"];
          const input = JSON.stringify(action["input"] ?? {});
          console.log(`\n${color.magenta}🔧 Invoking tool: ${tool}(${input.slice(0, 80)})${color.reset}`);
        } else if (action["action"] === "tool_result") {
          const tool = action["tool"];
          const isError = action["isError"];
          const output = String(action["output"] ?? "").trim().slice(0, 100);
          console.log(`${isError ? color.red : color.green}   ⤷ ${tool} result: ${output || "done"}${color.reset}\n`);
        } else if (action["summary"]) {
          console.log(`\n${color.magenta}🔧 ${action["type"] ?? "action"}: ${action["summary"]}${color.reset}`);
        }
        break;
      }
      case "checkpoint:created": {
        const cp = message.payload as unknown as Record<string, unknown>;
        console.log(`${color.dim}💾 Checkpoint created: ${cp["description"] ?? cp["id"]}${color.reset}`);
        break;
      }
      case "permission:request": {
        const req = message.payload as { id?: string; description?: string; scope?: string };
        console.log(
          `\n${color.yellow}🔐 Permission required: ${req.description ?? "unknown"}${color.reset}`
        );
        rl.question(`${color.yellow}Allow once? [y/N] ${color.reset}`, (answer) => {
          client.send("permission:respond", {
            requestId: req.id,
            decision: answer.trim().toLowerCase() === "y" ? "allow_once" : "deny",
          });
          rl.prompt();
        });
        break;
      }
      case "error": {
        const err = message.payload as { message?: string };
        console.error(
          `\n${color.red}❌ Error: ${err.message ?? "Unknown"}${color.reset}\n`
        );
        rl.prompt();
        break;
      }
    }
  });

  rl.setPrompt(`${color.cyan}flux ❯${color.reset} `);
  rl.prompt();

  rl.on("line", (input) => {
    const trimmed = input.trim();

    if (trimmed === "exit" || trimmed === "quit") {
      console.log(`\n${color.dim}Goodbye! 👋${color.reset}\n`);
      client.disconnect();
      rl.close();
      process.exit(0);
    }

    if (trimmed === "") {
      rl.prompt();
      return;
    }

    // Send the prompt
    console.log();
    client.sendPrompt(trimmed);
  });

  rl.on("close", () => {
    client.disconnect();
    process.exit(0);
  });
}

// ─── One-Shot Command ───────────────────────────────────────

async function runOneShot(
  client: FluxClient,
  mode: string,
  prompt: string
): Promise<void> {
  return new Promise<void>((resolve) => {
    client.startSession(mode, process.cwd());

    client.onMessage((message) => {
      if (message.type === "stream:chunk") {
        const chunk = message.payload as StreamChunk;
        if (chunk.type === "text_delta") {
          process.stdout.write(chunk.text);
        } else if (chunk.type === "done") {
          process.stdout.write("\n");
          client.disconnect();
          resolve();
        }
      } else if (message.type === "permission:request") {
        const request = message.payload as { id?: string; description?: string };
        console.error(`\n${color.yellow}Permission denied in non-interactive mode: ${request.description ?? "unknown"}.${color.reset}`);
        client.send("permission:respond", { requestId: request.id, decision: "deny" });
      }
    });

    // Small delay to ensure session is initialized
    setTimeout(() => {
      client.sendPrompt(prompt);
    }, 100);
  });
}

// ─── Main ───────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  // Handle non-daemon commands
  if (command === "version" || command === "--version" || command === "-v") {
    console.log("flux v0.1.0");
    return;
  }

  if (command === "help" || command === "--help" || command === "-h") {
    printBanner();
    console.log(`${color.bold}Commands:${color.reset}`);
    console.log(`  ${color.cyan}flux${color.reset}                     Interactive agent mode`);
    console.log(`  ${color.cyan}flux agent${color.reset} <prompt>      Run autonomous agent task`);
    console.log(`  ${color.cyan}flux plan${color.reset} <prompt>       Generate spec-first plan`);
    console.log(`  ${color.cyan}flux ask${color.reset} <prompt>        Read-only investigation`);
    console.log(`  ${color.cyan}flux review${color.reset} <prompt>     Code review mode`);
    console.log(`  ${color.cyan}flux debug${color.reset} <prompt>      Debug mode`);
    console.log(`  ${color.cyan}flux status${color.reset}              Show running tasks`);
    console.log(`  ${color.cyan}flux tools${color.reset}               List registered tools`);
    console.log(`  ${color.cyan}flux version${color.reset}             Show version`);
    console.log();
    return;
  }

  printBanner();

  // Connect to daemon
  const client = new FluxClient();
  const connected = await client.connect();

  if (!connected) {
    process.exit(1);
  }

  // Section 56 CLI Commands: flux ., flux chat, flux fix, etc.
  if (command === "." || command === "open" || command === "desktop") {
    console.log(`${color.cyan}${color.bold}⚡ Launching FluxIDE Desktop IDE...${color.reset}`);
    const { exec } = await import("node:child_process");
    const desktopUrl = "http://127.0.0.1:48100/desktop";
    if (process.platform === "win32") {
      exec(`start "" "${desktopUrl}"`);
    } else if (process.platform === "darwin") {
      exec(`open "${desktopUrl}"`);
    } else {
      exec(`xdg-open "${desktopUrl}"`);
    }
    console.log(`${color.green}✓ FluxIDE Desktop launched at ${desktopUrl}${color.reset}\n`);
    client.disconnect();
    process.exit(0);
  }

  // Route to appropriate mode
  const modeCommands = [
    "agent",
    "chat",
    "plan",
    "ask",
    "review",
    "fix",
    "debug",
    "design",
    "research",
    "architect",
  ];

  if (command && modeCommands.includes(command)) {
    const prompt = args.slice(1).join(" ");
    const resolvedMode = command === "chat" ? "ask" : command === "fix" ? "debug" : command;
    if (prompt) {
      await runOneShot(client, resolvedMode, prompt);
    } else {
      await startInteractive(client, resolvedMode);
    }
  } else if (command === "status") {
    client.onMessage((msg) => {
      if (msg.type === "agent:status") {
        const payload = msg.payload as unknown as { status: string; uptime: number; toolsCount: number; providers: string[]; workspacePath: string };
        console.log(`\n${color.cyan}${color.bold}⚡ FluxIDE Daemon Status:${color.reset}\n`);
        console.log(`  ${color.bold}Health:${color.reset}     ${color.green}Healthy${color.reset}`);
        console.log(`  ${color.bold}Uptime:${color.reset}     ${Math.round(payload.uptime ?? 0)}s`);
        console.log(`  ${color.bold}Tools:${color.reset}      ${payload.toolsCount ?? 0} registered`);
        console.log(`  ${color.bold}Providers:${color.reset}  ${(payload.providers ?? []).join(", ") || "Ollama/Local"}`);
        console.log(`  ${color.bold}Workspace:${color.reset}  ${payload.workspacePath ?? process.cwd()}`);
        console.log();
        client.disconnect();
        process.exit(0);
      }
    });
    client.send("status:get", {});
  } else if (command === "director") {
    const intent = args.slice(1).join(" ");
    if (!intent) {
      console.log(`${color.yellow}Usage: flux director <engineering intent>${color.reset}`);
      client.disconnect();
      process.exit(1);
    }
    client.onMessage((msg) => {
      if (msg.type === "agent:action") {
        const payload = msg.payload as unknown as { action: string; plan: any };
        if (payload.action === "director_plan") {
          console.log(`\n${color.cyan}${color.bold}🎯 AI Director Plan:${color.reset}\n`);
          console.log(`  ${color.bold}Intent:${color.reset}     ${payload.plan.intent}`);
          console.log(`  ${color.bold}Category:${color.reset}   ${payload.plan.category}`);
          console.log(`  ${color.bold}Summary:${color.reset}    ${payload.plan.summary}\n`);
          console.log(`${color.bold}  Tasks (${payload.plan.graph.tasks.length}):${color.reset}`);
          for (const t of payload.plan.graph.tasks) {
            console.log(`    • [${color.yellow}${t.type}${color.reset}] ${color.bold}${t.title}${color.reset} (${color.cyan}@${t.assignedAgent}${color.reset})`);
          }
          console.log();
          client.disconnect();
          process.exit(0);
        }
      }
    });
    client.send("director:plan", { intent });
  } else if (command === "council") {
    const problem = args.slice(1).join(" ");
    if (!problem) {
      console.log(`${color.yellow}Usage: flux council <architectural question>${color.reset}`);
      client.disconnect();
      process.exit(1);
    }
    client.onMessage((msg) => {
      if (msg.type === "agent:action") {
        const payload = msg.payload as unknown as { action: string; deliberation: any };
        if (payload.action === "council_verdict") {
          console.log(`\n${color.cyan}${color.bold}🏛️ Engineering Council Deliberation:${color.reset}\n`);
          for (const op of payload.deliberation.opinions) {
            console.log(`  ${color.bold}${op.personaRole.toUpperCase()}:${color.reset} ${color.dim}${op.perspective}${color.reset}`);
            console.log(`    ${op.recommendation}\n`);
          }
          console.log(`  ${color.green}${color.bold}Consensus Verdict:${color.reset} ${payload.deliberation.consensusVerdict.recommendedApproach}`);
          console.log(`  ${color.dim}${payload.deliberation.consensusVerdict.rationale}${color.reset}\n`);
          client.disconnect();
          process.exit(0);
        }
      }
    });
    client.send("council:deliberate", { problem });
  } else if (command === "health") {
    client.onMessage((msg) => {
      if (msg.type === "agent:action") {
        const payload = msg.payload as unknown as { action: string; report: any };
        if (payload.action === "health_report") {
          console.log(`\n${color.cyan}${color.bold}🛡️ Project Health Dashboard:${color.reset}\n`);
          console.log(`  ${color.bold}Overall Score:${color.reset} ${color.green}${payload.report.overallScore}/100${color.reset}\n`);
          for (const [k, v] of Object.entries(payload.report.metrics as Record<string, any>)) {
            console.log(`  • ${k.toUpperCase().padEnd(14)}: ${color.bold}${v.score}/100${color.reset}`);
            for (const ev of v.evidence) {
              console.log(`    - ${color.dim}${ev}${color.reset}`);
            }
          }
          console.log();
          client.disconnect();
          process.exit(0);
        }
      }
    });
    client.send("health:get", {});
  } else {
    // Default: interactive agent mode
    const prompt = args.join(" ");
    if (prompt) {
      await runOneShot(client, "agent", prompt);
    } else {
      await startInteractive(client, "agent");
    }
  }
}

main().catch((error) => {
  console.error(`${color.red}Fatal error:${color.reset}`, error);
  process.exit(1);
});
