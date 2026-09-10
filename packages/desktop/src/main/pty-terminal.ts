/**
 * FluxIDE Desktop — Native Terminal Subprocess Manager
 *
 * Spawns native shell sessions (PowerShell, cmd.exe, bash) and bridges
 * standard streams to the IDE terminal panel.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";

export class TerminalSession extends EventEmitter {
  private proc: ChildProcess | null = null;
  public readonly id: string;
  private cwd: string;

  constructor(id: string, cwd = process.cwd()) {
    super();
    this.id = id;
    this.cwd = cwd;
  }

  /**
   * Start the shell session.
   */
  start(): void {
    const isWin = process.platform === "win32";
    const shell = isWin
      ? process.env["COMSPEC"] ?? "powershell.exe"
      : process.env["SHELL"] ?? "/bin/bash";

    const args = isWin && shell.toLowerCase().includes("powershell")
      ? ["-NoLogo", "-NoExit"]
      : [];

    this.proc = spawn(shell, args, {
      cwd: this.cwd,
      env: { ...process.env, TERM: "xterm-256color" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.proc.stdout?.on("data", (data) => {
      this.emit("data", data.toString("utf8"));
    });

    this.proc.stderr?.on("data", (data) => {
      this.emit("data", data.toString("utf8"));
    });

    this.proc.on("exit", (code) => {
      this.emit("exit", code);
      this.proc = null;
    });
  }

  /**
   * Write user keystrokes/commands to the terminal stdin.
   */
  write(data: string): void {
    if (this.proc && this.proc.stdin && !this.proc.stdin.destroyed) {
      this.proc.stdin.write(data);
    }
  }

  /**
   * Terminate the terminal session.
   */
  kill(): void {
    if (this.proc) {
      try {
        this.proc.kill();
      } catch {
        // ignore
      }
      this.proc = null;
    }
  }
}
